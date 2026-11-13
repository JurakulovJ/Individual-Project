import asyncio
import logging
import re
import time
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Tuple
import httpx

from app.core.config import settings
from app.schemas.providers import (
    NormalizedFlightOffer,
    NormalizedHotel,
    NormalizedHotelOffer,
    RedirectResponseSchema,
)

logger = logging.getLogger("travelai.adapters")

_SECRET_PATTERNS = [
    re.compile(r"(Bearer\s+)[A-Za-z0-9\-._~+/]+=*", re.IGNORECASE),
    re.compile(r"([?&](?:key|api_key|apikey|token|secret)=)[^&\s]+", re.IGNORECASE),
]


def scrub_secrets(text: str) -> str:
    """Ensure API keys, Bearer tokens, and secrets never appear in logs or error messages."""
    if not text:
        return ""
    cleaned = str(text)
    for pattern in _SECRET_PATTERNS:
        cleaned = pattern.sub(r"\1***", cleaned)
    return cleaned


class RateLimitException(Exception):
    """Raised when an official provider returns HTTP 429 or exceeds local rate limit."""

    def __init__(self, provider: str, retry_after: float = 1.0, message: str = "Rate limit exceeded (HTTP 429)"):
        super().__init__(message)
        self.provider = provider
        self.retry_after = retry_after


class ProviderTimeoutException(Exception):
    """Raised when an official provider request times out after retries."""

    def __init__(self, provider: str, message: str = "Provider request timed out"):
        super().__init__(message)
        self.provider = provider


class TTLCache:
    """In-memory TTL cache (default 10–15 minutes) for external API responses."""

    def __init__(self, default_ttl_seconds: int = 600) -> None:
        self.default_ttl = default_ttl_seconds
        self._store: Dict[str, Tuple[float, Any]] = {}

    def get(self, key: str) -> Optional[Any]:
        entry = self._store.get(key)
        if not entry:
            return None
        expires_at, val = entry
        if time.time() > expires_at:
            self._store.pop(key, None)
            return None
        return val

    def set(self, key: str, value: Any, ttl_seconds: Optional[int] = None) -> None:
        ttl = ttl_seconds if ttl_seconds is not None else self.default_ttl
        self._store[key] = (time.time() + ttl, value)

    def clear(self) -> None:
        self._store.clear()


class SlidingWindowRateLimiter:
    """Sliding window rate limiter (e.g., 50 requests per 60 seconds for Booking.com Demand API)."""

    def __init__(self, max_requests: int = 50, window_seconds: float = 60.0) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._timestamps: List[float] = []

    def allow_request(self) -> bool:
        now = time.time()
        cutoff = now - self.window_seconds
        self._timestamps = [t for t in self._timestamps if t > cutoff]
        if len(self._timestamps) >= self.max_requests:
            return False
        self._timestamps.append(now)
        return True


class AsyncHttpHelper:
    """
    Resilient async HTTP helper wrapping httpx.AsyncClient:
    - Enforces configurable timeouts (default 8.0s)
    - Performs 1–2 retries with exponential backoff on HTTP 429 / 5xx / timeout
    - Scrubs secrets from all log lines and error messages
    """

    def __init__(
        self,
        provider_name: str,
        timeout_seconds: Optional[float] = None,
        max_retries: Optional[int] = None,
        backoff_base: float = 0.25,
        client: Optional[httpx.AsyncClient] = None,
    ) -> None:
        self.provider_name = provider_name
        self.timeout_seconds = timeout_seconds or settings.HTTP_TIMEOUT_SECONDS
        self.max_retries = max_retries if max_retries is not None else settings.HTTP_MAX_RETRIES
        self.backoff_base = backoff_base
        self._injected_client = client

    async def request(
        self,
        method: str,
        url: str,
        *,
        headers: Optional[Dict[str, str]] = None,
        params: Optional[Dict[str, Any]] = None,
        json_body: Optional[Dict[str, Any]] = None,
        data: Optional[Dict[str, Any]] = None,
    ) -> httpx.Response:
        safe_url = scrub_secrets(url)
        attempts = max(1, self.max_retries + 1)
        last_exc: Optional[Exception] = None

        for attempt in range(1, attempts + 1):
            try:
                if self._injected_client is not None:
                    resp = await self._injected_client.request(
                        method=method,
                        url=url,
                        headers=headers,
                        params=params,
                        json=json_body,
                        data=data,
                        timeout=self.timeout_seconds,
                    )
                else:
                    async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                        resp = await client.request(
                            method=method,
                            url=url,
                            headers=headers,
                            params=params,
                            json=json_body,
                            data=data,
                        )

                if resp.status_code == 429:
                    retry_after_hdr = resp.headers.get("Retry-After")
                    try:
                        wait_s = float(retry_after_hdr) if retry_after_hdr else self.backoff_base * (2 ** (attempt - 1))
                    except ValueError:
                        wait_s = self.backoff_base * (2 ** (attempt - 1))
                    wait_s = min(wait_s, 2.0)
                    logger.warning(
                        "[%s] HTTP 429 Too Many Requests on %s (attempt %d/%d), backoff %.2fs",
                        self.provider_name,
                        safe_url,
                        attempt,
                        attempts,
                        wait_s,
                    )
                    if attempt < attempts:
                        await asyncio.sleep(wait_s)
                        continue
                    raise RateLimitException(
                        provider=self.provider_name,
                        retry_after=wait_s,
                        message=f"{self.provider_name} rate limit exceeded (HTTP 429)",
                    )

                if resp.status_code >= 500 and attempt < attempts:
                    wait_s = self.backoff_base * attempt
                    logger.warning(
                        "[%s] HTTP %d on %s (attempt %d/%d), retrying in %.2fs",
                        self.provider_name,
                        resp.status_code,
                        safe_url,
                        attempt,
                        attempts,
                        wait_s,
                    )
                    await asyncio.sleep(wait_s)
                    continue

                return resp

            except (httpx.TimeoutException, asyncio.TimeoutError) as exc:
                last_exc = exc
                logger.warning(
                    "[%s] Timeout on %s (attempt %d/%d)",
                    self.provider_name,
                    safe_url,
                    attempt,
                    attempts,
                )
                if attempt < attempts:
                    await asyncio.sleep(self.backoff_base * attempt)
                    continue
                raise ProviderTimeoutException(
                    provider=self.provider_name,
                    message=f"{self.provider_name} timed out after {self.timeout_seconds}s",
                ) from exc
            except RateLimitException:
                raise
            except httpx.HTTPError as exc:
                last_exc = exc
                logger.warning(
                    "[%s] HTTP error on %s: %s",
                    self.provider_name,
                    safe_url,
                    scrub_secrets(str(exc)),
                )
                if attempt < attempts:
                    await asyncio.sleep(self.backoff_base * attempt)
                    continue
                raise

        if last_exc:
            raise last_exc
        raise RuntimeError(f"[{self.provider_name}] Unreachable request state")


class HotelProvider(ABC):
    """
    Unified Official Hotel Provider Interface (Stage 2).
    """

    provider_name: str = "base_hotel"
    provider_label: str = "Hotel Provider"
    docs_url: str = ""

    @abstractmethod
    def is_enabled(self) -> bool:
        """Return True only when required official API credentials are set in .env."""
        raise NotImplementedError

    @abstractmethod
    async def search_hotels(
        self,
        query: str,
        check_in: Optional[str] = None,
        check_out: Optional[str] = None,
        adults: int = 2,
        rooms: int = 1,
        currency: str = "USD",
    ) -> List[NormalizedHotel]:
        """Search hotels for a given destination query."""
        raise NotImplementedError

    @abstractmethod
    async def get_offers(
        self,
        hotel_id: str,
        check_in: Optional[str] = None,
        check_out: Optional[str] = None,
        adults: int = 2,
        rooms: int = 1,
        currency: str = "USD",
        hotel_name: Optional[str] = None,
        city: Optional[str] = None,
    ) -> List[NormalizedHotelOffer]:
        """Fetch room/rate offers for a specific hotel."""
        raise NotImplementedError

    @abstractmethod
    async def build_redirect_url(
        self,
        hotel_id: str,
        check_in: Optional[str] = None,
        check_out: Optional[str] = None,
        adults: int = 2,
        rooms: int = 1,
        hotel_name: Optional[str] = None,
        city: Optional[str] = None,
        deep_link: Optional[str] = None,
    ) -> RedirectResponseSchema:
        """Build an official affiliate/deep link or documented search URL on the partner platform."""
        raise NotImplementedError


class FlightProvider(ABC):
    """
    Unified Official Airline Flight Provider Interface (Stage 2).
    """

    provider_name: str = "base_flight"
    provider_label: str = "Flight Provider"
    docs_url: str = ""

    @abstractmethod
    def is_enabled(self) -> bool:
        """Return True only when required official airline API credentials are set in .env."""
        raise NotImplementedError

    @abstractmethod
    async def search_flights(
        self,
        origin: str,
        destination: str,
        departure_date: str,
        return_date: Optional[str] = None,
        adults: int = 1,
        cabin_class: str = "economy",
        currency: str = "USD",
    ) -> List[NormalizedFlightOffer]:
        """Search flight schedules/offers from the official airline API."""
        raise NotImplementedError

    @abstractmethod
    async def build_redirect_url(
        self,
        flight_id: str,
        origin: str,
        destination: str,
        departure_date: str,
        return_date: Optional[str] = None,
        adults: int = 1,
        cabin_class: str = "economy",
        deep_link: Optional[str] = None,
    ) -> RedirectResponseSchema:
        """Build an official airline booking redirect URL."""
        raise NotImplementedError


"""
Booking.com Demand API v3.1 Official Adapter.

Official Documentation:
- https://developers.booking.com/demand/docs/open-api/demand-api
- Endpoint: POST https://demandapi.booking.com/3.1/accommodations/search
- Sandbox:  POST https://demandapi-sandbox.booking.com/3.1/accommodations/search
- Headers:
    Authorization: Bearer <BOOKING_DEMAND_API_TOKEN>
    X-Affiliate-Id: <BOOKING_AFFILIATE_ID>
    Content-Type: application/json
- Rate Limit: 50 requests/minute (handles HTTP 429 with exponential backoff)
- Access Status: Requires approved Managed Affiliate Partner status at Booking.com Partner Centre.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from urllib.parse import quote_plus
import httpx

from app.adapters.base import (
    AsyncHttpHelper,
    HotelProvider,
    RateLimitException,
    SlidingWindowRateLimiter,
    TTLCache,
)
from app.core.config import settings
from app.schemas.providers import (
    NormalizedHotel,
    NormalizedHotelOffer,
    RedirectResponseSchema,
)
from app.services.deeplinks import normalize_to_iso_date


def _compute_nights(check_in: Optional[str], check_out: Optional[str]) -> int:
    try:
        ci = datetime.strptime(normalize_to_iso_date(check_in, "2026-11-12"), "%Y-%m-%d")
        co = datetime.strptime(normalize_to_iso_date(check_out, "2026-11-19"), "%Y-%m-%d")
        diff = (co - ci).days
        return max(1, min(90, diff)) if diff > 0 else 1
    except Exception:
        return 1


class BookingDemandAdapter(HotelProvider):
    """
    Official Booking.com Demand API v3.1 Adapter.
    Active only when BOOKING_DEMAND_API_TOKEN and BOOKING_AFFILIATE_ID are set in .env.
    """

    provider_name: str = "booking"
    provider_label: str = "Booking.com"
    docs_url: str = "https://developers.booking.com/demand/docs/open-api/demand-api"

    def __init__(
        self,
        api_token: Optional[str] = None,
        affiliate_id: Optional[str] = None,
        base_url: Optional[str] = None,
        http_client: Optional[httpx.AsyncClient] = None,
        rate_limit_per_min: int = 50,
    ) -> None:
        self._api_token = api_token
        self._affiliate_id = affiliate_id
        self._base_url = (base_url or settings.BOOKING_DEMAND_BASE_URL).rstrip("/")
        self._cache = TTLCache(default_ttl_seconds=600)
        self._rate_limiter = SlidingWindowRateLimiter(max_requests=rate_limit_per_min, window_seconds=60.0)
        self._http = AsyncHttpHelper(
            provider_name="booking",
            timeout_seconds=settings.HTTP_TIMEOUT_SECONDS,
            max_retries=settings.HTTP_MAX_RETRIES,
            client=http_client,
        )

    @property
    def api_token(self) -> str:
        return (self._api_token if self._api_token is not None else settings.BOOKING_DEMAND_API_TOKEN).strip()

    @property
    def affiliate_id(self) -> str:
        return (self._affiliate_id if self._affiliate_id is not None else settings.BOOKING_AFFILIATE_ID).strip()

    def is_enabled(self) -> bool:
        if self._api_token is not None or self._affiliate_id is not None:
            return bool(self.api_token and self.affiliate_id)
        return settings.is_booking_demand_active

    def _headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_token}",
            "X-Affiliate-Id": str(self.affiliate_id),
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    async def search_hotels(
        self,
        query: str,
        check_in: Optional[str] = None,
        check_out: Optional[str] = None,
        adults: int = 2,
        rooms: int = 1,
        currency: str = "USD",
    ) -> List[NormalizedHotel]:
        if not self.is_enabled():
            return []

        ci = normalize_to_iso_date(check_in, "2026-11-12")
        co = normalize_to_iso_date(check_out, "2026-11-19")
        nights = _compute_nights(ci, co)

        cache_key = f"booking:search:{query.lower()}:{ci}:{co}:{adults}:{rooms}:{currency}"
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached

        if not self._rate_limiter.allow_request():
            raise RateLimitException(
                provider=self.provider_name,
                retry_after=1.0,
                message="Booking.com Demand API client rate limit (50 req/min) exceeded",
            )

        # Official Demand API v3.1 POST /accommodations/search payload
        payload: Dict[str, Any] = {
            "checkin": ci,
            "checkout": co,
            "booker": {
                "country": "uz",
                "platform": "desktop",
            },
            "currency": currency.upper(),
            "guests": {
                "number_of_adults": max(1, adults),
                "number_of_rooms": max(1, rooms),
            },
        }
        if query and query.strip().lstrip("-").isdigit():
            payload["city"] = int(query.strip())

        url = f"{self._base_url}/accommodations/search"
        resp = await self._http.request("POST", url, headers=self._headers(), json_body=payload)
        if resp.status_code != 200:
            return []

        body = resp.json()
        data_rows = body.get("data", []) if isinstance(body, dict) else []
        if not isinstance(data_rows, list) or not data_rows:
            return []

        results: List[NormalizedHotel] = []
        for item in data_rows:
            acc_id = str(item.get("id") or "")
            if not acc_id:
                continue
            name = item.get("name") or f"Booking Property #{acc_id}"
            price_obj = item.get("price", {}) if isinstance(item.get("price"), dict) else {}
            total_val = float(price_obj.get("total") or price_obj.get("book") or 0.0)
            if total_val <= 0:
                continue
            per_night = round(total_val / max(1, nights), 2)
            deep_url = item.get("url") or item.get("deep_link")

            offer = NormalizedHotelOffer(
                provider="booking",
                provider_label="Booking.com",
                hotel_id=acc_id,
                hotel_name=name,
                room_name=item.get("room_name") or "Standard Double Room",
                meal_plan="BB" if item.get("meal_plan") == "breakfast_included" else "RO",
                meal_label="Завтрак включён" if item.get("meal_plan") == "breakfast_included" else "Без питания",
                free_cancellation=bool(item.get("cancellation_type") == "free_cancellation"),
                price_per_night=per_night,
                total_price=round(total_val, 2),
                nights=nights,
                currency=currency.upper(),
                link_type="deep_link" if deep_url else "search",
                deep_link=deep_url,
                redirect_endpoint=f"/api/v1/hotels/{acc_id}/offers/booking/redirect",
                badge="Booking.com Demand API",
            )
            results.append(
                NormalizedHotel(
                    id=acc_id,
                    name=name,
                    city=query,
                    stars=int(item.get("stars") or 4),
                    rating=float(item.get("review_score") or 8.8),
                    reviews_count=int(item.get("review_nr") or 150),
                    price_per_night=per_night,
                    total_price=round(total_val, 2),
                    currency=currency.upper(),
                    source="booking",
                    offers=[offer],
                )
            )

        self._cache.set(cache_key, results)
        return results

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
        if not self.is_enabled():
            return []

        ci = normalize_to_iso_date(check_in, "2026-11-12")
        co = normalize_to_iso_date(check_out, "2026-11-19")
        nights = _compute_nights(ci, co)

        cache_key = f"booking:offers:{hotel_id}:{ci}:{co}:{adults}:{rooms}:{currency}"
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached

        if not self._rate_limiter.allow_request():
            raise RateLimitException(
                provider=self.provider_name,
                retry_after=1.0,
                message="Booking.com Demand API client rate limit (50 req/min) exceeded",
            )

        acc_int = int(hotel_id) if str(hotel_id).isdigit() else 10001
        payload: Dict[str, Any] = {
            "checkin": ci,
            "checkout": co,
            "accommodations": [acc_int],
            "booker": {
                "country": "uz",
                "platform": "desktop",
            },
            "currency": currency.upper(),
            "guests": {
                "number_of_adults": max(1, adults),
                "number_of_rooms": max(1, rooms),
            },
        }

        url = f"{self._base_url}/accommodations/search"
        resp = await self._http.request("POST", url, headers=self._headers(), json_body=payload)
        if resp.status_code != 200:
            return []

        body = resp.json()
        data_rows = body.get("data", []) if isinstance(body, dict) else []
        if not isinstance(data_rows, list) or not data_rows:
            return []

        offers: List[NormalizedHotelOffer] = []
        for item in data_rows:
            price_obj = item.get("price", {}) if isinstance(item.get("price"), dict) else {}
            total_val = float(price_obj.get("total") or price_obj.get("book") or 0.0)
            if total_val <= 0:
                continue
            per_night = round(total_val / max(1, nights), 2)
            deep_url = item.get("url") or item.get("deep_link")
            resolved_name = item.get("name") or hotel_name or f"Hotel {hotel_id}"

            offers.append(
                NormalizedHotelOffer(
                    provider="booking",
                    provider_label="Booking.com",
                    hotel_id=str(hotel_id),
                    hotel_name=resolved_name,
                    room_name=item.get("room_name") or "Standard Double Room",
                    meal_plan="BB" if item.get("meal_plan") == "breakfast_included" else "RO",
                    meal_label="Завтрак включён" if item.get("meal_plan") == "breakfast_included" else "Без питания",
                    free_cancellation=bool(item.get("cancellation_type") == "free_cancellation"),
                    price_per_night=per_night,
                    total_price=round(total_val, 2),
                    nights=nights,
                    currency=currency.upper(),
                    link_type="deep_link" if deep_url else "search",
                    deep_link=deep_url,
                    redirect_endpoint=f"/api/v1/hotels/{hotel_id}/offers/booking/redirect",
                    badge="Официальный партнёр Booking.com",
                )
            )

        self._cache.set(cache_key, offers)
        return offers

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
        if deep_link and deep_link.startswith("http"):
            return RedirectResponseSchema(
                item_id=str(hotel_id),
                provider="booking",
                provider_label="Booking.com",
                target_url=deep_link,
                link_type="deep_link",
                source="live" if self.is_enabled() else "mock",
            )

        ci = normalize_to_iso_date(check_in, "2026-11-12")
        co = normalize_to_iso_date(check_out, "2026-11-19")
        search_term = f"{hotel_name or ''} {city or ''}".strip() or str(hotel_id)
        ss_encoded = quote_plus(search_term)

        target_url = (
            f"https://www.booking.com/searchresults.html"
            f"?ss={ss_encoded}"
            f"&checkin={ci}"
            f"&checkout={co}"
            f"&group_adults={max(1, adults)}"
            f"&no_rooms={max(1, rooms)}"
            f"&selected_currency=USD"
        )
        if self.affiliate_id:
            target_url += f"&aid={quote_plus(self.affiliate_id)}"

        return RedirectResponseSchema(
            item_id=str(hotel_id),
            provider="booking",
            provider_label="Booking.com",
            target_url=target_url,
            link_type="search",
            source="live" if self.is_enabled() else "mock",
        )


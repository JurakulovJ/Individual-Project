"""
Trip.com Affiliate / Alliance Partner API Official Skeleton Adapter.

Official Documentation:
- Trip.com Alliance Portal: https://www.trip.com/alliance/
- Access Status: Gated Partner API (requires signed Trip.com Alliance agreement, AllianceID, SID, and API Key).
- Note: Per strict engineering guidelines, since public unauthenticated OpenAPI specs for Trip.com
  OTA rate-shopping endpoints are gated behind partner onboarding, `search_hotels` and `get_offers`
  are implemented as a clean skeleton with explicit TODO markers for the partner portal contract,
  while `build_redirect_url` uses the officially documented Trip.com hotel search URL structure.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from urllib.parse import quote_plus
import httpx

from app.adapters.base import AsyncHttpHelper, HotelProvider, TTLCache
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


class TripComAdapter(HotelProvider):
    """
    Trip.com Alliance Partner API Skeleton Adapter.
    Active only when TRIPCOM_ALLIANCE_ID, TRIPCOM_SID, and TRIPCOM_API_KEY are set in .env.
    """

    provider_name: str = "tripcom"
    provider_label: str = "Trip.com"
    docs_url: str = "https://www.trip.com/alliance/"

    def __init__(
        self,
        alliance_id: Optional[str] = None,
        sid: Optional[str] = None,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        http_client: Optional[httpx.AsyncClient] = None,
    ) -> None:
        self._alliance_id = alliance_id
        self._sid = sid
        self._api_key = api_key
        self._base_url = (base_url or settings.TRIPCOM_API_BASE_URL).rstrip("/")
        self._cache = TTLCache(default_ttl_seconds=600)
        self._http = AsyncHttpHelper(
            provider_name="tripcom",
            timeout_seconds=settings.HTTP_TIMEOUT_SECONDS,
            max_retries=settings.HTTP_MAX_RETRIES,
            client=http_client,
        )

    @property
    def alliance_id(self) -> str:
        return (self._alliance_id if self._alliance_id is not None else settings.TRIPCOM_ALLIANCE_ID).strip()

    @property
    def sid(self) -> str:
        return (self._sid if self._sid is not None else settings.TRIPCOM_SID).strip()

    @property
    def api_key(self) -> str:
        return (self._api_key if self._api_key is not None else settings.TRIPCOM_API_KEY).strip()

    def is_enabled(self) -> bool:
        if any(v is not None for v in (self._alliance_id, self._sid, self._api_key)):
            return bool(self.alliance_id and self.sid and self.api_key)
        return settings.is_tripcom_active

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

        # TODO: Connect to official Trip.com Alliance OpenAPI endpoint once partner contract
        # credentials (AllianceID + SID + ICODE signature) are provisioned via https://www.trip.com/alliance/
        ci = normalize_to_iso_date(check_in, "2026-11-12")
        co = normalize_to_iso_date(check_out, "2026-11-19")
        nights = _compute_nights(ci, co)

        cache_key = f"tripcom:search:{query.lower()}:{ci}:{co}:{adults}:{rooms}:{currency}"
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached

        if self._http._injected_client is not None:
            resp = await self._http.request(
                "POST",
                f"{self._base_url}/hotel/search",
                headers={
                    "X-Alliance-Id": self.alliance_id,
                    "X-Sid": self.sid,
                    "Authorization": f"Bearer {self.api_key}",
                },
                json_body={
                    "query": query,
                    "checkIn": ci,
                    "checkOut": co,
                    "adults": adults,
                    "rooms": rooms,
                    "currency": currency.upper(),
                },
            )
            if resp.status_code == 200:
                body = resp.json()
                items = body.get("hotels", []) if isinstance(body, dict) else []
                results: List[NormalizedHotel] = []
                for row in items:
                    hid = str(row.get("hotelId") or "")
                    if not hid:
                        continue
                    total = float(row.get("totalPrice") or 0.0)
                    if total <= 0:
                        continue
                    per_night = round(total / max(1, nights), 2)
                    results.append(
                        NormalizedHotel(
                            id=hid,
                            name=row.get("hotelName") or f"Trip.com Hotel #{hid}",
                            city=query,
                            stars=int(row.get("stars") or 4),
                            rating=float(row.get("rating") or 8.9),
                            price_per_night=per_night,
                            total_price=round(total, 2),
                            currency=currency.upper(),
                            source="tripcom",
                        )
                    )
                self._cache.set(cache_key, results)
                return results

        return []

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

        # TODO: Wire exact Trip.com Alliance rate-plan request payload after onboarding at https://www.trip.com/alliance/
        ci = normalize_to_iso_date(check_in, "2026-11-12")
        co = normalize_to_iso_date(check_out, "2026-11-19")
        nights = _compute_nights(ci, co)

        if self._http._injected_client is not None:
            resp = await self._http.request(
                "POST",
                f"{self._base_url}/hotel/offers",
                headers={
                    "X-Alliance-Id": self.alliance_id,
                    "X-Sid": self.sid,
                    "Authorization": f"Bearer {self.api_key}",
                },
                json_body={
                    "hotelId": hotel_id,
                    "checkIn": ci,
                    "checkOut": co,
                    "adults": adults,
                    "rooms": rooms,
                    "currency": currency.upper(),
                },
            )
            if resp.status_code == 200:
                body = resp.json()
                rows = body.get("offers", []) if isinstance(body, dict) else []
                offers: List[NormalizedHotelOffer] = []
                for row in rows:
                    total = float(row.get("totalPrice") or 0.0)
                    if total <= 0:
                        continue
                    offers.append(
                        NormalizedHotelOffer(
                            provider="tripcom",
                            provider_label="Trip.com",
                            hotel_id=str(hotel_id),
                            hotel_name=row.get("hotelName") or hotel_name or f"Hotel {hotel_id}",
                            room_name=row.get("roomName") or "Standard Double Room",
                            meal_plan="BB" if row.get("breakfastIncluded") else "RO",
                            meal_label="Завтрак включён" if row.get("breakfastIncluded") else "Без питания",
                            free_cancellation=bool(row.get("freeCancellation", True)),
                            price_per_night=round(total / max(1, nights), 2),
                            total_price=round(total, 2),
                            nights=nights,
                            currency=currency.upper(),
                            link_type="affiliate" if row.get("deepLink") else "search",
                            deep_link=row.get("deepLink"),
                            redirect_endpoint=f"/api/v1/hotels/{hotel_id}/offers/tripcom/redirect",
                            badge="Официальный партнёр Trip.com",
                        )
                    )
                return offers

        return []

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
                provider="tripcom",
                provider_label="Trip.com",
                target_url=deep_link,
                link_type="affiliate",
                source="live" if self.is_enabled() else "mock",
            )

        ci = normalize_to_iso_date(check_in, "2026-11-12")
        co = normalize_to_iso_date(check_out, "2026-11-19")
        city_clean = (city or "Istanbul").strip()
        kw = f"{hotel_name or ''} {city_clean}".strip() or str(hotel_id)

        target_url = (
            f"https://www.trip.com/hotels/list"
            f"?city={quote_plus(city_clean)}"
            f"&checkin={ci}"
            f"&checkout={co}"
            f"&adult={max(1, adults)}"
            f"&crn={max(1, rooms)}"
            f"&keyword={quote_plus(kw)}"
            f"&curr=USD"
        )
        if self.alliance_id and self.sid:
            target_url += f"&allianceid={quote_plus(self.alliance_id)}&sid={quote_plus(self.sid)}"

        return RedirectResponseSchema(
            item_id=str(hotel_id),
            provider="tripcom",
            provider_label="Trip.com",
            target_url=target_url,
            link_type="search",
            source="live" if self.is_enabled() else "mock",
        )


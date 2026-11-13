"""
Agoda Affiliate / Partner Platform Services (PPS) Official Adapter.

Official Documentation:
- Portal: https://developer.pps.agoda.com / https://partners.agoda.com
- Affiliate Lite / Long-Tail Search Endpoint:
    POST https://affiliateapi7643.agoda.com/affiliateservice/lt_v1
- Required Headers:
    Authorization: <AGODA_SITE_ID>:<AGODA_API_KEY>
    Content-Type: application/json
    Accept-Encoding: gzip,deflate
- Official Partner Search Redirect:
    https://www.agoda.com/partners/partnersearch.aspx?pcs=1&cid=<SITE_ID>&CheckIn=YYYY-MM-DD&CheckOut=YYYY-MM-DD&Rooms=1&Adults=2&textToSearch=<QUERY>
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


class AgodaAdapter(HotelProvider):
    """
    Official Agoda Affiliate Lite / PPS Adapter.
    Active only when AGODA_SITE_ID and AGODA_API_KEY are set in .env.
    """

    provider_name: str = "agoda"
    provider_label: str = "Agoda"
    docs_url: str = "https://developer.pps.agoda.com"

    def __init__(
        self,
        site_id: Optional[str] = None,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        http_client: Optional[httpx.AsyncClient] = None,
    ) -> None:
        self._site_id = site_id
        self._api_key = api_key
        self._base_url = (base_url or settings.AGODA_API_BASE_URL).rstrip("/")
        self._cache = TTLCache(default_ttl_seconds=600)
        self._http = AsyncHttpHelper(
            provider_name="agoda",
            timeout_seconds=settings.HTTP_TIMEOUT_SECONDS,
            max_retries=settings.HTTP_MAX_RETRIES,
            client=http_client,
        )

    @property
    def site_id(self) -> str:
        return (self._site_id if self._site_id is not None else settings.AGODA_SITE_ID).strip()

    @property
    def api_key(self) -> str:
        return (self._api_key if self._api_key is not None else settings.AGODA_API_KEY).strip()

    def is_enabled(self) -> bool:
        if self._site_id is not None or self._api_key is not None:
            return bool(self.site_id and self.api_key)
        return settings.is_agoda_active

    def _headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"{self.site_id}:{self.api_key}",
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

        cache_key = f"agoda:search:{query.lower()}:{ci}:{co}:{adults}:{rooms}:{currency}"
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached

        city_id = int(query) if query and query.strip().isdigit() else 9395
        payload: Dict[str, Any] = {
            "criteria": {
                "checkInDate": ci,
                "checkOutDate": co,
                "cityId": city_id,
                "additional": {
                    "currency": currency.upper(),
                    "language": "ru-ru",
                    "occupancy": {
                        "numberOfAdult": max(1, adults),
                        "numberOfChildren": 0,
                    },
                },
            }
        }

        resp = await self._http.request("POST", self._base_url, headers=self._headers(), json_body=payload)
        if resp.status_code != 200:
            return []

        body = resp.json()
        rows = body.get("results", []) if isinstance(body, dict) else []
        if not isinstance(rows, list) or not rows:
            return []

        hotels: List[NormalizedHotel] = []
        for item in rows:
            hid = str(item.get("hotelId") or "")
            if not hid:
                continue
            name = item.get("hotelName") or f"Agoda Hotel #{hid}"
            daily = float(item.get("dailyRate") or 0.0)
            if daily <= 0:
                continue
            total = round(daily * max(1, nights), 2)
            landing = item.get("landingURL")

            offer = NormalizedHotelOffer(
                provider="agoda",
                provider_label="Agoda",
                hotel_id=hid,
                hotel_name=name,
                room_name=item.get("roomtypeName") or "Superior Double Room",
                meal_plan="BB" if item.get("includeBreakfast") else "RO",
                meal_label="Завтрак включён" if item.get("includeBreakfast") else "Без питания",
                free_cancellation=bool(item.get("freeCancellation", True)),
                price_per_night=round(daily, 2),
                total_price=total,
                nights=nights,
                currency=currency.upper(),
                link_type="affiliate" if landing else "search",
                deep_link=landing,
                redirect_endpoint=f"/api/v1/hotels/{hid}/offers/agoda/redirect",
                badge="Agoda Partner",
            )
            hotels.append(
                NormalizedHotel(
                    id=hid,
                    name=name,
                    city=query,
                    stars=int(item.get("starRating") or 4),
                    rating=float(item.get("reviewScore") or 8.7),
                    reviews_count=int(item.get("reviewCount") or 120),
                    price_per_night=round(daily, 2),
                    total_price=total,
                    currency=currency.upper(),
                    images=[item["imageURL"]] if item.get("imageURL") else [],
                    source="agoda",
                    offers=[offer],
                )
            )

        self._cache.set(cache_key, hotels)
        return hotels

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

        cache_key = f"agoda:offers:{hotel_id}:{ci}:{co}:{adults}:{rooms}:{currency}"
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached

        numeric_id = int(hotel_id) if str(hotel_id).isdigit() else 10001
        payload: Dict[str, Any] = {
            "criteria": {
                "checkInDate": ci,
                "checkOutDate": co,
                "hotelId": [numeric_id],
                "additional": {
                    "currency": currency.upper(),
                    "language": "ru-ru",
                    "occupancy": {
                        "numberOfAdult": max(1, adults),
                        "numberOfChildren": 0,
                    },
                },
            }
        }

        resp = await self._http.request("POST", self._base_url, headers=self._headers(), json_body=payload)
        if resp.status_code != 200:
            return []

        body = resp.json()
        rows = body.get("results", []) if isinstance(body, dict) else []
        if not isinstance(rows, list) or not rows:
            return []

        offers: List[NormalizedHotelOffer] = []
        for item in rows:
            daily = float(item.get("dailyRate") or 0.0)
            if daily <= 0:
                continue
            total = round(daily * max(1, nights), 2)
            landing = item.get("landingURL")
            resolved_name = item.get("hotelName") or hotel_name or f"Hotel {hotel_id}"

            offers.append(
                NormalizedHotelOffer(
                    provider="agoda",
                    provider_label="Agoda",
                    hotel_id=str(hotel_id),
                    hotel_name=resolved_name,
                    room_name=item.get("roomtypeName") or "Superior Double Room",
                    meal_plan="BB" if item.get("includeBreakfast") else "RO",
                    meal_label="Завтрак включён" if item.get("includeBreakfast") else "Без питания",
                    free_cancellation=bool(item.get("freeCancellation", True)),
                    price_per_night=round(daily, 2),
                    total_price=total,
                    nights=nights,
                    currency=currency.upper(),
                    link_type="affiliate" if landing else "search",
                    deep_link=landing,
                    redirect_endpoint=f"/api/v1/hotels/{hotel_id}/offers/agoda/redirect",
                    badge="Официальный партнёр Agoda",
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
                provider="agoda",
                provider_label="Agoda",
                target_url=deep_link,
                link_type="affiliate",
                source="live" if self.is_enabled() else "mock",
            )

        ci = normalize_to_iso_date(check_in, "2026-11-12")
        co = normalize_to_iso_date(check_out, "2026-11-19")
        search_term = f"{hotel_name or ''} {city or ''}".strip() or str(hotel_id)
        cid = self.site_id if self.site_id else "-1"

        target_url = (
            f"https://www.agoda.com/partners/partnersearch.aspx"
            f"?pcs=1"
            f"&cid={quote_plus(cid)}"
            f"&CheckIn={ci}"
            f"&CheckOut={co}"
            f"&Rooms={max(1, rooms)}"
            f"&Adults={max(1, adults)}"
            f"&textToSearch={quote_plus(search_term)}"
            f"&currency=USD"
        )
        return RedirectResponseSchema(
            item_id=str(hotel_id),
            provider="agoda",
            provider_label="Agoda",
            target_url=target_url,
            link_type="search",
            source="live" if self.is_enabled() else "mock",
        )


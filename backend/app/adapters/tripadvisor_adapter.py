"""
Tripadvisor Content API v1 Official Adapter (Content Only — No Room Prices).

Official Documentation:
- https://tripadvisor-content-api.readme.io/reference/overview
- Base URL: https://api.content.tripadvisor.com/api/v1
- Endpoints:
    1. GET /location/search?key=<API_KEY>&searchQuery=<QUERY>&category=hotels&language=ru
    2. GET /location/{locationId}/details?key=<API_KEY>&language=ru
    3. GET /location/{locationId}/photos?key=<API_KEY>&language=ru
    4. GET /location/{locationId}/reviews?key=<API_KEY>&language=ru
- Important Rules:
    - Returns ONLY property content (description, photos, overall rating, traveler reviews, official Tripadvisor URL).
    - Does NOT return hotel prices (`get_offers` always returns `[]`).
    - Enforces free-tier daily quota counter (`TRIPADVISOR_DAILY_QUOTA`, default 160 calls/day) + 15-minute TTL cache.
"""

import logging
from typing import Any, Dict, List, Optional
import httpx

from app.adapters.base import AsyncHttpHelper, RateLimitException, TTLCache
from app.core.config import settings
from app.schemas.providers import NormalizedHotelOffer, TripadvisorContentData

logger = logging.getLogger("travelai.adapters.tripadvisor")


class TripadvisorContentAdapter:
    """
    Official Tripadvisor Content API v1 Adapter (Content Only: description, photos, rating, reviews).
    Active only when TRIPADVISOR_API_KEY is configured in .env.
    """

    provider_name: str = "tripadvisor"
    provider_label: str = "Tripadvisor"
    docs_url: str = "https://tripadvisor-content-api.readme.io/reference/overview"

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        daily_quota: Optional[int] = None,
        http_client: Optional[httpx.AsyncClient] = None,
    ) -> None:
        self._api_key = api_key
        self._base_url = (base_url or settings.TRIPADVISOR_BASE_URL).rstrip("/")
        self.daily_quota = daily_quota if daily_quota is not None else settings.TRIPADVISOR_DAILY_QUOTA
        self.call_count: int = 0
        self._cache = TTLCache(default_ttl_seconds=900)  # 15 minutes TTL cache for free-tier conservation
        self._http = AsyncHttpHelper(
            provider_name="tripadvisor",
            timeout_seconds=settings.HTTP_TIMEOUT_SECONDS,
            max_retries=settings.HTTP_MAX_RETRIES,
            client=http_client,
        )

    @property
    def api_key(self) -> str:
        return (self._api_key if self._api_key is not None else settings.TRIPADVISOR_API_KEY).strip()

    def is_enabled(self) -> bool:
        if self._api_key is not None:
            return bool(self.api_key)
        return settings.is_tripadvisor_active

    def _consume_quota(self) -> None:
        if self.call_count >= self.daily_quota:
            raise RateLimitException(
                provider="tripadvisor",
                retry_after=60.0,
                message=f"Tripadvisor free-tier daily quota ({self.daily_quota} calls) reached",
            )
        self.call_count += 1

    async def get_offers(self, *args, **kwargs) -> List[NormalizedHotelOffer]:
        """Tripadvisor Content API does NOT provide hotel pricing or booking offers."""
        return []

    async def fetch_hotel_content(
        self,
        hotel_name: str,
        city: Optional[str] = None,
        language: str = "ru",
    ) -> Optional[TripadvisorContentData]:
        if not self.is_enabled():
            return None

        search_q = f"{hotel_name} {city or ''}".strip()
        cache_key = f"tripadvisor:content:{search_q.lower()}:{language}"
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached

        headers = {"Accept": "application/json"}

        # Step 1: Location Search (`GET /location/search`)
        self._consume_quota()
        search_resp = await self._http.request(
            "GET",
            f"{self._base_url}/location/search",
            headers=headers,
            params={
                "key": self.api_key,
                "searchQuery": search_q,
                "category": "hotels",
                "language": language,
            },
        )
        if search_resp.status_code != 200:
            return None

        search_data = search_resp.json()
        locations = search_data.get("data", []) if isinstance(search_data, dict) else []
        if not isinstance(locations, list) or not locations:
            return None

        loc_id = str(locations[0].get("location_id") or "")
        if not loc_id:
            return None

        # Step 2: Location Details (`GET /location/{locationId}/details`)
        self._consume_quota()
        details_resp = await self._http.request(
            "GET",
            f"{self._base_url}/location/{loc_id}/details",
            headers=headers,
            params={"key": self.api_key, "language": language},
        )
        details: Dict[str, Any] = details_resp.json() if details_resp.status_code == 200 else {}

        # Step 3: Location Photos (`GET /location/{locationId}/photos`)
        photos: List[str] = []
        if self.call_count < self.daily_quota:
            self._consume_quota()
            photos_resp = await self._http.request(
                "GET",
                f"{self._base_url}/location/{loc_id}/photos",
                headers=headers,
                params={"key": self.api_key, "language": language},
            )
            if photos_resp.status_code == 200:
                p_body = photos_resp.json()
                for p in p_body.get("data", [])[:5]:
                    images = p.get("images", {})
                    url = (
                        images.get("large", {}).get("url")
                        or images.get("original", {}).get("url")
                        or images.get("medium", {}).get("url")
                    )
                    if url:
                        photos.append(url)

        # Step 4: Location Reviews (`GET /location/{locationId}/reviews`)
        reviews: List[Dict[str, Any]] = []
        if self.call_count < self.daily_quota:
            self._consume_quota()
            rev_resp = await self._http.request(
                "GET",
                f"{self._base_url}/location/{loc_id}/reviews",
                headers=headers,
                params={"key": self.api_key, "language": language},
            )
            if rev_resp.status_code == 200:
                r_body = rev_resp.json()
                for r in r_body.get("data", [])[:3]:
                    reviews.append(
                        {
                            "id": str(r.get("id") or ""),
                            "title": r.get("title") or "",
                            "text": r.get("text") or "",
                            "rating": r.get("rating"),
                            "published_date": r.get("published_date"),
                        }
                    )

        content = TripadvisorContentData(
            location_id=loc_id,
            name=details.get("name") or locations[0].get("name") or hotel_name,
            description=details.get("description"),
            rating=float(details["rating"]) if details.get("rating") is not None else None,
            num_reviews=int(details.get("num_reviews") or 0),
            web_url=details.get("web_url"),
            photos=photos,
            reviews=reviews,
            source="tripadvisor",
        )
        self._cache.set(cache_key, content)
        return content


from typing import List, Optional, Dict, Any
import httpx
from app.core.config import settings
from app.schemas.booking import (
    HotelItem,
    HotelCoordinates,
    HotelProviderOffer,
)
from app.services.deeplinks import build_hotel_provider_offers, normalize_to_iso_date


class SerpApiComparisonProvider:
    """
    Optional Live SerpApi Google Hotels & Google Flights comparison adapter.
    Activated automatically when SERPAPI_API_KEY is configured in .env.
    """

    BASE_URL = "https://serpapi.com/search.json"

    async def fetch_live_hotels(
        self,
        city: str,
        check_in: Optional[str] = None,
        check_out: Optional[str] = None,
        adults: int = 2,
    ) -> List[HotelItem]:
        if not settings.has_valid_serpapi_key:
            return []
        ci = normalize_to_iso_date(check_in, "2026-11-12")
        co = normalize_to_iso_date(check_out, "2026-11-19")
        params = {
            "engine": "google_hotels",
            "q": f"Hotels in {city}",
            "check_in_date": ci,
            "check_out_date": co,
            "adults": str(max(1, adults)),
            "currency": "USD",
            "hl": "ru",
            "api_key": settings.SERPAPI_API_KEY.strip(),
        }
        try:
            async with httpx.AsyncClient(timeout=7.0) as client:
                resp = await client.get(self.BASE_URL, params=params)
                if resp.status_code != 200:
                    return []
                payload = resp.json()
                props = payload.get("properties", [])
                results: List[HotelItem] = []
                for idx, prop in enumerate(props[:25]):
                    name = prop.get("name") or f"Hotel {city} {idx + 1}"
                    stars = int(prop.get("extracted_hotel_class") or 5)
                    rating = float(prop.get("overall_rating") or 9.0)
                    reviews = int(prop.get("reviews") or 1200)
                    gps = prop.get("gps_coordinates") or {}
                    lat = float(gps.get("latitude") or 41.0082)
                    lng = float(gps.get("longitude") or 28.9784)
                    rate_info = prop.get("total_rate") or prop.get("rate_per_night") or {}
                    total_p = float(rate_info.get("extracted_lowest") or 2450.0)
                    old_p = round(total_p * 1.12, 0)
                    imgs = [
                        im.get("original_image") or im.get("thumbnail")
                        for im in (prop.get("images") or [])[:5]
                        if im.get("original_image") or im.get("thumbnail")
                    ]
                    if not imgs:
                        imgs = [
                            "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80"
                        ]
                    h_id = f"serp-{idx}"
                    offers = [
                        HotelProviderOffer(**o)
                        for o in build_hotel_provider_offers(
                            hotel_id=h_id,
                            hotel_name=name,
                            city=city,
                            base_price=total_p,
                            check_in=ci,
                            check_out=co,
                            adults=adults,
                        )
                    ]
                    results.append(
                        HotelItem(
                            id=h_id,
                            name=name,
                            city=city,
                            city_en=city,
                            stars=max(0, min(5, stars)),
                            eco_certified=idx % 2 == 0,
                            rating=rating,
                            rating_label=f"{rating:.1f}".replace(".", ","),
                            reviews_count=reviews,
                            address=prop.get("description") or f"Центр города, {city}",
                            distance_to_center_km=1.4,
                            distance_center_label=f"1,4 км от центра ({city})",
                            nearest_metro="200 м от станции метро",
                            coordinates=HotelCoordinates(lat=lat, lng=lng),
                            images=imgs,
                            loyalty_points=max(15, int(total_p * 0.03)),
                            room_type="Двухместный номер Superior",
                            meal_plan="BB",
                            meal_label="Завтрак вкл.",
                            meal_included=True,
                            free_cancellation=True,
                            cancellation_label="Беспл. отмена",
                            payment_type="Оплата на сайте партнёра",
                            old_price=old_p,
                            total_price=total_p,
                            nights=7,
                            guests=max(1, adults),
                            map_price_label=f"{int(total_p)} $",
                            cheapest_provider=offers[0].provider,
                            provider_offers=offers,
                        )
                    )
                return results
        except Exception:
            return []


serpapi_provider = SerpApiComparisonProvider()


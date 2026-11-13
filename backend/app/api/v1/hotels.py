from datetime import datetime
from typing import List, Optional, Tuple
from fastapi import APIRouter, Query
from app.adapters.registry import provider_registry
from app.providers.booking_provider import booking_hotel_provider
from app.schemas.booking import HotelLocationSuggestion, HotelSearchResponse
from app.schemas.providers import HotelAggregatedOffersResponse, RedirectResponseSchema
from app.services.catalog_engine import CITY_PROFILES, generate_city_hotels
from app.services.deeplinks import normalize_to_iso_date

router = APIRouter(prefix="/hotels", tags=["Hotels Search & Official Partner Offers"])


def _resolve_catalog_hotel_meta(
    hotel_id: str,
    check_in: Optional[str] = None,
    check_out: Optional[str] = None,
    adults: int = 2,
    rooms: int = 1,
    hint_name: Optional[str] = None,
    hint_city: Optional[str] = None,
) -> Tuple[str, str, Optional[float]]:
    """
    Look up exact hotel name, city, and base total price from our city catalog when hotel_id matches
    e.g. `tashkent-5f-0`, `istanbul-5f-0`, `knickerbocker-nyc`, etc., ensuring 1-to-1 price consistency.
    """
    if hint_name and hint_city:
        return hint_name, hint_city, None

    hid_low = (hotel_id or "").strip().lower()
    matched_city = hint_city or "Ташкент"
    if hid_low == "knickerbocker-nyc" or hid_low.startswith("new-york"):
        matched_city = "New York"
    else:
        for key, prof in CITY_PROFILES.items():
            prefix = prof["city_en"].lower().replace(" ", "-")
            if hid_low.startswith(prefix):
                matched_city = prof["city_en"]
                break

    try:
        ci = datetime.strptime(normalize_to_iso_date(check_in, "2026-11-12"), "%Y-%m-%d")
        co = datetime.strptime(normalize_to_iso_date(check_out, "2026-11-19"), "%Y-%m-%d")
        nights = max(1, min(30, (co - ci).days)) if (co - ci).days > 0 else 7
    except Exception:
        nights = 7

    pool, _, _ = generate_city_hotels(
        destination=matched_city,
        check_in=check_in,
        check_out=check_out,
        guests=max(1, adults),
        rooms=max(1, rooms),
        nights=nights,
    )
    for item in pool:
        if item.id.lower() == hid_low:
            return item.name, item.city_en, item.total_price

    if pool:
        return hint_name or pool[0].name, hint_city or pool[0].city_en, pool[0].total_price

    return hint_name or f"Hotel {hotel_id}", hint_city or "Tashkent", None


@router.get("/locations", response_model=List[HotelLocationSuggestion])
async def search_hotel_locations(
    query: str = Query("Нью-Йорк", description="City, region, or hotel query"),
    locale: str = Query("ru", description="Language locale (ru, en)"),
) -> List[HotelLocationSuggestion]:
    """
    Resolve city or hotel name into destination suggestions with automatic fallback.
    """
    return await booking_hotel_provider.search_locations(query=query, locale=locale)


@router.get("/search", response_model=HotelSearchResponse)
async def search_hotels(
    query: Optional[str] = Query(None, description="City, region, or hotel query (Stage 3 spec)"),
    destination: Optional[str] = Query(None, description="Alias for query (City, hotel or airport)"),
    check_in: Optional[str] = Query(None, description="Check-in date YYYY-MM-DD"),
    check_out: Optional[str] = Query(None, description="Check-out date YYYY-MM-DD"),
    guests: int = Query(2, description="Number of adult guests"),
    adults: Optional[int] = Query(None, description="Alias for guests"),
    rooms: int = Query(1, description="Number of rooms"),
    citizenship: Optional[str] = Query(None, description="Citizenship of guests"),
    stars: Optional[str] = Query(None, description="Comma-separated star ratings e.g. 4,5"),
    meal_plans: Optional[str] = Query(None, description="Comma-separated meal plans e.g. RO,BB"),
    free_cancellation: Optional[bool] = Query(None, description="Only free cancellation"),
    early_check_in: Optional[str] = Query(None),
    late_check_out: Optional[str] = Query(None),
    hotel_name: Optional[str] = Query(None, description="Search by hotel name substring"),
    sort_by: str = Query("popular", description="popular, price_asc, price_desc, rating_desc"),
    bbox: Optional[str] = Query(None, description="Optional map bounding box xMin,yMin,xMax,yMax"),
) -> HotelSearchResponse:
    """
    Search hotels by city/query (`?query=` or `?destination=`).
    Returns `"source": "mock"` when operating in mock mode without live API keys.
    """
    effective_dest = query or destination
    effective_guests = adults if adults is not None else guests

    parsed_stars: Optional[List[int]] = None
    if stars and stars.strip():
        try:
            parsed_stars = [int(s.strip()) for s in stars.split(",") if s.strip()]
        except ValueError:
            parsed_stars = None

    parsed_meals: Optional[List[str]] = None
    if meal_plans and meal_plans.strip():
        parsed_meals = [m.strip().upper() for m in meal_plans.split(",") if m.strip()]

    return await booking_hotel_provider.search_hotels(
        destination=effective_dest,
        check_in=check_in,
        check_out=check_out,
        guests=effective_guests,
        rooms=rooms,
        stars=parsed_stars,
        meal_plans=parsed_meals,
        free_cancellation=free_cancellation,
        hotel_name=hotel_name,
        sort_by=sort_by,
        bbox=bbox,
    )


@router.get("/{hotel_id}/offers", response_model=HotelAggregatedOffersResponse)
async def get_hotel_aggregated_offers(
    hotel_id: str,
    check_in: Optional[str] = Query(None, description="Check-in date YYYY-MM-DD"),
    check_out: Optional[str] = Query(None, description="Check-out date YYYY-MM-DD"),
    adults: int = Query(2, ge=1, le=20, description="Number of adults"),
    rooms: int = Query(1, ge=1, le=10, description="Number of rooms"),
    currency: str = Query("USD", description="Currency code e.g. USD, EUR"),
    hotel_name: Optional[str] = Query(None, description="Optional hotel name hint"),
    city: Optional[str] = Query(None, description="Optional city hint"),
) -> HotelAggregatedOffersResponse:
    """
    Stage 3: Collect offers for `{hotel_id}` across all ACTIVE official hotel providers
    (Booking.com Demand API, Agoda Affiliate API, Trip.com Partner API) or MockAdapter (`source="mock"`).
    - Merges offers, sorts ascending by price, sets `is_cheapest=True` on the best offer.
    - Resilient partial success: if one provider fails or times out, remaining offers are still returned
      along with a populated `errors` list.
    """
    resolved_name, resolved_city, base_total = _resolve_catalog_hotel_meta(
        hotel_id=hotel_id,
        check_in=check_in,
        check_out=check_out,
        adults=adults,
        rooms=rooms,
        hint_name=hotel_name,
        hint_city=city,
    )

    return await provider_registry.aggregate_hotel_offers(
        hotel_id=hotel_id,
        check_in=check_in,
        check_out=check_out,
        adults=adults,
        rooms=rooms,
        currency=currency,
        hotel_name=resolved_name,
        city=resolved_city,
        base_total_price=base_total,
    )


@router.get("/{hotel_id}/offers/{provider}/redirect", response_model=RedirectResponseSchema)
async def get_hotel_offer_redirect(
    hotel_id: str,
    provider: str,
    check_in: Optional[str] = Query(None, description="Check-in date YYYY-MM-DD"),
    check_out: Optional[str] = Query(None, description="Check-out date YYYY-MM-DD"),
    adults: int = Query(2, ge=1, le=20, description="Number of adults"),
    rooms: int = Query(1, ge=1, le=10, description="Number of rooms"),
    hotel_name: Optional[str] = Query(None, description="Optional hotel name"),
    city: Optional[str] = Query(None, description="Optional city name"),
    deep_link: Optional[str] = Query(None, description="Optional verified provider deep link"),
) -> RedirectResponseSchema:
    """
    Stage 3: Resolve target booking/search redirect URL on the chosen hotel platform (`booking`, `agoda`, `tripcom`).
    Uses provider affiliate/deep link when available, or officially documented platform search URL (`link_type="search"`).
    """
    resolved_name, resolved_city, _ = _resolve_catalog_hotel_meta(
        hotel_id=hotel_id,
        check_in=check_in,
        check_out=check_out,
        adults=adults,
        rooms=rooms,
        hint_name=hotel_name,
        hint_city=city,
    )

    return await provider_registry.resolve_hotel_redirect(
        hotel_id=hotel_id,
        provider=provider,
        check_in=check_in,
        check_out=check_out,
        adults=adults,
        rooms=rooms,
        hotel_name=resolved_name,
        city=resolved_city,
        deep_link=deep_link,
    )

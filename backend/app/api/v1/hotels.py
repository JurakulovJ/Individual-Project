from typing import List, Optional
from fastapi import APIRouter, Query
from app.schemas.booking import HotelLocationSuggestion, HotelSearchResponse
from app.providers.booking_provider import booking_hotel_provider

router = APIRouter(prefix="/hotels", tags=["Hotels Search & Booking.com Integration"])


@router.get("/locations", response_model=List[HotelLocationSuggestion])
async def search_hotel_locations(
    query: str = Query("Нью-Йорк", description="City, region, or hotel query"),
    locale: str = Query("ru", description="Language locale (ru, en)"),
) -> List[HotelLocationSuggestion]:
    """
    Resolve city or hotel name into Booking.com dest_id and dest_type via BookingHotelProvider
    with automatic fallback.
    """
    return await booking_hotel_provider.search_locations(query=query, locale=locale)


@router.get("/search", response_model=HotelSearchResponse)
async def search_hotels(
    destination: Optional[str] = Query(None, description="City, hotel or airport"),
    check_in: Optional[str] = Query(None, description="Check-in date"),
    check_out: Optional[str] = Query(None, description="Check-out date"),
    guests: int = Query(2, description="Number of guests"),
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
    Search and mathematically filter hotels via BookingHotelProvider (Booking.com API + MockProvider fallback).
    """
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
        destination=destination,
        check_in=check_in,
        check_out=check_out,
        guests=guests,
        rooms=rooms,
        stars=parsed_stars,
        meal_plans=parsed_meals,
        free_cancellation=free_cancellation,
        hotel_name=hotel_name,
        sort_by=sort_by,
        bbox=bbox,
    )

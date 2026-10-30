from typing import List, Optional
from fastapi import APIRouter, Query
from app.schemas.booking import FlightPlaceSuggestion, FlightSearchResponse
from app.providers.aviasales_provider import aviasales_flight_provider

router = APIRouter(prefix="/flights", tags=["Flights Search & Aviasales Integration"])


@router.get("/autocomplete", response_model=List[FlightPlaceSuggestion])
async def autocomplete_flight_places(
    term: str = Query("Барселона", description="City or airport search term"),
    locale: str = Query("ru", description="Language locale (ru, en)"),
) -> List[FlightPlaceSuggestion]:
    """
    Live IATA airport and city autocomplete powered by Aviasales (Travelpayouts) places2 API
    with automatic resilient fallback.
    """
    return await aviasales_flight_provider.autocomplete_places(term=term, locale=locale)


@router.get("/search", response_model=FlightSearchResponse)
async def search_flights(
    trip_type: str = Query("round_trip", description="one_way, round_trip, multi_city"),
    origin: Optional[str] = Query(None, description="Origin city or airport IATA"),
    destination: Optional[str] = Query(None, description="Destination city or airport IATA"),
    departure_date: Optional[str] = Query(None),
    return_date: Optional[str] = Query(None),
    passengers: int = Query(1),
    cabin_class: str = Query("economy", description="economy, premium, business, first"),
    airline: Optional[str] = Query(None),
    stops: str = Query("all", description="all, direct, max_1"),
    no_airport_change: bool = Query(False),
    baggage_included: bool = Query(False),
    outbound_dep_max: int = Query(1435, ge=0, le=1440),
    outbound_arr_max: int = Query(1435, ge=0, le=1440),
    return_dep_max: int = Query(1435, ge=0, le=1440),
    return_arr_max: int = Query(1435, ge=0, le=1440),
    sort_by: str = Query("cheapest", description="cheapest, fastest, optimal, time_limit"),
) -> FlightSearchResponse:
    """
    Search flight offers via AviasalesFlightProvider (with automatic fallback to MockProvider),
    normalize to RateHawk UI cards, and apply post-filtering & sorting.
    """
    return await aviasales_flight_provider.search_flights(
        origin=origin,
        destination=destination,
        departure_date=departure_date,
        return_date=return_date,
        airline=airline,
        stops=stops,
        baggage_included=baggage_included,
        outbound_dep_max=outbound_dep_max,
        outbound_arr_max=outbound_arr_max,
        return_dep_max=return_dep_max,
        return_arr_max=return_arr_max,
        sort_by=sort_by,
        passengers=passengers,
        cabin_class=cabin_class,
        trip_type=trip_type,
    )

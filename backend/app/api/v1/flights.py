from typing import List, Optional
from fastapi import APIRouter, Query
from app.adapters.registry import provider_registry
from app.providers.aviasales_provider import aviasales_flight_provider
from app.schemas.booking import FlightPlaceSuggestion, FlightSearchResponse
from app.schemas.providers import RedirectResponseSchema
from app.services.catalog_engine import CARRIER_CATALOG

router = APIRouter(prefix="/flights", tags=["Flights Search & Official Airline APIs"])


def _infer_carrier_from_flight_id(flight_id: str, carrier_hint: Optional[str] = None) -> tuple[str, str, str]:
    """
    Infer `(carrier_code, origin_iata, dest_iata)` from a catalog `flight_id` such as `flt-bcn-lon-0`
    or `lh-fra-jfk-0`.
    """
    orig = "BCN"
    dest = "LON"
    code = (carrier_hint or "").strip().upper()

    parts = (flight_id or "").strip().split("-")
    if len(parts) >= 4:
        if parts[0].lower() == "lh":
            code = code or "LH"
        orig = parts[1].upper()
        dest = parts[2].upper()
        if not code and parts[3].isdigit():
            idx = int(parts[3])
            route_seed = sum(ord(c) for c in f"{orig}{dest}")
            carrier = CARRIER_CATALOG[(idx + route_seed) % len(CARRIER_CATALOG)]
            code = carrier["code"]

    return (code or "LH"), orig, dest


@router.get("/autocomplete", response_model=List[FlightPlaceSuggestion])
async def autocomplete_flight_places(
    term: str = Query("Барселона", description="City or airport search term"),
    locale: str = Query("ru", description="Language locale (ru, en)"),
) -> List[FlightPlaceSuggestion]:
    """
    IATA airport and city autocomplete with resilient offline/mock fallback.
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
    adults: Optional[int] = Query(None, description="Alias for passengers"),
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
    Search flight schedules & offers across active official airline providers (e.g. Lufthansa Open API)
    with automatic fallback to Mock mode (`"source": "mock"`).
    """
    effective_pax = adults if adults is not None else passengers
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
        passengers=effective_pax,
        cabin_class=cabin_class,
        trip_type=trip_type,
    )


@router.get("/{flight_id}/redirect", response_model=RedirectResponseSchema)
async def get_flight_redirect(
    flight_id: str,
    provider: Optional[str] = Query(None, description="Airline provider key e.g. lufthansa, turkish_airlines"),
    carrier_code: Optional[str] = Query(None, description="2-letter IATA airline code e.g. LH, TK, HY, EK"),
    origin: Optional[str] = Query(None, description="Origin IATA code"),
    destination: Optional[str] = Query(None, description="Destination IATA code"),
    departure_date: Optional[str] = Query("2026-11-19", description="Departure date YYYY-MM-DD"),
    return_date: Optional[str] = Query(None, description="Return date YYYY-MM-DD"),
    adults: int = Query(1, ge=1, le=9, description="Number of passengers"),
    cabin_class: str = Query("economy", description="Cabin class"),
    deep_link: Optional[str] = Query(None, description="Optional verified airline deep link"),
) -> RedirectResponseSchema:
    """
    Stage 3: Return target redirect URL to the official airline booking page (`link_type="search"` or `"deep_link"`).
    """
    inferred_code, inferred_orig, inferred_dest = _infer_carrier_from_flight_id(flight_id, carrier_code)
    return await provider_registry.resolve_flight_redirect(
        flight_id=flight_id,
        provider=provider,
        origin=origin or inferred_orig,
        destination=destination or inferred_dest,
        departure_date=departure_date or "2026-11-19",
        return_date=return_date,
        adults=adults,
        cabin_class=cabin_class,
        carrier_code=inferred_code,
        deep_link=deep_link,
    )


@router.get("/{flight_id}/offers/{provider}/redirect", response_model=RedirectResponseSchema)
async def get_flight_offer_provider_redirect(
    flight_id: str,
    provider: str,
    carrier_code: Optional[str] = Query(None),
    origin: Optional[str] = Query(None),
    destination: Optional[str] = Query(None),
    departure_date: Optional[str] = Query("2026-11-19"),
    return_date: Optional[str] = Query(None),
    adults: int = Query(1, ge=1, le=9),
    cabin_class: str = Query("economy"),
    deep_link: Optional[str] = Query(None),
) -> RedirectResponseSchema:
    """
    Alias route matching `/api/v1/flights/{flight_id}/offers/{provider}/redirect`.
    """
    inferred_code, inferred_orig, inferred_dest = _infer_carrier_from_flight_id(flight_id, carrier_code)
    return await provider_registry.resolve_flight_redirect(
        flight_id=flight_id,
        provider=provider,
        origin=origin or inferred_orig,
        destination=destination or inferred_dest,
        departure_date=departure_date or "2026-11-19",
        return_date=return_date,
        adults=adults,
        cabin_class=cabin_class,
        carrier_code=inferred_code,
        deep_link=deep_link,
    )

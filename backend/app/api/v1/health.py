from fastapi import APIRouter
from app.schemas.health import HealthResponse
from app.core.config import settings

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def get_health() -> HealthResponse:
    """
    Health check endpoint returning server status, mock_mode flag, and active official provider status.
    """
    hotel_provs = []
    if settings.is_booking_demand_active:
        hotel_provs.append("booking")
    if settings.is_agoda_active:
        hotel_provs.append("agoda")
    if settings.is_tripcom_active:
        hotel_provs.append("tripcom")
    if settings.is_tripadvisor_active:
        hotel_provs.append("tripadvisor")

    flight_provs = []
    if settings.is_lufthansa_active:
        flight_provs.append("lufthansa")
    if settings.is_turkish_ndc_active:
        flight_provs.append("turkish_airlines")
    if settings.is_transavia_active:
        flight_provs.append("transavia")

    return HealthResponse(
        status="ok",
        mock_mode=settings.effective_mock_mode,
        use_live_apis=not settings.effective_mock_mode,
        aviasales_configured=settings.has_valid_aviasales_token,
        booking_configured=settings.is_booking_demand_active or settings.has_valid_booking_key,
        autocomplete_live=not settings.effective_mock_mode,
        active_hotel_providers=hotel_provs or ["mock"],
        active_flight_providers=flight_provs or ["mock"],
    )

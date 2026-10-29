from fastapi import APIRouter
from app.schemas.health import HealthResponse
from app.core.config import settings

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def get_health() -> HealthResponse:
    """
    Health check endpoint returning server status and live/fallback provider flags.
    """
    return HealthResponse(
        status="ok",
        mock_mode=settings.USE_MOCK_PROVIDERS,
        use_live_apis=settings.USE_LIVE_APIS,
        aviasales_configured=settings.has_valid_aviasales_token,
        booking_configured=settings.has_valid_booking_key,
        autocomplete_live=settings.USE_LIVE_APIS,
    )

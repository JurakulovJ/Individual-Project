from fastapi import APIRouter
from app.schemas.health import HealthResponse
from app.core.config import settings

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def get_health() -> HealthResponse:
    """
    Health check endpoint returning the server status and mock provider flag.
    """
    return HealthResponse(
        status="ok",
        mock_mode=settings.USE_MOCK_PROVIDERS,
    )

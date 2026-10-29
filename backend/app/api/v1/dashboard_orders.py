from typing import List
from fastapi import APIRouter
from app.schemas.booking import (
    DashboardSummaryResponse,
    OrderCreateRequest,
    OrderRecord,
)
from app.services.booking_repository import booking_repo

router = APIRouter(tags=["Orders & B2B Financial Dashboard"])


@router.get("/dashboard/summary", response_model=DashboardSummaryResponse)
async def get_dashboard_summary() -> DashboardSummaryResponse:
    """
    Dynamically calculate and return live metrics for 'Состояние заказов' and 'Финансовая информация'.
    """
    return booking_repo.get_dashboard_summary()


@router.get("/orders", response_model=List[OrderRecord])
async def list_orders() -> List[OrderRecord]:
    """
    Return all created B2B/B2C bookings in reverse chronological order.
    """
    return booking_repo.get_orders()


@router.post("/orders", response_model=OrderRecord)
async def create_order(body: OrderCreateRequest) -> OrderRecord:
    """
    Create a new booking (Hotel, Flight, Transfer, or AI Package) and immediately update
    the financial and order status dashboard counters.
    """
    return booking_repo.create_order(body)


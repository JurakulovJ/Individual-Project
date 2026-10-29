from typing import Optional
from fastapi import APIRouter, Query
from app.schemas.booking import TransferSearchResponse
from app.services.booking_repository import booking_repo

router = APIRouter(prefix="/transfers", tags=["Transfers Search"])


@router.get("/search", response_model=TransferSearchResponse)
async def search_transfers(
    trip_type: str = Query("one_way", description="one_way or round_trip"),
    pickup_location: Optional[str] = Query(None, description="Pick-up airport, station, or hotel"),
    dropoff_location: Optional[str] = Query(None, description="Drop-off location"),
    date: Optional[str] = Query(None),
    pickup_time: str = Query("12:00"),
    passengers: int = Query(2, ge=1),
) -> TransferSearchResponse:
    """
    Search available airport and city transfers by vehicle class and passenger capacity.
    """
    return booking_repo.search_transfers(
        pickup_location=pickup_location,
        dropoff_location=dropoff_location,
        passengers=passengers,
    )


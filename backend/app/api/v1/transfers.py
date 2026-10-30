from typing import Optional
from fastapi import APIRouter, Query
from app.schemas.booking import TransferSearchResponse, TransferProviderOffer
from app.services.booking_repository import booking_repo
from app.services.deeplinks import build_transfer_provider_offers

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
    Search available airport and city transfers by vehicle class and passenger capacity,
    enriched with verified direct transfer comparison links (Jayride, KiwiTaxi, Welcome Pickups).
    """
    resp = booking_repo.search_transfers(
        pickup_location=pickup_location,
        dropoff_location=dropoff_location,
        passengers=passengers,
    )
    pickup_str = pickup_location or "Istanbul Airport (IST)"
    dropoff_str = dropoff_location or "Sultanahmet City Center"

    enriched = []
    for item in resp.items:
        cloned = item.model_copy(deep=True)
        offers = [
            TransferProviderOffer(**o)
            for o in build_transfer_provider_offers(
                pickup=pickup_str,
                dropoff=dropoff_str,
                base_price=cloned.price,
                date_str=date,
            )
        ]
        cloned.provider_offers = offers
        cloned.cheapest_provider = offers[0].provider if offers else "Jayride"
        enriched.append(cloned)

    resp.items = enriched
    return resp

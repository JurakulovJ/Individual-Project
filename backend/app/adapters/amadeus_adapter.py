"""
DEPRECATED ADAPTER: Amadeus Self-Service API.

Notice:
Amadeus Self-Service API was officially decommissioned on 17.07.2026 (2026-07-17).
Self-Service API keys are no longer active. This module is retained for historical
reference and backward compatibility only, is marked @deprecated, and is disabled
by default in Settings (`AMADEUS_ENABLED = False`) so it never crashes the application.
"""

import logging
import warnings
from typing import List, Optional

from app.adapters.base import FlightProvider, HotelProvider
from app.schemas.providers import (
    NormalizedFlightOffer,
    NormalizedHotel,
    NormalizedHotelOffer,
    RedirectResponseSchema,
)

logger = logging.getLogger("travelai.adapters.amadeus")


class AmadeusAdapter(HotelProvider, FlightProvider):
    """
    DEPRECATED: Amadeus Self-Service API Adapter (Sunset date: 2026-07-17).
    Do not enable in default configuration.
    """

    DEPRECATED: bool = True
    SUNSET_DATE: str = "2026-07-17"
    provider_name: str = "amadeus"
    provider_label: str = "Amadeus (Deprecated)"
    docs_url: str = "https://developers.amadeus.com"

    def __init__(self, client_id: str = "", client_secret: str = "", enabled: bool = False) -> None:
        self.client_id = client_id
        self.client_secret = client_secret
        self._enabled = False  # Strictly disabled: Amadeus Self-Service closed 17.07.2026

    def is_enabled(self) -> bool:
        """Always returns False by default because Amadeus Self-Service was shut down on 17.07.2026."""
        return False

    def _warn_deprecated(self) -> None:
        msg = (
            "AmadeusAdapter is deprecated: Amadeus Self-Service API was shut down on "
            "17.07.2026 and keys are inactive. Returning empty list safely."
        )
        warnings.warn(msg, DeprecationWarning, stacklevel=2)
        logger.warning(msg)

    async def search_hotels(
        self,
        query: str,
        check_in: Optional[str] = None,
        check_out: Optional[str] = None,
        adults: int = 2,
        rooms: int = 1,
        currency: str = "USD",
    ) -> List[NormalizedHotel]:
        self._warn_deprecated()
        return []

    async def get_offers(
        self,
        hotel_id: str,
        check_in: Optional[str] = None,
        check_out: Optional[str] = None,
        adults: int = 2,
        rooms: int = 1,
        currency: str = "USD",
        hotel_name: Optional[str] = None,
        city: Optional[str] = None,
    ) -> List[NormalizedHotelOffer]:
        self._warn_deprecated()
        return []

    async def search_flights(
        self,
        origin: str,
        destination: str,
        departure_date: str,
        return_date: Optional[str] = None,
        adults: int = 1,
        cabin_class: str = "economy",
        currency: str = "USD",
    ) -> List[NormalizedFlightOffer]:
        self._warn_deprecated()
        return []

    async def build_redirect_url(
        self,
        hotel_id: str = "",
        check_in: Optional[str] = None,
        check_out: Optional[str] = None,
        adults: int = 2,
        rooms: int = 1,
        hotel_name: Optional[str] = None,
        city: Optional[str] = None,
        deep_link: Optional[str] = None,
        **kwargs,
    ) -> RedirectResponseSchema:
        self._warn_deprecated()
        return RedirectResponseSchema(
            item_id=hotel_id or "deprecated",
            provider="amadeus",
            provider_label="Amadeus (Deprecated)",
            target_url="https://developers.amadeus.com",
            link_type="search",
            source="mock",
        )


amadeus_adapter = AmadeusAdapter()


from typing import Dict, List
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = "ok"
    mock_mode: bool = True
    use_live_apis: bool = False
    aviasales_configured: bool = False
    booking_configured: bool = False
    autocomplete_live: bool = False
    active_hotel_providers: List[str] = Field(default_factory=list)
    active_flight_providers: List[str] = Field(default_factory=list)
    deprecated_providers: Dict[str, str] = Field(
        default_factory=lambda: {
            "amadeus": "Deprecated (Amadeus Self-Service decommissioned on 2026-07-17; disabled by default)"
        }
    )

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    mock_mode: bool
    use_live_apis: bool = True
    aviasales_configured: bool = False
    booking_configured: bool = False
    autocomplete_live: bool = True

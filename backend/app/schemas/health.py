from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    mock_mode: bool

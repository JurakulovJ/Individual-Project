from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_ENV: str = "development"
    USE_MOCK_PROVIDERS: bool = True
    USE_LIVE_APIS: bool = True
    DATABASE_URL: str = "sqlite:///./travelai.db"
    LLM_API_KEY: str = "your_key_here"
    AMADEUS_CLIENT_ID: str = "your_key_here"
    AMADEUS_CLIENT_SECRET: str = "your_key_here"
    GOOGLE_MAPS_API_KEY: str = "your_key_here"

    # Aviasales / Travelpayouts Live API Credentials
    AVIASALES_API_TOKEN: str = "your_travelpayouts_token_here"
    AVIASALES_MARKER: str = "your_marker_here"

    # Booking.com (RapidAPI) Live API Credentials
    RAPIDAPI_KEY: str = "your_rapidapi_booking_key_here"
    RAPIDAPI_BOOKING_HOST: str = "booking-com15.p.rapidapi.com"

    # SerpApi (Google Hotels & Google Flights Multi-Provider Comparison)
    SERPAPI_API_KEY: str = "your_serpapi_key_here"

    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def has_valid_aviasales_token(self) -> bool:
        return (
            self.USE_LIVE_APIS
            and bool(self.AVIASALES_API_TOKEN)
            and self.AVIASALES_API_TOKEN.strip() not in ("", "your_travelpayouts_token_here", "your_key_here")
        )

    @property
    def has_valid_booking_key(self) -> bool:
        return (
            self.USE_LIVE_APIS
            and bool(self.RAPIDAPI_KEY)
            and self.RAPIDAPI_KEY.strip() not in ("", "your_rapidapi_booking_key_here", "your_key_here")
        )

    @property
    def has_valid_serpapi_key(self) -> bool:
        return (
            self.USE_LIVE_APIS
            and bool(self.SERPAPI_API_KEY)
            and self.SERPAPI_API_KEY.strip() not in ("", "your_serpapi_key_here", "your_key_here")
        )


settings = Settings()

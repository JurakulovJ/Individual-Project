from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

PLACEHOLDER_VALUES = {
    "",
    "your_key_here",
    "your_token_here",
    "your_secret_here",
    "your_client_id_here",
    "your_client_secret_here",
    "your_affiliate_id_here",
    "your_site_id_here",
    "your_alliance_id_here",
    "your_sid_here",
    "your_travelpayouts_token_here",
    "your_rapidapi_booking_key_here",
    "your_serpapi_key_here",
}


def _is_real_secret(value: str) -> bool:
    if not value:
        return False
    cleaned = value.strip()
    return bool(cleaned) and cleaned.lower() not in PLACEHOLDER_VALUES


class Settings(BaseSettings):
    APP_ENV: str = "development"
    USE_MOCK_PROVIDERS: bool = True
    USE_LIVE_APIS: bool = False
    DATABASE_URL: str = "sqlite:///./travelai.db"

    # AI / LLM Keys (Optional)
    LLM_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    GOOGLE_MAPS_API_KEY: str = ""

    # -------------------------------------------------------------------------
    # Official Hotel Provider Credentials (Loaded strictly from .env)
    # -------------------------------------------------------------------------
    # 1. Booking.com Demand API v3.1 (Managed Affiliate Partner required)
    BOOKING_DEMAND_API_TOKEN: str = ""
    BOOKING_AFFILIATE_ID: str = ""
    BOOKING_DEMAND_BASE_URL: str = "https://demandapi.booking.com/3.1"

    # 2. Agoda Affiliate API (developer.pps.agoda.com)
    AGODA_SITE_ID: str = ""
    AGODA_API_KEY: str = ""
    AGODA_API_BASE_URL: str = "https://affiliateapi7643.agoda.com/affiliateservice/lt_v1"

    # 3. Trip.com Affiliate / Alliance API
    TRIPCOM_ALLIANCE_ID: str = ""
    TRIPCOM_SID: str = ""
    TRIPCOM_API_KEY: str = ""
    TRIPCOM_API_BASE_URL: str = "https://open.trip.com/api"

    # 4. Tripadvisor Content API v1 (Content only: details, photos, reviews — no prices)
    TRIPADVISOR_API_KEY: str = ""
    TRIPADVISOR_BASE_URL: str = "https://api.content.tripadvisor.com/api/v1"
    TRIPADVISOR_DAILY_QUOTA: int = 160

    # -------------------------------------------------------------------------
    # Official Airline API Credentials (Loaded strictly from .env)
    # -------------------------------------------------------------------------
    # 1. Lufthansa Group Open API (developer.lufthansa.com)
    LUFTHANSA_CLIENT_ID: str = ""
    LUFTHANSA_CLIENT_SECRET: str = ""
    LUFTHANSA_PARTNER_ID: str = ""
    LUFTHANSA_BASE_URL: str = "https://api.lufthansa.com/v1"

    # 2. Turkish Airlines NDC / Developer Portal (Skeleton)
    TURKISH_AIRLINES_API_KEY: str = ""
    TURKISH_AIRLINES_API_SECRET: str = ""

    # 3. Transavia Official Developer API (Skeleton)
    TRANSAVIA_API_KEY: str = ""

    # -------------------------------------------------------------------------
    # DEPRECATED: Amadeus Self-Service API (Decommissioned on 17.07.2026)
    # Kept only for backward compatibility; disabled by default so it never crashes.
    # -------------------------------------------------------------------------
    AMADEUS_CLIENT_ID: str = ""
    AMADEUS_CLIENT_SECRET: str = ""
    AMADEUS_ENABLED: bool = False

    # Legacy / Optional fallback tokens kept so existing config properties do not break
    AVIASALES_API_TOKEN: str = ""
    AVIASALES_MARKER: str = ""
    RAPIDAPI_KEY: str = ""
    RAPIDAPI_BOOKING_HOST: str = "booking-com15.p.rapidapi.com"
    SERPAPI_API_KEY: str = ""

    # HTTP & Cache Settings
    HTTP_TIMEOUT_SECONDS: float = 8.0
    HTTP_MAX_RETRIES: int = 2
    CACHE_TTL_SECONDS: int = 600

    # Server & CORS
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    # Official Hotel Provider Activation Flags
    @property
    def is_booking_demand_active(self) -> bool:
        return _is_real_secret(self.BOOKING_DEMAND_API_TOKEN) and _is_real_secret(self.BOOKING_AFFILIATE_ID)

    @property
    def is_agoda_active(self) -> bool:
        return _is_real_secret(self.AGODA_SITE_ID) and _is_real_secret(self.AGODA_API_KEY)

    @property
    def is_tripcom_active(self) -> bool:
        return (
            _is_real_secret(self.TRIPCOM_ALLIANCE_ID)
            and _is_real_secret(self.TRIPCOM_SID)
            and _is_real_secret(self.TRIPCOM_API_KEY)
        )

    @property
    def is_tripadvisor_active(self) -> bool:
        return _is_real_secret(self.TRIPADVISOR_API_KEY)

    # Official Airline Provider Activation Flags
    @property
    def is_lufthansa_active(self) -> bool:
        return _is_real_secret(self.LUFTHANSA_CLIENT_ID) and _is_real_secret(self.LUFTHANSA_CLIENT_SECRET)

    @property
    def is_lufthansa_partner_active(self) -> bool:
        return self.is_lufthansa_active and _is_real_secret(self.LUFTHANSA_PARTNER_ID)

    @property
    def is_turkish_ndc_active(self) -> bool:
        return _is_real_secret(self.TURKISH_AIRLINES_API_KEY) and _is_real_secret(self.TURKISH_AIRLINES_API_SECRET)

    @property
    def is_transavia_active(self) -> bool:
        return _is_real_secret(self.TRANSAVIA_API_KEY)

    @property
    def any_live_hotel_provider_active(self) -> bool:
        return any([
            self.is_booking_demand_active,
            self.is_agoda_active,
            self.is_tripcom_active,
        ])

    @property
    def any_live_flight_provider_active(self) -> bool:
        return any([
            self.is_lufthansa_active,
            self.is_turkish_ndc_active,
            self.is_transavia_active,
        ])

    @property
    def effective_mock_mode(self) -> bool:
        """
        True if USE_MOCK_PROVIDERS is explicitly enabled OR if no live official provider keys are configured.
        """
        if self.USE_MOCK_PROVIDERS:
            return True
        return not (self.any_live_hotel_provider_active or self.any_live_flight_provider_active)

    # Legacy compatibility properties
    @property
    def has_valid_aviasales_token(self) -> bool:
        return self.USE_LIVE_APIS and _is_real_secret(self.AVIASALES_API_TOKEN)

    @property
    def has_valid_booking_key(self) -> bool:
        return self.is_booking_demand_active or (self.USE_LIVE_APIS and _is_real_secret(self.RAPIDAPI_KEY))

    @property
    def has_valid_serpapi_key(self) -> bool:
        return self.USE_LIVE_APIS and _is_real_secret(self.SERPAPI_API_KEY)


settings = Settings()

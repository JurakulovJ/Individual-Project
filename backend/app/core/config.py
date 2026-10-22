from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_ENV: str = "development"
    USE_MOCK_PROVIDERS: bool = True
    DATABASE_URL: str = "sqlite:///./travelai.db"
    LLM_API_KEY: str = "your_key_here"
    AMADEUS_CLIENT_ID: str = "your_key_here"
    AMADEUS_CLIENT_SECRET: str = "your_key_here"
    GOOGLE_MAPS_API_KEY: str = "your_key_here"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()

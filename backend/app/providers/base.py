import time
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Tuple
from app.schemas.booking import (
    FlightPlaceSuggestion,
    FlightSearchResponse,
    HotelLocationSuggestion,
    HotelSearchResponse,
)


class TTLCache:
    """
    Lightweight thread-safe in-memory TTL cache to preserve external API rate limits.
    """

    def __init__(self, default_ttl_seconds: int = 300) -> None:
        self.default_ttl = default_ttl_seconds
        self._store: Dict[str, Tuple[float, Any]] = {}

    def get(self, key: str) -> Optional[Any]:
        entry = self._store.get(key)
        if not entry:
            return None
        expires_at, val = entry
        if time.time() > expires_at:
            self._store.pop(key, None)
            return None
        return val

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        exp = time.time() + (ttl if ttl is not None else self.default_ttl)
        self._store[key] = (exp, value)


class BaseFlightProvider(ABC):
    @abstractmethod
    async def autocomplete_places(
        self, term: str, locale: str = "ru"
    ) -> List[FlightPlaceSuggestion]:
        raise NotImplementedError

    @abstractmethod
    async def search_flights(
        self,
        origin: Optional[str] = None,
        destination: Optional[str] = None,
        departure_date: Optional[str] = None,
        return_date: Optional[str] = None,
        airline: Optional[str] = None,
        stops: str = "all",
        baggage_included: bool = False,
        outbound_dep_max: int = 1435,
        outbound_arr_max: int = 1435,
        return_dep_max: int = 1435,
        return_arr_max: int = 1435,
        sort_by: str = "cheapest",
    ) -> FlightSearchResponse:
        raise NotImplementedError


class BaseHotelProvider(ABC):
    @abstractmethod
    async def search_locations(
        self, query: str, locale: str = "ru"
    ) -> List[HotelLocationSuggestion]:
        raise NotImplementedError

    @abstractmethod
    async def search_hotels(
        self,
        destination: Optional[str] = None,
        check_in: Optional[str] = None,
        check_out: Optional[str] = None,
        guests: int = 2,
        rooms: int = 1,
        stars: Optional[List[int]] = None,
        meal_plans: Optional[List[str]] = None,
        free_cancellation: Optional[bool] = None,
        hotel_name: Optional[str] = None,
        sort_by: str = "popular",
        bbox: Optional[str] = None,
    ) -> HotelSearchResponse:
        raise NotImplementedError


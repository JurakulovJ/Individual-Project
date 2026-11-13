from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


class ProviderErrorItem(BaseModel):
    provider: str
    error: str
    code: str = "provider_error"


class NormalizedHotelOffer(BaseModel):
    provider: str = Field(..., description="Internal provider key e.g. booking, agoda, tripcom")
    provider_label: str = Field(..., description="Human-readable platform name e.g. Booking.com")
    hotel_id: str
    hotel_name: str
    room_name: str = "Standard Double Room"
    meal_plan: str = "BB"
    meal_label: str = "Завтрак включён"
    free_cancellation: bool = True
    price_per_night: float
    total_price: float
    nights: int = 1
    currency: str = "USD"
    is_cheapest: bool = False
    link_type: Literal["deep_link", "affiliate", "search"] = "search"
    deep_link: Optional[str] = None
    redirect_endpoint: str = ""
    badge: str = "Официальный партнёр"


class NormalizedHotel(BaseModel):
    id: str
    name: str
    city: str
    country: str = ""
    stars: int = 5
    rating: float = 9.0
    reviews_count: int = 120
    address: str = ""
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    price_per_night: float = 150.0
    total_price: float = 150.0
    currency: str = "USD"
    images: List[str] = Field(default_factory=list)
    amenities: List[str] = Field(default_factory=list)
    source: str = "mock"
    offers: List[NormalizedHotelOffer] = Field(default_factory=list)


class TripadvisorContentData(BaseModel):
    location_id: str
    name: str
    description: Optional[str] = None
    rating: Optional[float] = None
    num_reviews: int = 0
    web_url: Optional[str] = None
    photos: List[str] = Field(default_factory=list)
    reviews: List[Dict[str, Any]] = Field(default_factory=list)
    source: str = "tripadvisor"


class HotelAggregatedOffersResponse(BaseModel):
    hotel_id: str
    hotel_name: str
    city: str
    check_in: str
    check_out: str
    nights: int
    adults: int
    rooms: int = 1
    currency: str = "USD"
    source: Literal["mock", "live", "mixed"] = "mock"
    active_providers: List[str] = Field(default_factory=list)
    offers: List[NormalizedHotelOffer] = Field(default_factory=list)
    tripadvisor_content: Optional[TripadvisorContentData] = None
    errors: List[ProviderErrorItem] = Field(default_factory=list)


class RedirectResponseSchema(BaseModel):
    item_id: str = Field(..., description="hotel_id or flight_id")
    provider: str
    provider_label: str
    target_url: str
    link_type: Literal["deep_link", "affiliate", "search"] = "search"
    source: Literal["mock", "live"] = "mock"


class NormalizedFlightOffer(BaseModel):
    flight_id: str
    provider: str = Field(..., description="e.g. lufthansa, turkish_airlines, transavia")
    airline_name: str
    carrier_code: str
    flight_number: str
    origin: str
    destination: str
    departure_time: str
    arrival_time: str
    duration_minutes: int = 180
    stops: int = 0
    cabin_class: str = "economy"
    baggage_included: bool = True
    price: float
    currency: str = "USD"
    is_cheapest: bool = False
    link_type: Literal["deep_link", "affiliate", "search"] = "search"
    deep_link: Optional[str] = None
    redirect_endpoint: str = ""
    source: str = "mock"


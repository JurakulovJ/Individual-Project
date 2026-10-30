from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# ============================================================================
# 1. HOTELS SCHEMAS (/api/v1/hotels)
# ============================================================================

class HotelCoordinates(BaseModel):
    lat: float
    lng: float
    x: float = Field(default=50.0, description="Percentage X position")
    y: float = Field(default=50.0, description="Percentage Y position")


class HotelProviderOffer(BaseModel):
    provider: str
    provider_slug: str = "booking"
    price: float
    currency: str = "USD"
    meal_label: str = "Завтрак вкл."
    cancellation_label: str = "Бесплатная отмена"
    deep_link: str
    is_cheapest: bool = False


class HotelItem(BaseModel):
    id: str
    name: str
    city: str
    city_en: str = "New York"
    stars: int
    eco_certified: bool = False
    rating: float
    rating_label: str
    reviews_count: int
    ta_circles: float = 4.5
    address: str
    distance_to_center_km: float
    distance_center_label: str
    nearest_metro: str
    coordinates: HotelCoordinates
    images: List[str] = Field(default_factory=list)
    slides_total: int = 40
    loyalty_points: int
    room_type: str
    bed_type: str = "двуспальная кровать"
    meal_plan: str = Field(..., description="RO, BB, HB, FB, AI")
    meal_label: str
    meal_included: bool = False
    free_cancellation: bool
    cancellation_label: str
    payment_type: str
    old_price: float
    total_price: float
    nights: int = 7
    guests: int = 2
    currency: str = "USD"
    is_highlighted_pin: bool = False
    map_price_label: Optional[str] = None
    description: str = ""
    amenities: List[str] = Field(default_factory=list)
    check_in_time: str = "14:00"
    check_out_time: str = "12:00"
    cheapest_provider: str = "Booking.com"
    provider_offers: List[HotelProviderOffer] = Field(default_factory=list)


class HotelFilterFacets(BaseModel):
    meal_counts: Dict[str, int] = Field(default_factory=dict)
    star_counts: Dict[str, int] = Field(default_factory=dict)


class HotelLocationSuggestion(BaseModel):
    dest_id: str
    dest_type: str = "city"
    name: str
    city_name: str
    country: str
    label: str
    hotels_count: int = 96
    code: str = "IST"
    source: str = "booking_live"


class HotelSearchResponse(BaseModel):
    total_count: int
    displayed_count: int
    city_label: str
    city_center: Optional[HotelCoordinates] = None
    source: str = Field(default="catalog_live", description="booking_live, serpapi_live, or catalog_live")
    facets: HotelFilterFacets
    items: List[HotelItem]


# ============================================================================
# 2. FLIGHTS SCHEMAS (/api/v1/flights)
# ============================================================================

class FlightLegInfo(BaseModel):
    date_label: str
    route_subtext: str
    origin_code: str
    destination_code: str
    departure_time: str
    arrival_time: str
    dep_minutes: int
    arr_minutes: int
    next_day: Optional[str] = None
    duration_label: str
    duration_minutes: int
    stops_count: int
    stops_label: str
    stops_night: bool = False
    stops_subtext: Optional[str] = None
    flight_number: str
    aircraft: str = "Airbus A321neo"
    origin_terminal: str = "Терминал 1"
    destination_terminal: str = "Терминал 2"


class FlightTariffItem(BaseModel):
    id: str
    name: str
    baggage_included: bool
    baggage_weight: Optional[str] = None
    carry_on: bool = True
    exchangeable: bool = True
    refundable: bool = False
    old_price: float
    old_price_label: str
    price: float
    price_label: str
    seats_left: int = 4
    few_tickets: bool = True
    features: List[str] = Field(default_factory=list)


class FlightProviderOffer(BaseModel):
    provider: str
    provider_type: str = "ota"
    badge: str = ""
    price: float
    currency: str = "USD"
    deep_link: str
    is_cheapest: bool = False


class FlightPlaceSuggestion(BaseModel):
    code: str
    name: str
    country_name: str
    type: str = "city"
    main_airport_name: Optional[str] = None
    source: str = "aviasales_live"


class FlightItem(BaseModel):
    id: str
    validating_carrier: str
    airline_name: str
    carrier_code: str
    airline_logo_url: Optional[str] = Field(None, description="Aviasales CDN logo https://pics.avs.io/200/200/{iata}.png")
    airline_logo_bg: str = "#073590"
    airline_logo_text: str = "TK"
    carrier_symbol: str = "avs"
    ticketing_time_limit: Optional[str] = None
    stops: int
    baggage_included: bool
    cabin_class: str = "economy"
    total_duration_minutes: int
    min_price: float
    deep_link: Optional[str] = Field(None, description="Verified direct flight booking deep-link")
    source: str = "catalog_live"
    cheapest_provider: str = "Skyscanner"
    provider_offers: List[FlightProviderOffer] = Field(default_factory=list)
    outbound_leg: FlightLegInfo
    return_leg: FlightLegInfo
    tariffs: List[FlightTariffItem]


class FlightSortSummary(BaseModel):
    cheapest_price_label: str
    cheapest_duration_label: str
    fastest_price_label: str
    fastest_duration_label: str
    optimal_price_label: str
    optimal_duration_label: str
    time_limit_label: str = "до 21 дня"


class FlightSearchResponse(BaseModel):
    total_count: int
    source: str = Field(default="catalog_live", description="aviasales_live, serpapi_live, or catalog_live")
    sort_summaries: FlightSortSummary
    items: List[FlightItem]


# ============================================================================
# 3. TRANSFERS SCHEMAS (/api/v1/transfers)
# ============================================================================

class TransferProviderOffer(BaseModel):
    provider: str
    provider_slug: str = "kiwitaxi"
    badge: str = ""
    price: float
    currency: str = "USD"
    deep_link: str
    is_cheapest: bool = False


class TransferItem(BaseModel):
    id: str
    vehicle_class: str
    models: str
    capacity: int
    baggage_allowance: int
    duration: str
    free_waiting_time: str
    cancellation_policy: str
    free_cancellation: bool = True
    meet_with_sign: bool = True
    carrier_rating: str = "4.9"
    old_price: float
    price: float
    currency: str = "USD"
    image: str
    cheapest_provider: str = "Jayride"
    provider_offers: List[TransferProviderOffer] = Field(default_factory=list)


class TransferSearchResponse(BaseModel):
    total_count: int
    route_label: str
    items: List[TransferItem]


# ============================================================================
# 4. DASHBOARD & ORDERS SCHEMAS (/api/v1/dashboard & /api/v1/orders)
# ============================================================================

class PaymentInfoMetrics(BaseModel):
    not_due_amount: float = 0.0
    payment_required_amount: float = 0.0
    overdue_amount: float = 0.0
    total_amount: float = 0.0


class CancellationWindowMetrics(BaseModel):
    expiring_24h: int = 0
    expiring_4d: int = 0


class OrderStatusSection(BaseModel):
    payment_info: PaymentInfoMetrics
    free_cancellation: CancellationWindowMetrics
    auto_cancellation: CancellationWindowMetrics


class FinancialInfoSection(BaseModel):
    unpaid_orders_total: float = 0.0
    overdue_debt: float = 0.0
    unpaid_non_refundable: float = 0.0
    unpaid_refundable: float = 0.0
    contract_limit: float = 0.0
    overpayment: float = 0.0
    deposit: float = 0.0
    credit_limit: float = 0.0


class OrderCreateRequest(BaseModel):
    order_type: str = Field(..., description="hotel, flight, transfer, ai-bundle")
    title: str
    subtitle: Optional[str] = ""
    total_price: float
    currency: str = "USD"
    is_refundable: bool = True
    payment_status: str = Field(default="payment_required", description="not_due, payment_required, overdue, paid")
    loyalty_points: int = 25
    details: List[str] = Field(default_factory=list)
    customer_name: str = "ООО \"Shosh Prime\""


class OrderRecord(BaseModel):
    order_id: str
    created_at: str
    order_type: str
    title: str
    subtitle: str
    total_price: float
    currency: str
    is_refundable: bool
    payment_status: str
    loyalty_points: int
    details: List[str]
    customer_name: str


class DashboardSummaryResponse(BaseModel):
    order_status: OrderStatusSection
    financial_info: FinancialInfoSection
    active_orders_count: int
    loyalty_points_total: int
    recent_orders: List[OrderRecord] = Field(default_factory=list)


# ============================================================================
# 5. HYBRID AI ASSISTANT BUNDLE RESPONSE
# ============================================================================

class AIBundlePackage(BaseModel):
    id: str
    title: str
    match_score: str
    badge: str
    total_price: float
    old_total_price: float
    budget_limit: float
    summary: str
    hotel: HotelItem
    flight: FlightItem
    transfer: TransferItem
    applied_filters: Dict[str, Any]

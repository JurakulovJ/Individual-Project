from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ConstraintExtractionRequest(BaseModel):
    prompt: str = Field(..., description="Natural language description of the desired trip")
    conversation_id: Optional[str] = Field(None, description="Optional UUID for conversational context")


class TravelConstraints(BaseModel):
    destination: str = Field(..., description="Target city or country")
    origin: str = Field(default="TAS", description="Departure airport IATA code")
    start_date: str = Field(..., description="Trip start date (YYYY-MM-DD)")
    end_date: str = Field(..., description="Trip end date (YYYY-MM-DD)")
    budget_level: str = Field(default="moderate", description="Budget tier: budget, moderate, luxury")
    trip_type: str = Field(default="leisure", description="Type: romantic, cultural, adventure, relaxation, family, solo")
    interests: List[str] = Field(default_factory=list, description="Extracted interest tags")
    travelers_count: int = Field(default=1, description="Number of travelers")


class ActivityItem(BaseModel):
    time: str = Field(..., description="Scheduled time or time of day, e.g. 10:00 or Morning")
    title: str = Field(..., description="Activity title")
    category: str = Field(default="attraction", description="hotel, flight, attraction, dining, leisure, transport")
    cost: float = Field(default=0.0, description="Cost in USD")
    location: Optional[str] = Field(None, description="Place or venue name")
    description: Optional[str] = Field(None, description="Short summary of the activity")


class DayPlan(BaseModel):
    day_number: int = Field(..., description="Sequential day number (1, 2, ...)")
    date: str = Field(..., description="Date for this day (YYYY-MM-DD)")
    title: str = Field(..., description="Theme or title for the day")
    activities: List[ActivityItem] = Field(default_factory=list, description="Scheduled activities")


class ItineraryResponse(BaseModel):
    itinerary_id: str = Field(..., description="Unique itinerary identifier")
    destination: str = Field(..., description="Destination name")
    total_estimated_cost: float = Field(..., description="Total cost of the trip in USD")
    currency: str = Field(default="USD", description="Currency code")
    constraints: Optional[TravelConstraints] = Field(None, description="Extracted or provided constraints")
    flight_summary: Optional[Dict[str, Any]] = Field(None, description="Recommended flight details")
    hotel_summary: Optional[Dict[str, Any]] = Field(None, description="Recommended hotel details")
    days: List[DayPlan] = Field(default_factory=list, description="Day-by-day plan")

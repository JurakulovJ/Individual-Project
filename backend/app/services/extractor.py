import re
from datetime import date, timedelta
from typing import List, Optional
from app.schemas.plan import TravelConstraints
from app.adapters.mock_provider import mock_provider


def extract_constraints_from_prompt(prompt: str) -> TravelConstraints:
    """
    Extract structured travel constraints from natural language text.
    Uses regex, semantic keyword parsing, and known destination entities.
    Compatible with the UI_DATA_CONTRACT.md specification.
    """
    p_lower = prompt.lower()

    # 1. Destination Extraction
    destination = "Tokyo, Japan"
    dest_found = False
    for d in mock_provider.get_destinations():
        city = d.get("city", "")
        country = d.get("country", "")
        if city.lower() in p_lower or country.lower() in p_lower:
            destination = f"{city}, {country}"
            dest_found = True
            break

    if not dest_found:
        # Check known common cities
        city_patterns = [
            ("tokyo", "Tokyo, Japan"),
            ("paris", "Paris, France"),
            ("bali", "Bali, Indonesia"),
            ("rome", "Rome, Italy"),
            ("london", "London, UK"),
            ("new york", "New York, USA"),
            ("dubai", "Dubai, UAE"),
        ]
        for name, full in city_patterns:
            if name in p_lower:
                destination = full
                break

    # 2. Duration Extraction (e.g., "5-day", "3 days", "one week")
    days = 5
    day_match = re.search(r"(\d+)\s*(?:-|\s*)day", p_lower)
    if day_match:
        try:
            parsed_days = int(day_match.group(1))
            if 1 <= parsed_days <= 30:
                days = parsed_days
        except ValueError:
            pass
    elif "week" in p_lower:
        days = 7
    elif "weekend" in p_lower:
        days = 3

    # 3. Budget Level Extraction
    budget_level = "moderate"
    if any(w in p_lower for w in ["luxury", "five star", "5 star", "premium", "lavish", "high end"]):
        budget_level = "luxury"
    elif any(w in p_lower for w in ["moderate", "medium", "standard", "mid-range", "mid range"]):
        budget_level = "moderate"
    elif any(w in p_lower for w in ["cheap", "low cost", "low-cost", "backpack", "affordable", "economical", "budget-friendly", "on a budget", "tight budget"]):
        budget_level = "budget"
    elif "budget" in p_lower and "moderate" not in p_lower:
        budget_level = "budget"

    # 4. Trip Type Extraction
    trip_type = "cultural"
    if any(w in p_lower for w in ["romantic", "couple", "honeymoon"]):
        trip_type = "romantic"
    elif any(w in p_lower for w in ["family", "kids", "children"]):
        trip_type = "family"
    elif any(w in p_lower for w in ["adventure", "hiking", "trek", "thrill"]):
        trip_type = "adventure"
    elif any(w in p_lower for w in ["relax", "beach", "wellness", "spa", "chill"]):
        trip_type = "relaxation"
    elif any(w in p_lower for w in ["solo", "alone"]):
        trip_type = "solo"

    # 5. Interests Extraction
    interests: List[str] = []
    interest_keywords = {
        "culture": ["culture", "heritage", "traditional", "temple", "shrine", "museum"],
        "food": ["food", "culinary", "dining", "cuisine", "gourmet", "ramen", "sushi", "eat"],
        "sightseeing": ["sightseeing", "landmarks", "attractions", "tour", "explore"],
        "nightlife": ["nightlife", "bars", "clubs", "evening"],
        "shopping": ["shopping", "boutiques", "markets", "fashion"],
        "nature": ["nature", "parks", "outdoors", "mountains", "beaches"],
        "relaxation": ["relaxation", "spa", "massage", "wellness"],
        "art": ["art", "galleries", "architecture"],
    }
    for category, keywords in interest_keywords.items():
        if any(k in p_lower for k in keywords):
            interests.append(category)

    if not interests:
        interests = ["culture", "food", "sightseeing"]

    # 6. Travelers count
    travelers_count = 2 if trip_type == "romantic" else 1
    trav_match = re.search(r"(\d+)\s*(?:people|travelers|adults|persons)", p_lower)
    if trav_match:
        try:
            travelers_count = int(trav_match.group(1))
        except ValueError:
            pass
    elif "couple" in p_lower:
        travelers_count = 2
    elif "solo" in p_lower:
        travelers_count = 1

    # 7. Start & End Dates
    # Default to April 10, 2026 or future date if month is mentioned
    start_dt = date(2026, 4, 10)
    month_match = re.search(r"\b(january|february|march|april|may|june|july|august|september|october|november|december)\b", p_lower)
    if month_match:
        month_name = month_match.group(1)
        months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]
        m_idx = months.index(month_name) + 1
        start_dt = date(2026, m_idx, 10)

    end_dt = start_dt + timedelta(days=days)

    return TravelConstraints(
        destination=destination,
        origin="TAS",
        start_date=start_dt.isoformat(),
        end_date=end_dt.isoformat(),
        budget_level=budget_level,
        trip_type=trip_type,
        interests=interests,
        travelers_count=travelers_count,
    )

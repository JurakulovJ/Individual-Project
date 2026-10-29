import re
from datetime import date, timedelta
from typing import List
from app.schemas.plan import TravelConstraints
from app.adapters.mock_provider import mock_provider


def extract_constraints_from_prompt(prompt: str) -> TravelConstraints:
    """
    Extract structured travel constraints from natural language text (English & Russian).
    Uses regex, semantic keyword parsing, and known destination entities.
    Compatible with the UI_DATA_CONTRACT.md specification.
    """
    p_lower = prompt.lower()

    # 1. Destination Extraction (English & Russian)
    destination = "Tokyo, Japan"
    dest_found = False

    ru_city_patterns = [
        (["нью-йорк", "манхэттен", "new york", "nyc"], "New York, USA"),
        (["барселон", "barcelona"], "Barcelona, Spain"),
        (["лондон", "london"], "London, United Kingdom"),
        (["дубай", "оаэ", "dubai"], "Dubai, UAE"),
        (["токио", "япони", "tokyo"], "Tokyo, Japan"),
        (["париж", "франци", "paris"], "Paris, France"),
        (["бали", "индонези", "bali"], "Bali, Indonesia"),
        (["пхукет", "таиланд", "phuket"], "Phuket, Thailand"),
        (["ташкент", "узбекистан", "tashkent"], "Tashkent, Uzbekistan"),
        (["рим", "итали", "rome"], "Rome, Italy"),
    ]
    for keywords, full_name in ru_city_patterns:
        if any(k in p_lower for k in keywords):
            destination = full_name
            dest_found = True
            break

    if not dest_found:
        for d in mock_provider.get_destinations():
            city = d.get("city", "")
            city_ru = d.get("city_ru", "")
            country = d.get("country", "")
            if (
                (city and city.lower() in p_lower)
                or (city_ru and city_ru.lower() in p_lower)
                or (country and country.lower() in p_lower)
            ):
                destination = f"{city}, {country}"
                dest_found = True
                break

    # 2. Duration Extraction (e.g., "5-day", "7 дней", "7 ночей", "one week")
    days = 7 if any(w in p_lower for w in ["7 дней", "7 ночей", "недел"]) else 5
    day_match = re.search(r"(\d+)\s*(?:-|\s*)(?:day|дн|ноч)", p_lower)
    if day_match:
        try:
            parsed_days = int(day_match.group(1))
            if 1 <= parsed_days <= 30:
                days = parsed_days
        except ValueError:
            pass
    elif "week" in p_lower:
        days = 7
    elif "weekend" in p_lower or "выходн" in p_lower:
        days = 3

    # 3. Budget Level Extraction
    budget_level = "moderate"
    if any(
        w in p_lower
        for w in [
            "luxury", "five star", "5 star", "5*", "5 зв", "4-5*", "премиум",
            "vip", "люкс", "high end",
        ]
    ):
        budget_level = "luxury"
    elif any(
        w in p_lower
        for w in ["moderate", "medium", "standard", "mid-range", "оптим", "средн"]
    ):
        budget_level = "moderate"
    elif any(
        w in p_lower
        for w in [
            "cheap", "low cost", "low-cost", "affordable", "economical",
            "эконом", "недорог", "бюджетн",
        ]
    ):
        budget_level = "budget"

    # 4. Trip Type Extraction
    trip_type = "cultural"
    if any(w in p_lower for w in ["romantic", "couple", "honeymoon", "романтич", "для двоих"]):
        trip_type = "romantic"
    elif any(w in p_lower for w in ["family", "kids", "children", "семейн", "ребен", "детей"]):
        trip_type = "family"
    elif any(w in p_lower for w in ["adventure", "hiking", "trek", "приключ"]):
        trip_type = "adventure"
    elif any(w in p_lower for w in ["relax", "beach", "wellness", "spa", "пляж", "отдых"]):
        trip_type = "relaxation"
    elif any(w in p_lower for w in ["solo", "alone", "один"]):
        trip_type = "solo"

    # 5. Interests Extraction
    interests: List[str] = []
    interest_keywords = {
        "culture": ["culture", "heritage", "temple", "museum", "культур", "музе", "экскурс"],
        "food": ["food", "culinary", "dining", "breakfast", "завтрак", "питание", "ресторан", "bb", "ai"],
        "sightseeing": ["sightseeing", "landmarks", "tour", "explore", "центр", "таймс", "парк"],
        "relaxation": ["relaxation", "spa", "wellness", "beach", "пляж", "спа", "море"],
        "shopping": ["shopping", "boutiques", "markets", "шопинг"],
    }
    for category, keywords in interest_keywords.items():
        if any(k in p_lower for k in keywords):
            interests.append(category)

    if not interests:
        interests = ["culture", "food", "sightseeing"]

    # 6. Travelers count
    travelers_count = 2 if ("2 взросл" in p_lower or "2 гост" in p_lower or trip_type == "romantic") else 1
    trav_match = re.search(r"(\d+)\s*(?:people|travelers|adults|persons|взросл|гост|чел)", p_lower)
    if trav_match:
        try:
            travelers_count = int(trav_match.group(1))
        except ValueError:
            pass

    # 7. Start & End Dates
    start_dt = date(2026, 11, 12) if "нояб" in p_lower else date(2026, 4, 10)
    month_match = re.search(
        r"\b(january|february|march|april|may|june|july|august|september|october|november|december)\b",
        p_lower,
    )
    if month_match:
        month_name = month_match.group(1)
        months = [
            "january", "february", "march", "april", "may", "june",
            "july", "august", "september", "october", "november", "december",
        ]
        m_idx = months.index(month_name) + 1
        start_dt = date(2026, m_idx, 10)

    end_dt = start_dt + timedelta(days=days)

    return TravelConstraints(
        destination=destination,
        origin="BCN" if "барселон" in p_lower else "TAS",
        start_date=start_dt.isoformat(),
        end_date=end_dt.isoformat(),
        budget_level=budget_level,
        trip_type=trip_type,
        interests=interests,
        travelers_count=travelers_count,
    )

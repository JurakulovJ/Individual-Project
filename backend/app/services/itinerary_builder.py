import uuid
from datetime import datetime, timedelta
from typing import List
from app.schemas.plan import (
    TravelConstraints,
    ItineraryResponse,
    DayPlan,
    ActivityItem,
)
from app.adapters.mock_provider import mock_provider


def build_itinerary(constraints: TravelConstraints) -> ItineraryResponse:
    """
    Generate an intelligent, ranked, and fully cohesive itinerary from constraints.
    Conforms to UI_DATA_CONTRACT.md section 2.3.
    """
    city = constraints.destination.split(",")[0].strip()
    dest_info = mock_provider.find_destination(city) or {
        "city": city,
        "country": "International",
        "airport_code": "DEST",
        "avg_daily_budget": 120,
    }

    dest_code = dest_info.get("airport_code", "HND")

    # Dates calculation
    try:
        start_dt = datetime.strptime(constraints.start_date, "%Y-%m-%d").date()
        end_dt = datetime.strptime(constraints.end_date, "%Y-%m-%d").date()
        total_days = (end_dt - start_dt).days
        if total_days <= 0:
            total_days = 5
            end_dt = start_dt + timedelta(days=5)
    except Exception:
        start_dt = datetime.now().date() + timedelta(days=30)
        total_days = 5
        end_dt = start_dt + timedelta(days=5)

    # Flights & Hotels
    flights = mock_provider.get_flights(constraints.origin, dest_code)
    flight = flights[0] if flights else {
        "flight_id": "FL-001",
        "carrier": "Global Airways",
        "price": 580.0,
        "currency": "USD",
        "origin": constraints.origin,
        "destination": dest_code,
    }

    hotels = mock_provider.get_hotels(dest_info.get("city", city))
    hotel = hotels[0] if hotels else {
        "hotel_id": "HT-001",
        "name": f"Grand {city} Hotel",
        "price_per_night": 140.0,
        "currency": "USD",
        "rating": 4.5,
    }

    # Budget multiplier based on level
    budget_multiplier = {
        "budget": 0.75,
        "moderate": 1.0,
        "luxury": 1.85,
    }.get(constraints.budget_level.lower(), 1.0)

    # Base costs
    flight_total = float(flight.get("price", 500.0)) * constraints.travelers_count
    hotel_rate = float(hotel.get("price_per_night", 120.0)) * budget_multiplier
    hotel_total = hotel_rate * max(1, total_days - 1)

    curated_activities = mock_provider.get_curated_activities(dest_info.get("city", city))
    days_plan: List[DayPlan] = []
    activities_total = 0.0

    act_idx = 0
    num_curated = len(curated_activities)

    for d in range(1, total_days + 1):
        day_date = (start_dt + timedelta(days=d - 1)).isoformat()
        day_activities: List[ActivityItem] = []

        if d == 1:
            # Day 1: Arrival & Check-in
            day_title = f"Arrival & {city} Welcome Evening"
            day_activities.append(
                ActivityItem(
                    time="14:00",
                    title=f"Check-in at {hotel.get('name', 'Hotel')}",
                    category="hotel",
                    cost=round(hotel_rate, 2),
                    location=city,
                    description=f"Settle into your room and refresh. Amenities: {', '.join(hotel.get('amenities', ['Wi-Fi']))}",
                )
            )
            # Add an evening activity from curated list
            if num_curated > 0:
                eve_act = curated_activities[act_idx % num_curated]
                act_idx += 1
                eve_cost = round(float(eve_act.get("cost", 20.0)) * budget_multiplier, 2)
                activities_total += eve_cost
                day_activities.append(
                    ActivityItem(
                        time="18:30",
                        title=eve_act.get("title", f"Scenic Evening Walk in {city}"),
                        category=eve_act.get("category", "attraction"),
                        cost=eve_cost,
                        location=eve_act.get("location", city),
                        description="Experience the magical evening atmosphere and city views.",
                    )
                )

        elif d == total_days:
            # Last day: Highlights & Departure
            day_title = f"Final Sights & Departure from {city}"
            # Morning activity
            if num_curated > 0:
                morn_act = curated_activities[act_idx % num_curated]
                act_idx += 1
                morn_cost = round(float(morn_act.get("cost", 15.0)) * budget_multiplier, 2)
                activities_total += morn_cost
                day_activities.append(
                    ActivityItem(
                        time="10:00",
                        title=morn_act.get("title", f"Souvenir Shopping & Old Market"),
                        category="leisure",
                        cost=morn_cost,
                        location=morn_act.get("location", city),
                        description="Pick up local artisanal gifts, spices, and travel memorabilia.",
                    )
                )

            day_activities.append(
                ActivityItem(
                    time="13:00",
                    title="Hotel Check-out & Farewell Lunch",
                    category="dining",
                    cost=round(30.0 * budget_multiplier, 2),
                    location=hotel.get("name", "Hotel"),
                    description="Final delicious local meal before departing to the airport.",
                )
            )
            day_activities.append(
                ActivityItem(
                    time="16:30",
                    title=f"Airport Transfer & Departure ({dest_code} -> {constraints.origin})",
                    category="flight",
                    cost=0.0,
                    location=f"{dest_code} International Airport",
                    description=f"Board return flight with {flight.get('carrier', 'Airline')}.",
                )
            )
            activities_total += round(30.0 * budget_multiplier, 2)

        else:
            # Intermediate full days
            day_title = f"{city} Exploration & Culture - Day {d}"
            # Pick 2-3 activities
            for _ in range(2):
                if num_curated > 0:
                    act = curated_activities[act_idx % num_curated]
                    act_idx += 1
                    act_cost = round(float(act.get("cost", 25.0)) * budget_multiplier, 2)
                    activities_total += act_cost
                    day_activities.append(
                        ActivityItem(
                            time=act.get("time", "12:00"),
                            title=act.get("title", "City Highlights Tour"),
                            category=act.get("category", "attraction"),
                            cost=act_cost,
                            location=act.get("location", city),
                            description=f"Immerse yourself in authentic {city} culture and vibes.",
                        )
                    )

            # Add daily meal
            meal_cost = round(40.0 * budget_multiplier, 2)
            activities_total += meal_cost
            day_activities.append(
                ActivityItem(
                    time="19:30",
                    title=f"Curated {constraints.trip_type.capitalize()} Dinner Experience",
                    category="dining",
                    cost=meal_cost,
                    location=f"{city} Culinary District",
                    description=f"Sample local specialties tailored to your {', '.join(constraints.interests)} preferences.",
                )
            )

        days_plan.append(
            DayPlan(
                day_number=d,
                date=day_date,
                title=day_title,
                activities=day_activities,
            )
        )

    total_cost = round(flight_total + hotel_total + activities_total, 2)

    return ItineraryResponse(
        itinerary_id=f"itin_{uuid.uuid4().hex[:8]}",
        destination=constraints.destination,
        total_estimated_cost=total_cost,
        currency="USD",
        constraints=constraints,
        flight_summary=flight,
        hotel_summary=hotel,
        days=days_plan,
    )

import asyncio
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any
from app.schemas.plan import (
    TravelConstraints,
    ItineraryResponse,
    DayPlan,
    ActivityItem,
)
from app.adapters.mock_provider import mock_provider
from app.services.booking_repository import booking_repo
from app.providers.aviasales_provider import aviasales_flight_provider
from app.providers.booking_provider import booking_hotel_provider


async def build_itinerary_async(constraints: TravelConstraints) -> ItineraryResponse:
    """
    Generate an intelligent, ranked, and fully cohesive itinerary from constraints,
    simultaneously querying AviasalesFlightProvider and BookingHotelProvider
    with automatic fallback to MockProvider.
    """
    city = constraints.destination.split(",")[0].strip()
    dest_info = mock_provider.find_destination(city) or {
        "city": city,
        "city_ru": "Нью-Йорк",
        "country": "International",
        "airport_code": "JFK",
        "avg_daily_budget": 140,
    }

    dest_code = dest_info.get("airport_code", "HND")
    city_ru = dest_info.get("city_ru", city)

    # Dates calculation
    try:
        start_dt = datetime.strptime(constraints.start_date, "%Y-%m-%d").date()
        end_dt = datetime.strptime(constraints.end_date, "%Y-%m-%d").date()
        total_days = (end_dt - start_dt).days
        if total_days <= 0:
            total_days = 7
            end_dt = start_dt + timedelta(days=7)
    except Exception:
        start_dt = datetime.now().date() + timedelta(days=14)
        total_days = 7
        end_dt = start_dt + timedelta(days=7)

    # Simultaneously fetch from BookingHotelProvider and AviasalesFlightProvider
    hotels_resp, flights_resp = await asyncio.gather(
        booking_hotel_provider.search_hotels(
            destination=city,
            check_in=constraints.start_date,
            check_out=constraints.end_date,
            guests=constraints.travelers_count,
        ),
        aviasales_flight_provider.search_flights(
            origin=constraints.origin,
            destination=dest_code,
            departure_date=constraints.start_date,
            return_date=constraints.end_date,
        ),
    )

    matched_hotels = hotels_resp.items
    matched_flights = flights_resp.items
    matched_transfers = booking_repo.search_transfers(passengers=constraints.travelers_count).items

    top_hotel = matched_hotels[0] if matched_hotels else booking_repo.search_hotels().items[0]
    alt_hotel = matched_hotels[1] if len(matched_hotels) > 1 else booking_repo.search_hotels().items[1]
    top_flight = matched_flights[0] if matched_flights else booking_repo.search_flights().items[0]
    alt_flight = matched_flights[-1] if len(matched_flights) > 1 else top_flight
    top_transfer = matched_transfers[0]
    vip_transfer = matched_transfers[1] if len(matched_transfers) > 1 else matched_transfers[0]

    # Build bookable Hybrid AI Bundles with provider source badges
    bundle_1_price = round(top_hotel.total_price + top_flight.tariffs[-1].price + top_transfer.price, 2)
    bundle_1_old = round(top_hotel.old_price + top_flight.tariffs[-1].old_price + top_transfer.old_price, 2)

    bundle_2_price = round(alt_hotel.total_price + alt_flight.tariffs[0].price + vip_transfer.price, 2)
    bundle_2_old = round(alt_hotel.old_price + alt_flight.tariffs[0].old_price + vip_transfer.old_price, 2)

    recommended_bundles: List[Dict[str, Any]] = [
        {
            "id": f"ai-bundle-{top_hotel.id}",
            "title": f"AI Пакет: {city_ru} ({top_hotel.name} {top_hotel.stars}★)",
            "match_score": "98% совпадение с запросом",
            "badge": f"Экономия {max(50, int(bundle_1_old - bundle_1_price))} $ • +{top_hotel.loyalty_points} P",
            "total_price": bundle_1_price,
            "old_total_price": bundle_1_old,
            "loyalty_points": top_hotel.loyalty_points,
            "is_refundable": top_hotel.free_cancellation,
            "flight_source": flights_resp.source,
            "hotel_source": hotels_resp.source,
            "summary": f"{top_flight.validating_carrier} ({top_flight.outbound_leg.origin_code} ⇄ {top_flight.outbound_leg.destination_code}) + {total_days} ночей в {top_hotel.name} + {top_transfer.vehicle_class}",
            "flight": {
                "id": top_flight.id,
                "carrier": f"{top_flight.airline_name} ({top_flight.outbound_leg.flight_number})",
                "route": f"{top_flight.outbound_leg.origin_code} ⇄ {top_flight.outbound_leg.destination_code}",
                "dates": f"{top_flight.outbound_leg.date_label} • {top_flight.outbound_leg.stops_label} ({top_flight.outbound_leg.duration_label})",
                "tariff": f"Тариф {top_flight.tariffs[-1].name}",
                "price": top_flight.tariffs[-1].price,
                "airline_logo_url": top_flight.airline_logo_url,
                "deep_link": top_flight.deep_link,
            },
            "hotel": {
                "id": top_hotel.id,
                "name": f"{top_hotel.name} {top_hotel.stars}★",
                "location": f"{top_hotel.address} • Рейтинг {top_hotel.rating_label}/10",
                "room": f"{top_hotel.room_type} • {top_hotel.meal_label}",
                "perks": f"{top_hotel.cancellation_label} • {top_hotel.payment_type} • до {top_hotel.loyalty_points} P",
                "price": top_hotel.total_price,
            },
            "transfer": {
                "id": top_transfer.id,
                "type": top_transfer.vehicle_class,
                "details": f"{top_transfer.free_waiting_time} • {top_transfer.duration}",
                "price": top_transfer.price,
            },
            "target_search_state": {
                "hotelDestination": f"{city_ru}, {dest_info.get('country_ru', dest_info.get('country', ''))}",
                "selectedCityShort": city_ru,
                "stars": [5] if constraints.budget_level == "luxury" else [4, 5],
                "meals": ["BB"] if "food" in constraints.interests else [],
                "freeCancellation": True,
                "flightOrigin": "Барселона, Испания",
                "flightDestination": f"{city_ru}, {dest_info.get('country_ru', dest_info.get('country', ''))}",
            },
        },
        {
            "id": f"ai-bundle-{alt_hotel.id}",
            "title": f"Альтернатива Executive: {alt_hotel.name} {alt_hotel.stars}★",
            "match_score": "95% совпадение",
            "badge": f"Премиум сервис • +{alt_hotel.loyalty_points} P баллов",
            "total_price": bundle_2_price,
            "old_total_price": bundle_2_old,
            "loyalty_points": alt_hotel.loyalty_points,
            "is_refundable": alt_hotel.free_cancellation,
            "flight_source": flights_resp.source,
            "hotel_source": hotels_resp.source,
            "summary": f"{alt_flight.validating_carrier} + {alt_hotel.name} ({alt_hotel.meal_label}) + VIP-трансфер {vip_transfer.models}",
            "flight": {
                "id": alt_flight.id,
                "carrier": f"{alt_flight.airline_name} ({alt_flight.outbound_leg.flight_number})",
                "route": f"{alt_flight.outbound_leg.origin_code} ⇄ {alt_flight.outbound_leg.destination_code}",
                "dates": f"{alt_flight.outbound_leg.date_label} • {alt_flight.outbound_leg.stops_label}",
                "tariff": f"Тариф {alt_flight.tariffs[0].name}",
                "price": alt_flight.tariffs[0].price,
                "airline_logo_url": alt_flight.airline_logo_url,
                "deep_link": alt_flight.deep_link,
            },
            "hotel": {
                "id": alt_hotel.id,
                "name": f"{alt_hotel.name} {alt_hotel.stars}★",
                "location": f"{alt_hotel.address} • Рейтинг {alt_hotel.rating_label}/10",
                "room": f"{alt_hotel.room_type} • {alt_hotel.meal_label}",
                "perks": f"{alt_hotel.cancellation_label} • {alt_hotel.payment_type}",
                "price": alt_hotel.total_price,
            },
            "transfer": {
                "id": vip_transfer.id,
                "type": vip_transfer.vehicle_class,
                "details": vip_transfer.free_waiting_time,
                "price": vip_transfer.price,
            },
            "target_search_state": {
                "hotelDestination": f"{city_ru}, {dest_info.get('country_ru', dest_info.get('country', ''))}",
                "selectedCityShort": city_ru,
                "stars": [5],
                "meals": ["BB", "RO"],
                "freeCancellation": False,
                "flightOrigin": "Барселона, Испания",
                "flightDestination": "Лондон, Великобритания",
            },
        },
    ]

    suggested_manual_filters = recommended_bundles[0]["target_search_state"]

    flight_summary = {
        "flight_id": top_flight.id,
        "carrier": top_flight.airline_name,
        "price": top_flight.min_price,
        "currency": "USD",
        "origin": top_flight.outbound_leg.origin_code,
        "destination": top_flight.outbound_leg.destination_code,
        "duration": top_flight.outbound_leg.duration_label,
        "source": flights_resp.source,
    }
    hotel_summary = {
        "hotel_id": top_hotel.id,
        "name": top_hotel.name,
        "city": top_hotel.city,
        "price_per_night": round(top_hotel.total_price / max(1, top_hotel.nights), 2),
        "currency": "USD",
        "rating": top_hotel.rating,
        "source": hotels_resp.source,
    }

    curated_activities = mock_provider.get_curated_activities(dest_info.get("city", city))
    days_plan: List[DayPlan] = []
    act_idx = 0
    num_curated = len(curated_activities)

    for d in range(1, total_days + 1):
        day_date = (start_dt + timedelta(days=d - 1)).isoformat()
        day_activities: List[ActivityItem] = []

        if d == 1:
            day_title = f"Прилёт и заселение в {top_hotel.name} ({city_ru})"
            day_activities.append(
                ActivityItem(
                    time="14:00",
                    title=f"Заселение в {top_hotel.name} ({top_hotel.room_type})",
                    category="hotel",
                    cost=round(top_hotel.total_price / max(1, total_days), 2),
                    location=top_hotel.address,
                    description=f"{top_hotel.meal_label} • {top_hotel.cancellation_label}",
                )
            )
            if num_curated > 0:
                eve_act = curated_activities[act_idx % num_curated]
                act_idx += 1
                day_activities.append(
                    ActivityItem(
                        time="18:30",
                        title=eve_act.get("title", f"Вечерняя обзорная прогулка по {city_ru}"),
                        category=eve_act.get("category", "attraction"),
                        cost=float(eve_act.get("cost", 25.0)),
                        location=eve_act.get("location", city_ru),
                        description="Знакомство с центром города и атмосферой.",
                    )
                )
        elif d == total_days:
            day_title = "Выезд из отеля и индивидуальный трансфер в аэропорт"
            day_activities.append(
                ActivityItem(
                    time="12:00",
                    title=f"Check-out и подача трансфера ({top_transfer.vehicle_class})",
                    category="transport",
                    cost=top_transfer.price,
                    location=top_hotel.name,
                    description=top_transfer.free_waiting_time,
                )
            )
            day_activities.append(
                ActivityItem(
                    time=top_flight.return_leg.departure_time,
                    title=f"Обратный вылет рейсом {top_flight.airline_name} ({top_flight.return_leg.flight_number})",
                    category="flight",
                    cost=top_flight.min_price,
                    location=top_flight.return_leg.route_subtext,
                    description=top_flight.return_leg.duration_label,
                )
            )
        else:
            day_title = f"День {d}: Исследование {city_ru} и ключевые локации"
            for _ in range(2):
                if num_curated > 0:
                    act = curated_activities[act_idx % num_curated]
                    act_idx += 1
                    day_activities.append(
                        ActivityItem(
                            time=act.get("time", "11:00"),
                            title=act.get("title", f"Экскурсия по центру {city_ru}"),
                            category=act.get("category", "attraction"),
                            cost=float(act.get("cost", 30.0)),
                            location=act.get("location", city_ru),
                            description="Рекомендовано алгоритмом TravelAI по вашим интересам.",
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

    return ItineraryResponse(
        itinerary_id=f"itin_{uuid.uuid4().hex[:8]}",
        destination=constraints.destination,
        total_estimated_cost=bundle_1_price,
        currency="USD",
        constraints=constraints,
        flight_summary=flight_summary,
        hotel_summary=hotel_summary,
        days=days_plan,
        recommended_bundles=recommended_bundles,
        suggested_manual_filters=suggested_manual_filters,
    )


def build_itinerary(constraints: TravelConstraints) -> ItineraryResponse:
    """
    Synchronous wrapper for compatibility if invoked outside an async route.
    """
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        # Fallback to direct synchronous repo query if called inside an already running event loop synchronously
        return asyncio.run_coroutine_threadsafe(build_itinerary_async(constraints), loop).result()
    return asyncio.run(build_itinerary_async(constraints))

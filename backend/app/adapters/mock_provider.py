import json
from pathlib import Path
from typing import List, Dict, Any, Optional

DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "sample_destinations.json"


class MockProvider:
    """
    Offline-resilient mock data provider for destinations, flights, hotels, and activities.
    Guarantees deterministic, fast responses for development, demo, and test environments.
    """

    def __init__(self, data_path: Path = DATA_FILE):
        self.data_path = data_path
        self._data: Dict[str, Any] = self._load_data()

    def _load_data(self) -> Dict[str, Any]:
        if self.data_path.exists():
            try:
                with open(self.data_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return {
            "destinations": [],
            "mock_flights": [],
            "mock_hotels": [],
        }

    def get_destinations(self) -> List[Dict[str, Any]]:
        return self._data.get("destinations", [])

    def find_destination(self, query: str) -> Optional[Dict[str, Any]]:
        query_lower = query.lower()
        destinations = self.get_destinations()
        for d in destinations:
            if d.get("city", "").lower() in query_lower or d.get("country", "").lower() in query_lower:
                return d
        # Fallback to first destination if available
        return destinations[0] if destinations else None

    def get_flights(self, origin: str, dest_code: str) -> List[Dict[str, Any]]:
        flights = self._data.get("mock_flights", [])
        matched = [f for f in flights if f.get("destination") == dest_code]
        if matched:
            return matched
        # Return fallback flight offer
        return [
            {
                "flight_id": f"FL-{origin}-{dest_code}",
                "carrier": "Global Airways",
                "origin": origin,
                "destination": dest_code,
                "price": 550.0,
                "currency": "USD",
                "duration": "7h 45m",
                "stops": 1,
            }
        ]

    def get_hotels(self, city: str) -> List[Dict[str, Any]]:
        hotels = self._data.get("mock_hotels", [])
        matched = [h for h in hotels if h.get("city", "").lower() == city.lower()]
        if matched:
            return matched
        return [
            {
                "hotel_id": f"HT-{city[:3].upper()}",
                "name": f"Grand {city} Central Hotel",
                "city": city,
                "price_per_night": 130.0,
                "currency": "USD",
                "rating": 4.5,
                "amenities": ["Wi-Fi", "Breakfast", "Central Location"],
            }
        ]

    def get_curated_activities(self, city: str) -> List[Dict[str, Any]]:
        activities_map = {
            "tokyo": [
                {"time": "09:00", "title": "Senso-ji Temple & Asakusa Walking Tour", "category": "attraction", "cost": 15.0, "location": "Asakusa"},
                {"time": "12:30", "title": "Traditional Tsukiji Outer Market Sushi Lunch", "category": "dining", "cost": 30.0, "location": "Tsukiji"},
                {"time": "15:00", "title": "Meiji Jingu Shrine & Yoyogi Park Stroll", "category": "attraction", "cost": 10.0, "location": "Harajuku"},
                {"time": "18:00", "title": "Shibuya Sky Panoramic Observation Deck", "category": "attraction", "cost": 25.0, "location": "Shibuya"},
                {"time": "20:00", "title": "Ramen Tasting & Izakaya Experience in Shinjuku", "category": "dining", "cost": 40.0, "location": "Omoide Yokocho"},
                {"time": "10:00", "title": "teamLab Planets Digital Art Museum", "category": "attraction", "cost": 35.0, "location": "Toyosu"},
                {"time": "13:30", "title": "Akihabara Tech & Anime Exploration", "category": "leisure", "cost": 20.0, "location": "Akihabara"},
                {"time": "17:00", "title": "Ginza High-End Shopping & Architecture Walk", "category": "leisure", "cost": 0.0, "location": "Ginza"},
                {"time": "19:30", "title": "Tokyo Tower Sunset View & Kaiseki Dinner", "category": "dining", "cost": 85.0, "location": "Minato"},
            ],
            "paris": [
                {"time": "09:30", "title": "Louvre Museum Masterpieces & Mona Lisa", "category": "attraction", "cost": 22.0, "location": "1st Arrondissement"},
                {"time": "12:30", "title": "Classic Parisian Bistro Lunch in Saint-Germain", "category": "dining", "cost": 35.0, "location": "Saint-Germain"},
                {"time": "14:30", "title": "Eiffel Tower Summit Elevator Tour", "category": "attraction", "cost": 30.0, "location": "Champ de Mars"},
                {"time": "17:30", "title": "Seine River Sunset Sightseeing Cruise", "category": "leisure", "cost": 18.0, "location": "Pont Neuf"},
                {"time": "20:00", "title": "Montmartre Evening Dinner & Sacre-Coeur View", "category": "dining", "cost": 50.0, "location": "Montmartre"},
                {"time": "10:00", "title": "Musee d'Orsay Impressionist Collection", "category": "attraction", "cost": 16.0, "location": "7th Arrondissement"},
                {"time": "14:00", "title": "Champs-Elysees & Arc de Triomphe", "category": "attraction", "cost": 15.0, "location": "8th Arrondissement"},
                {"time": "19:00", "title": "French Wine & Cheese Tasting Masterclass", "category": "dining", "cost": 65.0, "location": "Le Marais"},
            ],
            "bali": [
                {"time": "08:30", "title": "Tegalalang Rice Terraces Scenic Trek", "category": "attraction", "cost": 10.0, "location": "Ubud"},
                {"time": "11:30", "title": "Sacred Monkey Forest Sanctuary Visit", "category": "attraction", "cost": 8.0, "location": "Ubud"},
                {"time": "13:30", "title": "Organic Balinese Farm-to-Table Lunch", "category": "dining", "cost": 18.0, "location": "Ubud"},
                {"time": "16:00", "title": "Traditional Balinese Herbal Spa Treatment", "category": "leisure", "cost": 45.0, "location": "Seminyak"},
                {"time": "18:30", "title": "Jimbaran Bay Beachfront Seafood Sunset Dinner", "category": "dining", "cost": 35.0, "location": "Jimbaran"},
                {"time": "09:00", "title": "Uluwatu Cliff Temple & Coastal Views", "category": "attraction", "cost": 12.0, "location": "Uluwatu"},
                {"time": "15:00", "title": "Canggu Beach Club Relaxation & Surf Watching", "category": "leisure", "cost": 25.0, "location": "Canggu"},
            ],
        }
        return activities_map.get(city.lower(), [
            {"time": "09:30", "title": f"Historic Old Town Guided Walk in {city}", "category": "attraction", "cost": 20.0, "location": "City Center"},
            {"time": "12:30", "title": "Local Culinary Tasting Lunch", "category": "dining", "cost": 25.0, "location": "Local District"},
            {"time": "15:00", "title": f"Iconic Landmarks & Panoramic Viewpoint in {city}", "category": "attraction", "cost": 18.0, "location": "Historic Quarter"},
            {"time": "19:00", "title": "Sunset Dinner with Cultural Performance", "category": "dining", "cost": 45.0, "location": "Waterfront"},
        ])


mock_provider = MockProvider()


# ============================================================================
# STAGE 2: UNIFIED MOCK ADAPTER FOR HOTELS & FLIGHTS (`source="mock"`)
# ============================================================================

from datetime import datetime
from urllib.parse import quote_plus
from app.adapters.base import FlightProvider, HotelProvider
from app.schemas.providers import (
    NormalizedFlightOffer,
    NormalizedHotel,
    NormalizedHotelOffer,
    RedirectResponseSchema,
    TripadvisorContentData,
)
from app.services.deeplinks import (
    build_agoda_hotel_url,
    build_booking_hotel_url,
    build_official_airline_url,
    build_tripcom_hotel_url,
    normalize_to_iso_date,
    resolve_iata_code,
)


def _calc_nights(check_in: Optional[str], check_out: Optional[str]) -> int:
    try:
        ci = datetime.strptime(normalize_to_iso_date(check_in, "2026-11-12"), "%Y-%m-%d")
        co = datetime.strptime(normalize_to_iso_date(check_out, "2026-11-19"), "%Y-%m-%d")
        diff = (co - ci).days
        return max(1, min(90, diff)) if diff > 0 else 7
    except Exception:
        return 7


class MockAdapter(HotelProvider, FlightProvider):
    """
    Deterministic Mock Adapter activated automatically when all live providers are disabled
    or when USE_MOCK_PROVIDERS=true. Always sets `"source": "mock"`.
    """

    provider_name: str = "mock"
    provider_label: str = "Mock Demo Provider"
    docs_url: str = "local://mock-adapter"

    def is_enabled(self) -> bool:
        return True

    async def search_hotels(
        self,
        query: str,
        check_in: Optional[str] = None,
        check_out: Optional[str] = None,
        adults: int = 2,
        rooms: int = 1,
        currency: str = "USD",
    ) -> List[NormalizedHotel]:
        from app.services.catalog_engine import generate_city_hotels

        nights = _calc_nights(check_in, check_out)
        items, city_label, _ = generate_city_hotels(
            destination=query or "Стамбул",
            check_in=check_in,
            check_out=check_out,
            guests=adults,
            rooms=rooms,
            nights=nights,
        )
        normalized: List[NormalizedHotel] = []
        for h in items[:25]:
            per_night = round(h.total_price / max(1, nights), 2)
            offers = await self.get_offers(
                hotel_id=h.id,
                check_in=check_in,
                check_out=check_out,
                adults=adults,
                rooms=rooms,
                currency=currency,
                hotel_name=h.name,
                city=h.city_en,
                base_total_price=h.total_price,
            )
            normalized.append(
                NormalizedHotel(
                    id=h.id,
                    name=h.name,
                    city=h.city,
                    stars=h.stars,
                    rating=h.rating,
                    reviews_count=h.reviews_count,
                    address=h.address,
                    latitude=h.coordinates.lat,
                    longitude=h.coordinates.lng,
                    price_per_night=per_night,
                    total_price=h.total_price,
                    currency=currency.upper(),
                    images=h.images,
                    amenities=h.amenities,
                    source="mock",
                    offers=offers,
                )
            )
        return normalized

    async def get_offers(
        self,
        hotel_id: str,
        check_in: Optional[str] = None,
        check_out: Optional[str] = None,
        adults: int = 2,
        rooms: int = 1,
        currency: str = "USD",
        hotel_name: Optional[str] = None,
        city: Optional[str] = None,
        base_total_price: Optional[float] = None,
    ) -> List[NormalizedHotelOffer]:
        nights = _calc_nights(check_in, check_out)
        resolved_name = hotel_name or "Hilton Tashkent City"
        resolved_city = city or "Tashkent"

        if base_total_price is None:
            seed = sum(ord(c) for c in str(hotel_id))
            per_night_base = 185.0 + (seed % 110)
            base_total = round(per_night_base * nights, 2)
        else:
            base_total = round(float(base_total_price), 2)

        platforms = [
            ("booking", "Booking.com", 1.00, "BB", "Завтрак включён", True, "Официальный партнёр Booking.com"),
            ("agoda", "Agoda", 1.03, "BB", "Завтрак включён", True, "Спецтариф Agoda Partner"),
            ("tripcom", "Trip.com", 1.06, "BB", "Завтрак включён", True, "Официальный партнёр Trip.com"),
        ]
        # Deterministic rotation of cheapest platform by hotel_id
        rot = sum(ord(c) for c in str(hotel_id)) % len(platforms)
        multipliers = [1.00, 1.035, 1.065]

        offers: List[NormalizedHotelOffer] = []
        for idx, (p_key, p_label, _, meal_code, meal_lbl, free_canc, badge) in enumerate(platforms):
            mult = multipliers[(idx - rot) % len(multipliers)]
            tot = round(base_total * mult, 0)
            per_n = round(tot / max(1, nights), 2)
            offers.append(
                NormalizedHotelOffer(
                    provider=p_key,
                    provider_label=p_label,
                    hotel_id=str(hotel_id),
                    hotel_name=resolved_name,
                    room_name="Двухместный номер Standard / Superior",
                    meal_plan=meal_code,
                    meal_label=meal_lbl,
                    free_cancellation=free_canc,
                    price_per_night=per_n,
                    total_price=tot,
                    nights=nights,
                    currency=currency.upper(),
                    is_cheapest=(mult == 1.00),
                    link_type="search",
                    deep_link=None,
                    redirect_endpoint=f"/api/v1/hotels/{hotel_id}/offers/{p_key}/redirect",
                    badge=badge,
                )
            )
        offers.sort(key=lambda o: o.total_price)
        for i, off in enumerate(offers):
            off.is_cheapest = i == 0
        return offers

    def get_mock_tripadvisor_content(self, hotel_id: str, hotel_name: str, city: str) -> TripadvisorContentData:
        return TripadvisorContentData(
            location_id=f"ta-mock-{hotel_id}",
            name=hotel_name,
            description=(
                f"Отель {hotel_name} ({city}) отмечен высокими оценками путешественников Tripadvisor "
                "за качество сервиса, чистоту номеров и удобное расположение."
            ),
            rating=9.2,
            num_reviews=432,
            web_url=f"https://www.tripadvisor.com/Search?q={quote_plus(f'{hotel_name} {city}')}",
            photos=[
                "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=900&q=80",
                "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=900&q=80",
            ],
            reviews=[
                {
                    "id": "rev-1",
                    "title": "Безупречный сервис и комфорт",
                    "text": "Отличный завтрак, просторный номер и быстрая регистрация.",
                    "rating": 5,
                    "published_date": "2026-10-15",
                }
            ],
            source="mock",
        )

    async def build_redirect_url(
        self,
        hotel_id: str,
        check_in: Optional[str] = None,
        check_out: Optional[str] = None,
        adults: int = 2,
        rooms: int = 1,
        hotel_name: Optional[str] = None,
        city: Optional[str] = None,
        deep_link: Optional[str] = None,
        provider: str = "booking",
    ) -> RedirectResponseSchema:
        p_low = (provider or "booking").lower()
        name = hotel_name or str(hotel_id)
        city_val = city or "Tashkent"

        if "agoda" in p_low:
            url = build_agoda_hotel_url(name, city_val, check_in, check_out, adults, rooms)
            label = "Agoda"
            p_norm = "agoda"
        elif "trip" in p_low:
            url = build_tripcom_hotel_url(name, city_val, check_in, check_out, adults, rooms)
            label = "Trip.com"
            p_norm = "tripcom"
        else:
            url = build_booking_hotel_url(name, city_val, check_in, check_out, adults, rooms)
            label = "Booking.com"
            p_norm = "booking"

        return RedirectResponseSchema(
            item_id=str(hotel_id),
            provider=p_norm,
            provider_label=label,
            target_url=url,
            link_type="search",
            source="mock",
        )

    async def search_flights(
        self,
        origin: str,
        destination: str,
        departure_date: str,
        return_date: Optional[str] = None,
        adults: int = 1,
        cabin_class: str = "economy",
        currency: str = "USD",
    ) -> List[NormalizedFlightOffer]:
        orig_iata = resolve_iata_code(origin, "TAS")
        dest_iata = resolve_iata_code(destination, "IST")
        dep_iso = normalize_to_iso_date(departure_date, "2026-11-19")

        sample_carriers = [
            ("lufthansa", "Lufthansa", "LH", f"LH-647", "08:15", "12:10", 235, 0, 295.0),
            ("turkish_airlines", "Turkish Airlines", "TK", f"TK-369", "10:40", "14:15", 215, 0, 315.0),
            ("transavia", "Transavia", "HV", f"HV-512", "15:20", "19:45", 265, 1, 240.0),
        ]
        offers: List[NormalizedFlightOffer] = []
        for idx, (prov, name, code, fnum, d_t, a_t, dur, stops, base_p) in enumerate(sample_carriers):
            fid = f"flt-{orig_iata.lower()}-{dest_iata.lower()}-{idx}"
            price = round(base_p * max(1, adults), 2)
            offers.append(
                NormalizedFlightOffer(
                    flight_id=fid,
                    provider=prov,
                    airline_name=name,
                    carrier_code=code,
                    flight_number=fnum,
                    origin=orig_iata,
                    destination=dest_iata,
                    departure_time=d_t,
                    arrival_time=a_t,
                    duration_minutes=dur,
                    stops=stops,
                    cabin_class=cabin_class,
                    baggage_included=(stops == 0),
                    price=price,
                    currency=currency.upper(),
                    is_cheapest=(idx == 2),
                    link_type="search",
                    deep_link=build_official_airline_url(code, orig_iata, dest_iata, dep_iso, return_date, adults),
                    redirect_endpoint=f"/api/v1/flights/{fid}/redirect?provider={prov}",
                    source="mock",
                )
            )
        offers.sort(key=lambda x: x.price)
        for i, o in enumerate(offers):
            o.is_cheapest = i == 0
        return offers

    async def build_flight_redirect_url(
        self,
        flight_id: str,
        origin: str,
        destination: str,
        departure_date: str,
        return_date: Optional[str] = None,
        adults: int = 1,
        carrier_code: str = "LH",
        provider: str = "lufthansa",
    ) -> RedirectResponseSchema:
        orig_iata = resolve_iata_code(origin, "TAS")
        dest_iata = resolve_iata_code(destination, "IST")
        dep_iso = normalize_to_iso_date(departure_date, "2026-11-19")
        ret_iso = normalize_to_iso_date(return_date, "2026-11-26") if return_date else None

        url = build_official_airline_url(
            carrier_code=carrier_code,
            origin_iata=orig_iata,
            dest_iata=dest_iata,
            departure_date=dep_iso,
            return_date=ret_iso,
            adults=max(1, adults),
        )
        return RedirectResponseSchema(
            item_id=str(flight_id),
            provider=provider,
            provider_label=provider.replace("_", " ").title(),
            target_url=url,
            link_type="search",
            source="mock",
        )


mock_adapter = MockAdapter()


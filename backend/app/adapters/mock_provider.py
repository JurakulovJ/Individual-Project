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

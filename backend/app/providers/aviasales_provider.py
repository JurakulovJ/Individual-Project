import re
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import httpx

from app.core.config import settings
from app.providers.base import BaseFlightProvider, TTLCache
from app.schemas.booking import (
    FlightItem,
    FlightLegInfo,
    FlightPlaceSuggestion,
    FlightSearchResponse,
    FlightSortSummary,
    FlightTariffItem,
)
from app.services.booking_repository import booking_repo

AIRLINE_NAMES: Dict[str, str] = {
    "FR": "Ryanair",
    "UX": "Air Europa",
    "BA": "British Airways",
    "HY": "Uzbekistan Airways",
    "TK": "Turkish Airlines",
    "EK": "Emirates",
    "LH": "Lufthansa",
    "VY": "Vueling Airlines",
    "W6": "Wizz Air",
    "SU": "Aeroflot",
    "KC": "Air Astana",
    "FZ": "flydubai",
    "QR": "Qatar Airways",
}

CITY_TO_IATA: Dict[str, str] = {
    "барселона": "BCN",
    "barcelona": "BCN",
    "bcn": "BCN",
    "лондон": "LON",
    "london": "LON",
    "lon": "LON",
    "stn": "STN",
    "lhr": "LHR",
    "нью-йорк": "NYC",
    "new york": "NYC",
    "nyc": "NYC",
    "jfk": "JFK",
    "ташкент": "TAS",
    "tashkent": "TAS",
    "tas": "TAS",
    "дубай": "DXB",
    "dubai": "DXB",
    "dxb": "DXB",
    "париж": "PAR",
    "paris": "PAR",
    "cdg": "CDG",
    "токио": "TYO",
    "tokyo": "TYO",
    "hnd": "HND",
    "бали": "DPS",
    "bali": "DPS",
    "dps": "DPS",
    "пхукет": "HKT",
    "phuket": "HKT",
    "hkt": "HKT",
    "стамбул": "IST",
    "istanbul": "IST",
    "ist": "IST",
}


class AviasalesFlightProvider(BaseFlightProvider):
    """
    Live Aviasales / Travelpayouts Flight Provider with automatic TTL caching
    and resilient fallback to MockProvider.
    """

    AUTOCOMPLETE_URL = "https://autocomplete.travelpayouts.com/places2"
    SEARCH_URL = "https://api.travelpayouts.com/aviasales/v3/prices_for_dates"

    def __init__(self) -> None:
        self._cache = TTLCache(default_ttl_seconds=300)

    def resolve_iata(self, text: Optional[str], default_code: str = "BCN") -> str:
        if not text or not text.strip():
            return default_code
        cleaned = text.strip()
        # Check if 3-letter uppercase IATA code is already inside string
        m = re.search(r"\b([A-Z]{3})\b", cleaned)
        if m:
            return m.group(1)
        lower = cleaned.lower()
        for key, code in CITY_TO_IATA.items():
            if key in lower:
                return code
        if len(cleaned) == 3 and cleaned.isalpha():
            return cleaned.upper()
        return default_code

    def _parse_iso_to_time_and_mins(self, iso_str: str) -> tuple[str, int, str]:
        try:
            dt = datetime.fromisoformat(iso_str)
            time_str = dt.strftime("%H:%M")
            mins = dt.hour * 60 + dt.minute
            months_ru = [
                "янв", "фев", "мар", "апр", "мая", "июн",
                "июл", "авг", "сен", "окт", "нояб", "дек",
            ]
            days_ru = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"]
            date_label = f"{dt.day} {months_ru[dt.month - 1]}, {days_ru[dt.weekday()]}"
            return time_str, mins, date_label
        except Exception:
            return "13:00", 780, "19 нояб, чт"

    def _format_duration_ru(self, minutes: int) -> str:
        h = max(1, minutes // 60)
        m = minutes % 60
        return f"{h} ч {m:02d} мин в пути"

    async def autocomplete_places(
        self, term: str, locale: str = "ru"
    ) -> List[FlightPlaceSuggestion]:
        query = (term or "").strip()
        if not query:
            query = "Барселона"

        cache_key = f"avs_auto:{locale}:{query.lower()}"
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached

        # Public Travelpayouts autocomplete API (works without token)
        try:
            params = [
                ("term", query),
                ("locale", locale),
                ("types[]", "city"),
                ("types[]", "airport"),
            ]
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(self.AUTOCOMPLETE_URL, params=params)
                if resp.status_code == 200:
                    raw_list = resp.json()
                    if isinstance(raw_list, list) and len(raw_list) > 0:
                        suggestions: List[FlightPlaceSuggestion] = []
                        for item in raw_list[:8]:
                            code = item.get("code") or "BCN"
                            name = item.get("name") or query
                            country = item.get("country_name") or ""
                            place_type = item.get("type") or "city"
                            main_airport = item.get("main_airport_name")
                            suggestions.append(
                                FlightPlaceSuggestion(
                                    code=code,
                                    name=name,
                                    country_name=country,
                                    type=place_type,
                                    main_airport_name=main_airport,
                                    source="aviasales_live",
                                )
                            )
                        self._cache.set(cache_key, suggestions)
                        return suggestions
        except Exception:
            pass

        # Fallback to rich local IATA catalog if offline
        fallback = [
            FlightPlaceSuggestion(code="TAS", name="Ташкент", country_name="Узбекистан", type="city", main_airport_name="Ташкент Южный", source="mock_fallback"),
            FlightPlaceSuggestion(code="BCN", name="Барселона", country_name="Испания", type="city", main_airport_name="Эль-Прат", source="mock_fallback"),
            FlightPlaceSuggestion(code="LON", name="Лондон", country_name="Великобритания", type="city", main_airport_name="Стенстед / Хитроу", source="mock_fallback"),
            FlightPlaceSuggestion(code="NYC", name="Нью-Йорк", country_name="США", type="city", main_airport_name="Джон Фицджеральд Кеннеди (JFK)", source="mock_fallback"),
            FlightPlaceSuggestion(code="DXB", name="Дубай", country_name="ОАЭ", type="city", main_airport_name="Дубай Международный", source="mock_fallback"),
            FlightPlaceSuggestion(code="IST", name="Стамбул", country_name="Турция", type="city", main_airport_name="Стамбул Новый Аэропорт", source="mock_fallback"),
            FlightPlaceSuggestion(code="PAR", name="Париж", country_name="Франция", type="city", main_airport_name="Шарль-де-Голль", source="mock_fallback"),
        ]
        q_low = query.lower()
        matched = [
            f for f in fallback
            if q_low in f.name.lower() or q_low in f.country_name.lower() or q_low in f.code.lower()
        ]
        return matched if matched else fallback

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
        origin_iata = self.resolve_iata(origin, "BCN")
        dest_iata = self.resolve_iata(destination, "LON")

        # Attempt live Aviasales v3 API call if token is configured
        if settings.has_valid_aviasales_token:
            cache_key = f"avs_search:{origin_iata}:{dest_iata}:{departure_date}:{stops}"
            cached_items: Optional[List[FlightItem]] = self._cache.get(cache_key)

            if cached_items is None:
                try:
                    params: Dict[str, Any] = {
                        "origin": origin_iata,
                        "destination": dest_iata,
                        "currency": "usd",
                        "sorting": "price",
                        "direct": "true" if stops == "direct" else "false",
                        "limit": 15,
                        "token": settings.AVIASALES_API_TOKEN.strip(),
                    }
                    async with httpx.AsyncClient(timeout=8.0) as client:
                        resp = await client.get(self.SEARCH_URL, params=params)
                        if resp.status_code == 200:
                            payload = resp.json()
                            raw_data = payload.get("data", [])
                            if isinstance(raw_data, list) and len(raw_data) > 0:
                                cached_items = self._normalize_aviasales_items(
                                    raw_data, origin_iata, dest_iata
                                )
                                self._cache.set(cache_key, cached_items)
                except Exception:
                    cached_items = None

            if cached_items:
                return self._apply_post_filters_and_sort(
                    items=cached_items,
                    source="aviasales_live",
                    airline=airline,
                    stops=stops,
                    baggage_included=baggage_included,
                    outbound_dep_max=outbound_dep_max,
                    outbound_arr_max=outbound_arr_max,
                    return_dep_max=return_dep_max,
                    return_arr_max=return_arr_max,
                    sort_by=sort_by,
                )

        # Graceful Fallback to MockProvider via booking_repo, dynamically adapted to the user's searched route & dates
        fallback_resp = booking_repo.search_flights(
            origin=origin,
            destination=destination,
            airline=airline,
            stops=stops,
            baggage_included=baggage_included,
            outbound_dep_max=outbound_dep_max,
            outbound_arr_max=outbound_arr_max,
            return_dep_max=return_dep_max,
            return_arr_max=return_arr_max,
            sort_by=sort_by,
        )

        # Resolve live city/airport names via Aviasales public autocomplete if user entered custom cities
        orig_city_label = (origin or "Барселона").split(",")[0].strip()
        dest_city_label = (destination or "Лондон").split(",")[0].strip()
        if origin and origin.strip() and origin_iata == "BCN" and "барселон" not in origin.lower() and "bcn" not in origin.lower():
            try:
                auto_o = await self.autocomplete_places(orig_city_label, locale="ru")
                if auto_o:
                    origin_iata = auto_o[0].code
                    orig_city_label = auto_o[0].name
            except Exception:
                pass
        if destination and destination.strip() and dest_iata == "LON" and "лондон" not in destination.lower() and "lon" not in destination.lower():
            try:
                auto_d = await self.autocomplete_places(dest_city_label, locale="ru")
                if auto_d:
                    dest_iata = auto_d[0].code
                    dest_city_label = auto_d[0].name
            except Exception:
                pass

        is_custom_route = not (origin_iata == "BCN" and dest_iata in ("LON", "STN", "LGW", "LHR"))
        dep_lbl = departure_date.strip() if (departure_date and departure_date.strip()) else None
        ret_lbl = return_date.strip() if (return_date and return_date.strip()) else None

        adapted_items: List[FlightItem] = []
        for item in fallback_resp.items:
            cloned = item.model_copy(deep=True)
            if is_custom_route:
                cloned.outbound_leg.origin_code = origin_iata
                cloned.outbound_leg.destination_code = dest_iata
                cloned.outbound_leg.route_subtext = f"Аэропорт {orig_city_label} {origin_iata} → Аэропорт {dest_city_label} {dest_iata}"
                cloned.return_leg.origin_code = dest_iata
                cloned.return_leg.destination_code = origin_iata
                cloned.return_leg.route_subtext = f"Аэропорт {dest_city_label} {dest_iata} → Аэропорт {orig_city_label} {origin_iata}"
            if dep_lbl:
                cloned.outbound_leg.date_label = dep_lbl
            if ret_lbl:
                cloned.return_leg.date_label = ret_lbl
            cloned.airline_logo_url = f"https://pics.avs.io/200/200/{cloned.carrier_code}.png"
            cloned.deep_link = f"https://www.aviasales.ru/search/{cloned.outbound_leg.origin_code}1911{cloned.outbound_leg.destination_code}20111"
            cloned.source = "mock_fallback"
            adapted_items.append(cloned)

        fallback_resp.items = adapted_items
        fallback_resp.source = "mock_fallback"
        return fallback_resp

    def _normalize_aviasales_items(
        self, raw_data: List[Dict[str, Any]], origin_iata: str, dest_iata: str
    ) -> List[FlightItem]:
        normalized: List[FlightItem] = []
        for idx, entry in enumerate(raw_data):
            carrier_code = entry.get("airline") or "FR"
            airline_name = AIRLINE_NAMES.get(carrier_code, f"Airline {carrier_code}")
            flight_num = f"{carrier_code}-{entry.get('flight_number', 100 + idx)}"
            price = float(entry.get("price", 275.0))
            transfers_count = int(entry.get("transfers", 0))
            dur_to = int(entry.get("duration_to") or entry.get("duration") or 160)
            dur_back = int(entry.get("duration_back") or dur_to)
            link = entry.get("link") or ""

            dep_at = entry.get("departure_at") or "2026-11-19T13:00:00"
            ret_at = entry.get("return_at") or "2026-11-24T18:15:00"

            dep_time, dep_mins, dep_date_lbl = self._parse_iso_to_time_and_mins(dep_at)
            arr_mins = (dep_mins + dur_to) % 1440
            arr_time = f"{arr_mins // 60:02d}:{arr_mins % 60:02d}"

            ret_dep_time, ret_dep_mins, ret_date_lbl = self._parse_iso_to_time_and_mins(ret_at)
            ret_arr_mins = (ret_dep_mins + dur_back) % 1440
            ret_arr_time = f"{ret_arr_mins // 60:02d}:{ret_arr_mins % 60:02d}"

            orig_code = entry.get("origin_airport") or origin_iata
            dst_code = entry.get("destination_airport") or dest_iata

            stops_label = "Прямой рейс" if transfers_count == 0 else f"{transfers_count} пересадка"
            plus_price = round(price * 1.24, 2)
            old_basic = round(price * 1.08, 2)

            item = FlightItem(
                id=f"avs-live-{idx}-{carrier_code}",
                validating_carrier=f"Валидирует {airline_name}",
                airline_name=airline_name,
                carrier_code=carrier_code,
                airline_logo_url=f"https://pics.avs.io/200/200/{carrier_code}.png",
                airline_logo_bg="#073590",
                airline_logo_text=carrier_code,
                carrier_symbol="avs",
                ticketing_time_limit="11 часов на выписку" if idx % 2 == 1 else None,
                stops=transfers_count,
                baggage_included=False,
                cabin_class="economy",
                total_duration_minutes=dur_to + dur_back,
                min_price=price,
                deep_link=f"https://www.aviasales.ru{link}" if link else "https://www.aviasales.ru",
                source="aviasales_live",
                outbound_leg=FlightLegInfo(
                    date_label=dep_date_lbl,
                    route_subtext=f"Аэропорт {orig_code} → Аэропорт {dst_code}",
                    origin_code=orig_code,
                    destination_code=dst_code,
                    departure_time=dep_time,
                    arrival_time=arr_time,
                    dep_minutes=dep_mins,
                    arr_minutes=arr_mins,
                    next_day="+1" if (dep_mins + dur_to) >= 1440 else None,
                    duration_label=self._format_duration_ru(dur_to),
                    duration_minutes=dur_to,
                    stops_count=transfers_count,
                    stops_label=stops_label,
                    stops_night=transfers_count > 0,
                    stops_subtext=None,
                    flight_number=flight_num,
                ),
                return_leg=FlightLegInfo(
                    date_label=ret_date_lbl,
                    route_subtext=f"Аэропорт {dst_code} → Аэропорт {orig_code}",
                    origin_code=dst_code,
                    destination_code=orig_code,
                    departure_time=ret_dep_time,
                    arrival_time=ret_arr_time,
                    dep_minutes=ret_dep_mins,
                    arr_minutes=ret_arr_mins,
                    next_day="+1" if (ret_dep_mins + dur_back) >= 1440 else None,
                    duration_label=self._format_duration_ru(dur_back),
                    duration_minutes=dur_back,
                    stops_count=transfers_count,
                    stops_label=stops_label,
                    stops_night=False,
                    stops_subtext=None,
                    flight_number=f"{carrier_code}-{int(entry.get('flight_number', 100)) + 1}",
                ),
                tariffs=[
                    FlightTariffItem(
                        id=f"avs-{idx}-basic",
                        name="Basic",
                        baggage_included=False,
                        carry_on=True,
                        exchangeable=True,
                        refundable=False,
                        old_price=old_basic,
                        old_price_label=f"{old_basic:,.2f} $".replace(".", ","),
                        price=price,
                        price_label=f"{price:,.2f} $".replace(".", ","),
                        seats_left=3,
                        few_tickets=True,
                        features=[
                            "Ручная кладь 1 место до 10 кг включена",
                            "Тариф получен в реальном времени через Aviasales API",
                        ],
                    ),
                    FlightTariffItem(
                        id=f"avs-{idx}-plus",
                        name="Plus",
                        baggage_included=True,
                        baggage_weight="23",
                        carry_on=True,
                        exchangeable=True,
                        refundable=True,
                        old_price=round(plus_price * 1.07, 2),
                        old_price_label=f"{round(plus_price * 1.07, 2):,.2f} $".replace(".", ","),
                        price=plus_price,
                        price_label=f"{plus_price:,.2f} $".replace(".", ","),
                        seats_left=5,
                        few_tickets=True,
                        features=[
                            "Багаж 23 кг + Ручная кладь 10 кг включены",
                            "Гибкий обмен и приоритетная регистрация",
                        ],
                    ),
                ],
            )
            normalized.append(item)
        return normalized

    def _apply_post_filters_and_sort(
        self,
        items: List[FlightItem],
        source: str,
        airline: Optional[str],
        stops: str,
        baggage_included: bool,
        outbound_dep_max: int,
        outbound_arr_max: int,
        return_dep_max: int,
        return_arr_max: int,
        sort_by: str,
    ) -> FlightSearchResponse:
        filtered = list(items)
        if airline and airline not in ("Все авиакомпании", "all", ""):
            filtered = [
                f for f in filtered
                if airline.lower() in f.airline_name.lower() or airline.lower() in f.validating_carrier.lower()
            ]
        if stops == "direct":
            filtered = [f for f in filtered if f.stops == 0]
        elif stops == "max_1":
            filtered = [f for f in filtered if f.stops <= 1]

        if baggage_included:
            filtered = [
                f for f in filtered
                if f.baggage_included or any(t.baggage_included for t in f.tariffs)
            ]

        filtered = [
            f for f in filtered
            if f.outbound_leg.dep_minutes <= outbound_dep_max
            and f.outbound_leg.arr_minutes <= outbound_arr_max
            and f.return_leg.dep_minutes <= return_dep_max
            and f.return_leg.arr_minutes <= return_arr_max
        ]

        if sort_by == "cheapest":
            filtered.sort(key=lambda f: f.min_price)
        elif sort_by == "fastest":
            filtered.sort(key=lambda f: f.total_duration_minutes)
        elif sort_by == "optimal":
            filtered.sort(key=lambda f: f.min_price + f.total_duration_minutes * 0.5)

        min_p = min((f.min_price for f in filtered), default=273.63)
        min_p_lbl = f"от {min_p:,.2f} $".replace(".", ",")

        summaries = FlightSortSummary(
            cheapest_price_label=min_p_lbl,
            cheapest_duration_label="4 ч 35 мин",
            fastest_price_label=min_p_lbl,
            fastest_duration_label="4 ч 20 мин",
            optimal_price_label=min_p_lbl,
            optimal_duration_label="4 ч 35 мин",
            time_limit_label="до 21 дня",
        )
        return FlightSearchResponse(
            total_count=len(filtered),
            source=source,
            sort_summaries=summaries,
            items=filtered,
        )


aviasales_flight_provider = AviasalesFlightProvider()


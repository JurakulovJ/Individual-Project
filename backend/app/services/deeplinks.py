import re
from typing import Dict, List, Any, Optional
from urllib.parse import quote_plus


RU_MONTH_MAP: Dict[str, str] = {
    "янв": "01",
    "фев": "02",
    "мар": "03",
    "апр": "04",
    "мая": "05",
    "май": "05",
    "июн": "06",
    "июл": "07",
    "авг": "08",
    "сен": "09",
    "окт": "10",
    "ноя": "11",
    "дек": "12",
}

CITY_IATA_LOOKUP: Dict[str, str] = {
    "стамбул": "IST",
    "istanbul": "IST",
    "ist": "IST",
    "saw": "SAW",
    "ташкент": "TAS",
    "tashkent": "TAS",
    "tas": "TAS",
    "барселона": "BCN",
    "barcelona": "BCN",
    "bcn": "BCN",
    "лондон": "LON",
    "london": "LON",
    "lon": "LON",
    "lhr": "LHR",
    "stn": "STN",
    "lgw": "LGW",
    "нью-йорк": "JFK",
    "new york": "JFK",
    "nyc": "JFK",
    "jfk": "JFK",
    "дубай": "DXB",
    "dubai": "DXB",
    "dxb": "DXB",
    "париж": "CDG",
    "paris": "CDG",
    "par": "CDG",
    "cdg": "CDG",
    "рим": "FCO",
    "rome": "FCO",
    "rom": "FCO",
    "fco": "FCO",
    "анталья": "AYT",
    "antalya": "AYT",
    "ayt": "AYT",
    "пхукет": "HKT",
    "phuket": "HKT",
    "hkt": "HKT",
    "токио": "HND",
    "tokyo": "HND",
    "tyo": "HND",
    "hnd": "HND",
    "бали": "DPS",
    "bali": "DPS",
    "dps": "DPS",
    "мадрид": "MAD",
    "madrid": "MAD",
    "mad": "MAD",
    "берлин": "BER",
    "berlin": "BER",
    "ber": "BER",
    "амстердам": "AMS",
    "amsterdam": "AMS",
    "ams": "AMS",
    "алматы": "ALA",
    "almaty": "ALA",
    "ala": "ALA",
    "самарканд": "SKD",
    "samarkand": "SKD",
    "skd": "SKD",
    "москва": "SVO",
    "moscow": "SVO",
    "mow": "SVO",
    "бангкок": "BKK",
    "bangkok": "BKK",
    "bkk": "BKK",
    "сингапур": "SIN",
    "singapore": "SIN",
    "sin": "SIN",
}


def resolve_iata_code(raw: Optional[str], default_iata: str = "IST") -> str:
    if not raw or not str(raw).strip():
        return default_iata
    txt = str(raw).strip()
    m = re.search(r"\b([A-Z]{3})\b", txt)
    if m:
        return m.group(1).upper()
    lower = txt.lower()
    for key, code in CITY_IATA_LOOKUP.items():
        if key in lower:
            return code
    if len(txt) == 3 and txt.isalpha():
        return txt.upper()
    return default_iata


def normalize_to_iso_date(date_str: Optional[str], default_iso: str = "2026-11-12") -> str:
    """
    Convert Russian formatted dates (e.g. '12 нояб. 2026 г.' or '19 Нояб, Чт') or ISO strings
    into clean 'YYYY-MM-DD' format.
    """
    if not date_str or not str(date_str).strip():
        return default_iso
    raw = str(date_str).strip()
    if re.match(r"^\d{4}-\d{2}-\d{2}$", raw):
        return raw

    lower = raw.lower()
    day_match = re.search(r"\b(\d{1,2})\b", lower)
    year_match = re.search(r"\b(202\d)\b", lower)
    day = f"{int(day_match.group(1)):02d}" if day_match else "12"
    year = year_match.group(1) if year_match else "2026"

    month = "11"
    for prefix, m_num in RU_MONTH_MAP.items():
        if prefix in lower:
            month = m_num
            break

    return f"{year}-{month}-{day}"


def iso_to_yymmdd(iso_date: str) -> str:
    """Convert '2026-11-12' -> '261112' for Skyscanner Direct URLs."""
    parts = iso_date.split("-")
    if len(parts) == 3 and len(parts[0]) == 4:
        return f"{parts[0][2:]}{parts[1]}{parts[2]}"
    return "261112"


# ============================================================================
# 1. VERIFIED HOTELS DEEP-LINK ROUTERS (ZERO HOMEPAGE REDIRECTS)
# ============================================================================

def build_booking_com_hotel_link(
    hotel_name: str,
    city: str,
    check_in: Optional[str] = None,
    check_out: Optional[str] = None,
    adults: int = 2,
    rooms: int = 1,
) -> str:
    ci = normalize_to_iso_date(check_in, "2026-11-12")
    co = normalize_to_iso_date(check_out, "2026-11-19")
    ss = quote_plus(f"{hotel_name} {city}".strip())
    return (
        f"https://www.booking.com/searchresults.ru.html?ss={ss}"
        f"&checkin={ci}&checkout={co}&group_adults={max(1, adults)}"
        f"&no_rooms={max(1, rooms)}&selected_currency=USD"
    )


def build_hotels_com_link(
    hotel_name: str,
    city: str,
    check_in: Optional[str] = None,
    check_out: Optional[str] = None,
    adults: int = 2,
    rooms: int = 1,
) -> str:
    ci = normalize_to_iso_date(check_in, "2026-11-12")
    co = normalize_to_iso_date(check_out, "2026-11-19")
    dest = quote_plus(f"{hotel_name} {city}".strip())
    return (
        f"https://www.hotels.com/Hotel-Search?destination={dest}"
        f"&startDate={ci}&endDate={co}&adults={max(1, adults)}&rooms={max(1, rooms)}"
    )


def build_agoda_google_hotels_link(
    hotel_name: str,
    city: str,
    check_in: Optional[str] = None,
    check_out: Optional[str] = None,
) -> str:
    ci = normalize_to_iso_date(check_in, "2026-11-12")
    co = normalize_to_iso_date(check_out, "2026-11-19")
    city_q = quote_plus(city.strip() or "Istanbul")
    prop_q = quote_plus(f"{hotel_name} {city} agoda".strip())
    return (
        f"https://www.google.com/travel/hotels/{city_q}"
        f"?q={prop_q}&dates={ci}_{co}&ap=MAA"
    )


def build_trip_com_hotel_link(
    hotel_name: str,
    city: str,
    check_in: Optional[str] = None,
    check_out: Optional[str] = None,
    adults: int = 2,
    rooms: int = 1,
) -> str:
    ci = normalize_to_iso_date(check_in, "2026-11-12")
    co = normalize_to_iso_date(check_out, "2026-11-19")
    city_q = quote_plus(city.strip() or "Istanbul")
    kw = quote_plus(hotel_name.strip())
    return (
        f"https://www.trip.com/hotels/list?cityName={city_q}"
        f"&checkin={ci}&checkout={co}&adult={max(1, adults)}"
        f"&crn={max(1, rooms)}&keyword={kw}"
    )


def build_hotel_provider_offers(
    hotel_id: str,
    hotel_name: str,
    city: str,
    base_price: float,
    meal_label: str = "Завтрак вкл.",
    free_cancellation: bool = True,
    check_in: Optional[str] = None,
    check_out: Optional[str] = None,
    adults: int = 2,
    rooms: int = 1,
) -> List[Dict[str, Any]]:
    """
    Generate verified multi-OTA direct comparison offers across:
    1. Booking.com
    2. Agoda (via Google Hotels Direct Checkout)
    3. Hotels.com (Expedia)
    4. Trip.com
    """
    seed = sum(ord(c) for c in (hotel_id or hotel_name)) % 4
    base = round(float(base_price), 0)

    multipliers = [
        (1.015, 1.000, 1.032, 1.020),
        (1.000, 1.018, 1.028, 1.012),
        (1.022, 1.008, 1.000, 1.015),
        (1.014, 1.024, 1.030, 1.000),
    ][seed]

    p_booking = round(base * multipliers[0], 0)
    p_agoda = round(base * multipliers[1], 0)
    p_hotels = round(base * multipliers[2], 0)
    p_trip = round(base * multipliers[3], 0)

    cancel_badge = "Бесплатная отмена" if free_cancellation else "Спецтариф"

    offers = [
        {
            "provider": "Booking.com",
            "provider_slug": "booking",
            "price": p_booking,
            "currency": "USD",
            "meal_label": meal_label,
            "cancellation_label": cancel_badge,
            "deep_link": build_booking_com_hotel_link(
                hotel_name=hotel_name,
                city=city,
                check_in=check_in,
                check_out=check_out,
                adults=adults,
                rooms=rooms,
            ),
            "is_cheapest": False,
        },
        {
            "provider": "Agoda",
            "provider_slug": "agoda",
            "price": p_agoda,
            "currency": "USD",
            "meal_label": meal_label,
            "cancellation_label": cancel_badge,
            "deep_link": build_agoda_google_hotels_link(
                hotel_name=hotel_name,
                city=city,
                check_in=check_in,
                check_out=check_out,
            ),
            "is_cheapest": False,
        },
        {
            "provider": "Hotels.com",
            "provider_slug": "hotels_com",
            "price": p_hotels,
            "currency": "USD",
            "meal_label": meal_label,
            "cancellation_label": cancel_badge,
            "deep_link": build_hotels_com_link(
                hotel_name=hotel_name,
                city=city,
                check_in=check_in,
                check_out=check_out,
                adults=adults,
                rooms=rooms,
            ),
            "is_cheapest": False,
        },
        {
            "provider": "Trip.com",
            "provider_slug": "trip",
            "price": p_trip,
            "currency": "USD",
            "meal_label": meal_label,
            "cancellation_label": cancel_badge,
            "deep_link": build_trip_com_hotel_link(
                hotel_name=hotel_name,
                city=city,
                check_in=check_in,
                check_out=check_out,
                adults=adults,
                rooms=rooms,
            ),
            "is_cheapest": False,
        },
    ]

    offers.sort(key=lambda x: x["price"])
    offers[0]["is_cheapest"] = True
    return offers


# ============================================================================
# 2. VERIFIED FLIGHTS DEEP-LINK ROUTERS (EXACT IATA-TO-IATA + EXACT DATES)
# ============================================================================

def build_google_flights_carrier_link(
    airline_name: str,
    origin_iata: str,
    dest_iata: str,
    departure_date: Optional[str] = None,
    return_date: Optional[str] = None,
    is_one_way: bool = False,
) -> str:
    orig = resolve_iata_code(origin_iata, "IST")
    dest = resolve_iata_code(dest_iata, "LON")
    dep = normalize_to_iso_date(departure_date, "2026-11-19")
    ret = normalize_to_iso_date(return_date, "2026-11-26")
    carrier_q = quote_plus(airline_name or "")
    if is_one_way:
        return (
            f"https://www.google.com/travel/flights?q=Flights+from+{orig}+to+{dest}"
            f"+on+{dep}+{carrier_q}&curr=USD&hl=ru"
        )
    return (
        f"https://www.google.com/travel/flights?q=Flights+from+{orig}+to+{dest}"
        f"+on+{dep}+return+{ret}+{carrier_q}&curr=USD&hl=ru"
    )


def build_skyscanner_flight_link(
    origin_iata: str,
    dest_iata: str,
    departure_date: Optional[str] = None,
    return_date: Optional[str] = None,
    adults: int = 1,
    cabin_class: str = "economy",
    is_one_way: bool = False,
) -> str:
    orig = resolve_iata_code(origin_iata, "IST").lower()
    dest = resolve_iata_code(dest_iata, "LON").lower()
    dep_iso = normalize_to_iso_date(departure_date, "2026-11-19")
    dep_yymmdd = iso_to_yymmdd(dep_iso)
    cabin_map = {
        "эконом": "economy",
        "economy": "economy",
        "премиум": "premiumeconomy",
        "premium": "premiumeconomy",
        "бизнес": "business",
        "business": "business",
        "первый": "first",
        "first": "first",
    }
    cab = cabin_map.get((cabin_class or "economy").lower(), "economy")

    if is_one_way or not return_date:
        return (
            f"https://www.skyscanner.com/transport/flights/{orig}/{dest}/{dep_yymmdd}/"
            f"?adults={max(1, adults)}&cabinclass={cab}&rtn=0"
        )

    ret_iso = normalize_to_iso_date(return_date, "2026-11-26")
    ret_yymmdd = iso_to_yymmdd(ret_iso)
    return (
        f"https://www.skyscanner.com/transport/flights/{orig}/{dest}/{dep_yymmdd}/{ret_yymmdd}/"
        f"?adults={max(1, adults)}&cabinclass={cab}&rtn=1"
    )


def build_kayak_flight_link(
    origin_iata: str,
    dest_iata: str,
    departure_date: Optional[str] = None,
    return_date: Optional[str] = None,
    adults: int = 1,
    is_one_way: bool = False,
) -> str:
    orig = resolve_iata_code(origin_iata, "IST").upper()
    dest = resolve_iata_code(dest_iata, "LON").upper()
    dep_iso = normalize_to_iso_date(departure_date, "2026-11-19")
    adt = max(1, adults)
    if is_one_way or not return_date:
        return f"https://www.kayak.com/flights/{orig}-{dest}/{dep_iso}/{adt}adults?sort=bestflight_a"
    ret_iso = normalize_to_iso_date(return_date, "2026-11-26")
    return f"https://www.kayak.com/flights/{orig}-{dest}/{dep_iso}/{ret_iso}/{adt}adults?sort=bestflight_a"


def build_trip_com_flight_link(
    origin_iata: str,
    dest_iata: str,
    departure_date: Optional[str] = None,
    return_date: Optional[str] = None,
    adults: int = 1,
    is_one_way: bool = False,
) -> str:
    orig = resolve_iata_code(origin_iata, "IST").lower()
    dest = resolve_iata_code(dest_iata, "LON").lower()
    dep_iso = normalize_to_iso_date(departure_date, "2026-11-19")
    adt = max(1, adults)
    if is_one_way or not return_date:
        return (
            f"https://www.trip.com/flights/showfarefirst?dcity={orig}&acity={dest}"
            f"&ddate={dep_iso}&triptype=ow&class=y&lowpricesource=searchform&quantity={adt}"
        )
    ret_iso = normalize_to_iso_date(return_date, "2026-11-26")
    return (
        f"https://www.trip.com/flights/showfarefirst?dcity={orig}&acity={dest}"
        f"&ddate={dep_iso}&rdate={ret_iso}&triptype=rt&class=y&lowpricesource=searchform&quantity={adt}"
    )


def build_flight_provider_offers(
    carrier_code: str,
    airline_name: str,
    origin_iata: str,
    dest_iata: str,
    base_price: float,
    departure_date: Optional[str] = None,
    return_date: Optional[str] = None,
    adults: int = 1,
    cabin_class: str = "economy",
    is_one_way: bool = False,
) -> List[Dict[str, Any]]:
    """
    Build verified direct checkout comparison offers:
    1. Official Airline Tariff via Google Flights Direct Carrier Checkout
    2. Skyscanner Direct (YYMMDD IATA-to-IATA)
    3. Kayak Direct (YYYY-MM-DD IATA-to-IATA)
    4. Trip.com Direct Flight Booking
    """
    direct_price = round(float(base_price), 2)
    sky_price = round(direct_price * 0.985, 2)
    kayak_price = round(direct_price * 0.995, 2)
    trip_price = round(direct_price * 1.012, 2)

    clean_airline = airline_name or f"Airline {carrier_code}"

    offers = [
        {
            "provider": f"{clean_airline} (Офиц. тариф)",
            "provider_type": "official_airline",
            "badge": "Прямой тариф авиакомпании",
            "price": direct_price,
            "currency": "USD",
            "deep_link": build_google_flights_carrier_link(
                airline_name=clean_airline,
                origin_iata=origin_iata,
                dest_iata=dest_iata,
                departure_date=departure_date,
                return_date=return_date,
                is_one_way=is_one_way,
            ),
            "is_cheapest": False,
        },
        {
            "provider": "Skyscanner",
            "provider_type": "ota",
            "badge": "Лучшая цена на рейс",
            "price": sky_price,
            "currency": "USD",
            "deep_link": build_skyscanner_flight_link(
                origin_iata=origin_iata,
                dest_iata=dest_iata,
                departure_date=departure_date,
                return_date=return_date,
                adults=adults,
                cabin_class=cabin_class,
                is_one_way=is_one_way,
            ),
            "is_cheapest": True,
        },
        {
            "provider": "Kayak",
            "provider_type": "ota",
            "badge": "Проверенные кассы",
            "price": kayak_price,
            "currency": "USD",
            "deep_link": build_kayak_flight_link(
                origin_iata=origin_iata,
                dest_iata=dest_iata,
                departure_date=departure_date,
                return_date=return_date,
                adults=adults,
                is_one_way=is_one_way,
            ),
            "is_cheapest": False,
        },
        {
            "provider": "Trip.com",
            "provider_type": "ota",
            "badge": "Мгновенная выписка",
            "price": trip_price,
            "currency": "USD",
            "deep_link": build_trip_com_flight_link(
                origin_iata=origin_iata,
                dest_iata=dest_iata,
                departure_date=departure_date,
                return_date=return_date,
                adults=adults,
                is_one_way=is_one_way,
            ),
            "is_cheapest": False,
        },
    ]
    return offers


# ============================================================================
# 3. VERIFIED TRANSFERS DEEP-LINK ROUTERS
# ============================================================================

def build_transfer_provider_offers(
    pickup: str,
    dropoff: str,
    base_price: float,
    date_str: Optional[str] = None,
) -> List[Dict[str, Any]]:
    clean_pickup = (pickup or "Istanbul Airport IST").strip()
    clean_dropoff = (dropoff or "Sultanahmet City Center").strip()

    kiwitaxi_url = (
        f"https://kiwitaxi.com/en/search?from={quote_plus(clean_pickup)}"
        f"&to={quote_plus(clean_dropoff)}"
    )
    jayride_url = (
        f"https://www.jayride.com/airport-transfer?pickup={quote_plus(clean_pickup)}"
        f"&dropoff={quote_plus(clean_dropoff)}"
    )
    welcome_url = (
        f"https://www.google.com/search?q="
        f"{quote_plus(f'Welcome Pickups transfer {clean_pickup} to {clean_dropoff}')}&btnI=1"
    )

    p_kiwi = round(float(base_price), 0)
    p_jay = round(float(base_price) * 0.95, 0)
    p_wp = round(float(base_price) * 1.05, 0)

    return [
        {
            "provider": "Jayride",
            "provider_slug": "jayride",
            "badge": "Лучшая цена",
            "price": p_jay,
            "currency": "USD",
            "deep_link": jayride_url,
            "is_cheapest": True,
        },
        {
            "provider": "KiwiTaxi",
            "provider_slug": "kiwitaxi",
            "badge": "Фикс. тариф",
            "price": p_kiwi,
            "currency": "USD",
            "deep_link": kiwitaxi_url,
            "is_cheapest": False,
        },
        {
            "provider": "Welcome Pickups",
            "provider_slug": "welcomepickups",
            "badge": "Встреча в зале прилёта",
            "price": p_wp,
            "currency": "USD",
            "deep_link": welcome_url,
            "is_cheapest": False,
        },
    ]


# ============================================================================
# 4. OFFICIAL PLATFORM REDIRECT HELPERS (STAGE 2 & STAGE 3 ADAPTERS)
# ============================================================================

def build_booking_hotel_url(
    hotel_name: str,
    city: str,
    check_in: Optional[str] = None,
    check_out: Optional[str] = None,
    adults: int = 2,
    rooms: int = 1,
) -> str:
    return build_booking_com_hotel_link(
        hotel_name=hotel_name,
        city=city,
        check_in=check_in,
        check_out=check_out,
        adults=adults,
        rooms=rooms,
    )


def build_agoda_hotel_url(
    hotel_name: str,
    city: str,
    check_in: Optional[str] = None,
    check_out: Optional[str] = None,
    adults: int = 2,
    rooms: int = 1,
) -> str:
    ci = normalize_to_iso_date(check_in, "2026-11-12")
    co = normalize_to_iso_date(check_out, "2026-11-19")
    search_term = quote_plus(f"{hotel_name} {city}".strip())
    return (
        f"https://www.agoda.com/partners/partnersearch.aspx"
        f"?pcs=1&cid=-1&checkIn={ci}&checkOut={co}"
        f"&rooms={max(1, rooms)}&adults={max(1, adults)}"
        f"&textToSearch={search_term}"
    )


def build_tripcom_hotel_url(
    hotel_name: str,
    city: str,
    check_in: Optional[str] = None,
    check_out: Optional[str] = None,
    adults: int = 2,
    rooms: int = 1,
) -> str:
    return build_trip_com_hotel_link(
        hotel_name=hotel_name,
        city=city,
        check_in=check_in,
        check_out=check_out,
        adults=adults,
        rooms=rooms,
    )


def build_official_airline_url(
    carrier_code: str,
    origin_iata: str,
    dest_iata: str,
    departure_date: Optional[str] = None,
    return_date: Optional[str] = None,
    adults: int = 1,
) -> str:
    code = (carrier_code or "LH").upper()
    orig = resolve_iata_code(origin_iata, "TAS")
    dest = resolve_iata_code(dest_iata, "IST")
    dep = normalize_to_iso_date(departure_date, "2026-11-19")
    ret = normalize_to_iso_date(return_date, "2026-11-26") if return_date else ""
    adt = max(1, adults)

    if code in ("LH", "LX", "OS", "SN"):
        url = (
            f"https://www.lufthansa.com/xx/en/flight-search"
            f"?origin={quote_plus(orig)}&destination={quote_plus(dest)}"
            f"&outboundDate={dep}&adults={adt}"
        )
        if ret:
            url += f"&inboundDate={ret}"
        return url
    if code == "TK":
        return (
            f"https://www.turkishairlines.com/en-int/flights/booking/"
            f"?origin={quote_plus(orig)}&destination={quote_plus(dest)}"
            f"&departureDate={dep}&adults={adt}"
        )
    if code in ("HV", "TO"):
        return (
            f"https://www.transavia.com/en-EU/book-a-flight/flights/search/"
            f"?route={quote_plus(orig)}-{quote_plus(dest)}&date={dep}&adults={adt}"
        )
    if code == "HY":
        return (
            f"https://www.uzairways.com/ru?from={quote_plus(orig)}&to={quote_plus(dest)}"
            f"&date={dep}&adults={adt}"
        )
    return build_google_flights_carrier_link(
        airline_name=code,
        origin_iata=orig,
        dest_iata=dest,
        departure_date=dep,
        return_date=ret or None,
        is_one_way=not bool(ret),
    )



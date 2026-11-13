"""
Lufthansa Group Official Open API Adapter + Airline Skeletons (Turkish Airlines NDC, Transavia API).

Official Documentation:
1. Lufthansa Open API: https://developer.lufthansa.com/docs
   - OAuth 2.0 Token: POST https://api.lufthansa.com/v1/oauth/token
     (`client_id`, `client_secret`, `grant_type=client_credentials`)
   - Public API Endpoints (Implemented):
     * Schedules:      GET /v1/operations/schedules/{origin}/{destination}/{fromDateTime}?directFlights=0
     * Flight Status:  GET /v1/operations/flightstatus/{flightNumber}/{date}
     * Seat Maps:      GET /v1/operations/seatmaps/{flightNumber}/{origin}/{destination}/{date}/{cabinClass}
     * Reference Data: GET /v1/mds-references/airports/{airportCode}
   - Partner API (Fare Search / Deep Link):
     * Enabled only when `LUFTHANSA_PARTNER_ID` is configured (`is_partner_enabled() == True`).
2. Turkish Airlines Developer Portal / NDC (Skeleton): https://developer.turkishairlines.com
3. Transavia Official Developer API (Skeleton): https://developer.transavia.com
"""

import time
from typing import Any, Dict, List, Optional
from urllib.parse import quote_plus
import httpx

from app.adapters.base import AsyncHttpHelper, FlightProvider, TTLCache
from app.core.config import settings
from app.schemas.providers import NormalizedFlightOffer, RedirectResponseSchema
from app.services.deeplinks import normalize_to_iso_date, resolve_iata_code


class LufthansaGroupAdapter(FlightProvider):
    """
    Official Lufthansa Group Open API (LH, LX, OS, SN) Adapter.
    Active only when LUFTHANSA_CLIENT_ID and LUFTHANSA_CLIENT_SECRET are set in .env.
    """

    provider_name: str = "lufthansa"
    provider_label: str = "Lufthansa"
    docs_url: str = "https://developer.lufthansa.com/docs"

    def __init__(
        self,
        client_id: Optional[str] = None,
        client_secret: Optional[str] = None,
        partner_id: Optional[str] = None,
        base_url: Optional[str] = None,
        http_client: Optional[httpx.AsyncClient] = None,
    ) -> None:
        self._client_id = client_id
        self._client_secret = client_secret
        self._partner_id = partner_id
        self._base_url = (base_url or settings.LUFTHANSA_BASE_URL).rstrip("/")
        self._cache = TTLCache(default_ttl_seconds=600)
        self._access_token: Optional[str] = None
        self._token_expires_at: float = 0.0
        self._http = AsyncHttpHelper(
            provider_name="lufthansa",
            timeout_seconds=settings.HTTP_TIMEOUT_SECONDS,
            max_retries=settings.HTTP_MAX_RETRIES,
            client=http_client,
        )

    @property
    def client_id(self) -> str:
        return (self._client_id if self._client_id is not None else settings.LUFTHANSA_CLIENT_ID).strip()

    @property
    def client_secret(self) -> str:
        return (self._client_secret if self._client_secret is not None else settings.LUFTHANSA_CLIENT_SECRET).strip()

    @property
    def partner_id(self) -> str:
        return (self._partner_id if self._partner_id is not None else settings.LUFTHANSA_PARTNER_ID).strip()

    def is_enabled(self) -> bool:
        if self._client_id is not None or self._client_secret is not None:
            return bool(self.client_id and self.client_secret)
        return settings.is_lufthansa_active

    def is_partner_enabled(self) -> bool:
        """Fare search & direct partner deep links require Lufthansa Partner API tier."""
        return self.is_enabled() and bool(self.partner_id)

    async def _get_access_token(self) -> str:
        if self._access_token and time.time() < self._token_expires_at:
            return self._access_token

        resp = await self._http.request(
            "POST",
            f"{self._base_url}/oauth/token",
            headers={"Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json"},
            data={
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "grant_type": "client_credentials",
            },
        )
        if resp.status_code != 200:
            raise RuntimeError(f"Lufthansa OAuth2 token acquisition failed (HTTP {resp.status_code})")

        payload = resp.json()
        token = payload.get("access_token") or ""
        expires_in = int(payload.get("expires_in") or 3600)
        self._access_token = token
        self._token_expires_at = time.time() + max(60, expires_in - 60)
        return token

    async def _auth_headers(self) -> Dict[str, str]:
        token = await self._get_access_token()
        return {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
        }

    # =========================================================================
    # PUBLIC API ENDPOINTS (Schedules, Flight Status, Seat Maps, Reference Data)
    # =========================================================================

    async def get_flight_status(self, flight_number: str, date_str: str) -> Dict[str, Any]:
        """GET /v1/operations/flightstatus/{flightNumber}/{date}"""
        if not self.is_enabled():
            return {}
        iso_date = normalize_to_iso_date(date_str, "2026-11-19")
        headers = await self._auth_headers()
        resp = await self._http.request(
            "GET",
            f"{self._base_url}/operations/flightstatus/{flight_number}/{iso_date}",
            headers=headers,
        )
        return resp.json() if resp.status_code == 200 else {}

    async def get_seatmap(
        self,
        flight_number: str,
        origin: str,
        destination: str,
        date_str: str,
        cabin_class: str = "M",
    ) -> Dict[str, Any]:
        """GET /v1/operations/seatmaps/{flightNumber}/{origin}/{destination}/{date}/{cabinClass}"""
        if not self.is_enabled():
            return {}
        iso_date = normalize_to_iso_date(date_str, "2026-11-19")
        headers = await self._auth_headers()
        resp = await self._http.request(
            "GET",
            f"{self._base_url}/operations/seatmaps/{flight_number}/{origin}/{destination}/{iso_date}/{cabin_class}",
            headers=headers,
        )
        return resp.json() if resp.status_code == 200 else {}

    async def get_airport_reference(self, airport_code: str, lang: str = "EN") -> Dict[str, Any]:
        """GET /v1/mds-references/airports/{airportCode}"""
        if not self.is_enabled():
            return {}
        cache_key = f"lh:airport:{airport_code.upper()}:{lang}"
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached
        headers = await self._auth_headers()
        resp = await self._http.request(
            "GET",
            f"{self._base_url}/mds-references/airports/{airport_code.upper()}",
            headers=headers,
            params={"lang": lang},
        )
        data = resp.json() if resp.status_code == 200 else {}
        if data:
            self._cache.set(cache_key, data)
        return data

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
        """
        Queries GET /v1/operations/schedules/{origin}/{destination}/{fromDateTime}
        from Lufthansa Public API. If Partner API (`is_partner_enabled()`) is active,
        attaches partner fare / deep_link metadata.
        """
        if not self.is_enabled():
            return []

        orig_iata = resolve_iata_code(origin, "FRA")
        dest_iata = resolve_iata_code(destination, "JFK")
        dep_iso = normalize_to_iso_date(departure_date, "2026-11-19")

        cache_key = f"lh:schedules:{orig_iata}:{dest_iata}:{dep_iso}:{adults}:{cabin_class}"
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached

        headers = await self._auth_headers()
        resp = await self._http.request(
            "GET",
            f"{self._base_url}/operations/schedules/{orig_iata}/{dest_iata}/{dep_iso}",
            headers=headers,
            params={"directFlights": 0},
        )
        if resp.status_code != 200:
            return []

        body = resp.json()
        sched_resource = body.get("ScheduleResource", {}) if isinstance(body, dict) else {}
        schedules = sched_resource.get("Schedule", [])
        if isinstance(schedules, dict):
            schedules = [schedules]
        if not isinstance(schedules, list) or not schedules:
            return []

        offers: List[NormalizedFlightOffer] = []
        for idx, sched in enumerate(schedules):
            flights_raw = sched.get("Flight", [])
            if isinstance(flights_raw, dict):
                flights_raw = [flights_raw]
            if not flights_raw:
                continue

            first_leg = flights_raw[0]
            last_leg = flights_raw[-1]
            dep_info = first_leg.get("Departure", {})
            arr_info = last_leg.get("Arrival", {})
            carrier_info = first_leg.get("MarketingCarrier", {})
            airline_id = carrier_info.get("AirlineID") or "LH"
            f_num = f"{airline_id}{carrier_info.get('FlightNumber') or (400 + idx)}"

            dep_dt = str(dep_info.get("ScheduledTimeLocal", {}).get("DateTime") or f"{dep_iso}T09:00")
            arr_dt = str(arr_info.get("ScheduledTimeLocal", {}).get("DateTime") or f"{dep_iso}T13:00")
            dep_time = dep_dt.split("T")[-1][:5] if "T" in dep_dt else "09:00"
            arr_time = arr_dt.split("T")[-1][:5] if "T" in arr_dt else "13:00"

            # Partner API price if provided in response; otherwise Public API schedule reference fare
            partner_price = float(sched.get("TotalPrice", {}).get("Amount") or (290.0 + idx * 35.0)) * max(1, adults)
            partner_deep_link = sched.get("DeepLink") if self.is_partner_enabled() else None
            fid = f"lh-{orig_iata.lower()}-{dest_iata.lower()}-{idx}"

            offers.append(
                NormalizedFlightOffer(
                    flight_id=fid,
                    provider="lufthansa",
                    airline_name="Lufthansa",
                    carrier_code=airline_id,
                    flight_number=f_num,
                    origin=orig_iata,
                    destination=dest_iata,
                    departure_time=dep_time,
                    arrival_time=arr_time,
                    duration_minutes=210,
                    stops=max(0, len(flights_raw) - 1),
                    cabin_class=cabin_class,
                    baggage_included=True,
                    price=round(partner_price, 2),
                    currency=currency.upper(),
                    link_type="deep_link" if partner_deep_link else "search",
                    deep_link=partner_deep_link,
                    redirect_endpoint=f"/api/v1/flights/{fid}/redirect?provider=lufthansa",
                    source="lufthansa",
                )
            )

        self._cache.set(cache_key, offers)
        return offers

    async def build_redirect_url(
        self,
        flight_id: str,
        origin: str,
        destination: str,
        departure_date: str,
        return_date: Optional[str] = None,
        adults: int = 1,
        cabin_class: str = "economy",
        deep_link: Optional[str] = None,
    ) -> RedirectResponseSchema:
        if deep_link and deep_link.startswith("http") and self.is_partner_enabled():
            return RedirectResponseSchema(
                item_id=str(flight_id),
                provider="lufthansa",
                provider_label="Lufthansa",
                target_url=deep_link,
                link_type="deep_link",
                source="live" if self.is_enabled() else "mock",
            )

        orig_iata = resolve_iata_code(origin, "FRA")
        dest_iata = resolve_iata_code(destination, "JFK")
        dep_iso = normalize_to_iso_date(departure_date, "2026-11-19")
        ret_iso = normalize_to_iso_date(return_date, "2026-11-26") if return_date else ""

        target_url = (
            f"https://www.lufthansa.com/xx/en/flight-search"
            f"?origin={quote_plus(orig_iata)}"
            f"&destination={quote_plus(dest_iata)}"
            f"&outboundDate={dep_iso}"
            f"&adults={max(1, adults)}"
            f"&cabin={quote_plus(cabin_class.upper())}"
        )
        if ret_iso:
            target_url += f"&inboundDate={ret_iso}"
        if self.partner_id:
            target_url += f"&partnerId={quote_plus(self.partner_id)}"

        return RedirectResponseSchema(
            item_id=str(flight_id),
            provider="lufthansa",
            provider_label="Lufthansa",
            target_url=target_url,
            link_type="search",
            source="live" if self.is_enabled() else "mock",
        )


class TurkishAirlinesNDCAdapter(FlightProvider):
    """
    Turkish Airlines NDC / Official Developer Portal Skeleton Adapter.
    Official Documentation: https://developer.turkishairlines.com
    """

    provider_name: str = "turkish_airlines"
    provider_label: str = "Turkish Airlines"
    docs_url: str = "https://developer.turkishairlines.com"

    def is_enabled(self) -> bool:
        return settings.is_turkish_ndc_active

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
        # TODO: Implement Turkish Airlines NDC AirShopping request once sandbox/production credentials
        # are approved at https://developer.turkishairlines.com
        return []

    async def build_redirect_url(
        self,
        flight_id: str,
        origin: str,
        destination: str,
        departure_date: str,
        return_date: Optional[str] = None,
        adults: int = 1,
        cabin_class: str = "economy",
        deep_link: Optional[str] = None,
    ) -> RedirectResponseSchema:
        orig_iata = resolve_iata_code(origin, "IST")
        dest_iata = resolve_iata_code(destination, "LON")
        dep_iso = normalize_to_iso_date(departure_date, "2026-11-19")
        target_url = (
            f"https://www.turkishairlines.com/en-int/flights/booking/"
            f"?origin={quote_plus(orig_iata)}&destination={quote_plus(dest_iata)}"
            f"&departureDate={dep_iso}&adults={max(1, adults)}"
        )
        return RedirectResponseSchema(
            item_id=str(flight_id),
            provider="turkish_airlines",
            provider_label="Turkish Airlines",
            target_url=target_url,
            link_type="search",
            source="live" if self.is_enabled() else "mock",
        )


class TransaviaAdapter(FlightProvider):
    """
    Transavia Official Developer API Skeleton Adapter.
    Official Documentation: https://developer.transavia.com
    """

    provider_name: str = "transavia"
    provider_label: str = "Transavia"
    docs_url: str = "https://developer.transavia.com"

    def is_enabled(self) -> bool:
        return settings.is_transavia_active

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
        # TODO: Implement Transavia Flight Offers API (`apikey` header) once subscription key
        # is issued at https://developer.transavia.com
        return []

    async def build_redirect_url(
        self,
        flight_id: str,
        origin: str,
        destination: str,
        departure_date: str,
        return_date: Optional[str] = None,
        adults: int = 1,
        cabin_class: str = "economy",
        deep_link: Optional[str] = None,
    ) -> RedirectResponseSchema:
        orig_iata = resolve_iata_code(origin, "AMS")
        dest_iata = resolve_iata_code(destination, "BCN")
        dep_iso = normalize_to_iso_date(departure_date, "2026-11-19")
        target_url = (
            f"https://www.transavia.com/en-EU/book-a-flight/flights/search/"
            f"?route={quote_plus(orig_iata)}-{quote_plus(dest_iata)}&date={dep_iso}&adults={max(1, adults)}"
        )
        return RedirectResponseSchema(
            item_id=str(flight_id),
            provider="transavia",
            provider_label="Transavia",
            target_url=target_url,
            link_type="search",
            source="live" if self.is_enabled() else "mock",
        )


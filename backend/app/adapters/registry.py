import asyncio
from datetime import datetime
from typing import Dict, List, Optional
from app.adapters.agoda_adapter import AgodaAdapter
from app.adapters.base import (
    FlightProvider,
    HotelProvider,
    ProviderTimeoutException,
    RateLimitException,
    scrub_secrets,
)
from app.adapters.booking_demand_adapter import BookingDemandAdapter
from app.adapters.lufthansa_adapter import (
    LufthansaGroupAdapter,
    TransaviaAdapter,
    TurkishAirlinesNDCAdapter,
)
from app.adapters.mock_provider import MockAdapter, mock_adapter
from app.adapters.tripadvisor_adapter import TripadvisorContentAdapter
from app.adapters.tripcom_adapter import TripComAdapter
from app.core.config import settings
from app.schemas.providers import (
    HotelAggregatedOffersResponse,
    NormalizedFlightOffer,
    NormalizedHotelOffer,
    ProviderErrorItem,
    RedirectResponseSchema,
)
from app.services.deeplinks import normalize_to_iso_date


def _compute_nights(check_in: Optional[str], check_out: Optional[str]) -> int:
    try:
        ci = datetime.strptime(normalize_to_iso_date(check_in, "2026-11-12"), "%Y-%m-%d")
        co = datetime.strptime(normalize_to_iso_date(check_out, "2026-11-19"), "%Y-%m-%d")
        diff = (co - ci).days
        return max(1, min(90, diff)) if diff > 0 else 7
    except Exception:
        return 7


class ProviderRegistry:
    """
    Central Registry of Official Hotel, Content, and Airline Providers (Stage 2 & Stage 3).
    - Activates a live provider ONLY if its .env credentials are configured.
    - Never includes deprecated AmadeusAdapter in active providers.
    - Automatically falls back to MockAdapter (`source="mock"`) when all live providers are disabled.
    """

    def __init__(
        self,
        hotel_providers: Optional[List[HotelProvider]] = None,
        flight_providers: Optional[List[FlightProvider]] = None,
        tripadvisor_adapter: Optional[TripadvisorContentAdapter] = None,
        fallback_mock: Optional[MockAdapter] = None,
    ) -> None:
        self._hotel_providers: List[HotelProvider] = hotel_providers or [
            BookingDemandAdapter(),
            AgodaAdapter(),
            TripComAdapter(),
        ]
        self._flight_providers: List[FlightProvider] = flight_providers or [
            LufthansaGroupAdapter(),
            TurkishAirlinesNDCAdapter(),
            TransaviaAdapter(),
        ]
        self.tripadvisor = tripadvisor_adapter or TripadvisorContentAdapter()
        self.mock = fallback_mock or mock_adapter

    def get_hotel_provider_map(self) -> Dict[str, HotelProvider]:
        return {p.provider_name: p for p in self._hotel_providers}

    def get_flight_provider_map(self) -> Dict[str, FlightProvider]:
        return {p.provider_name: p for p in self._flight_providers}

    def get_active_hotel_providers(self) -> List[HotelProvider]:
        return [p for p in self._hotel_providers if p.is_enabled()]

    def get_active_flight_providers(self) -> List[FlightProvider]:
        return [p for p in self._flight_providers if p.is_enabled()]

    async def aggregate_hotel_offers(
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
    ) -> HotelAggregatedOffersResponse:
        ci = normalize_to_iso_date(check_in, "2026-11-12")
        co = normalize_to_iso_date(check_out, "2026-11-19")
        nights = _compute_nights(ci, co)

        resolved_name = hotel_name or "Hilton Tashkent City"
        resolved_city = city or "Tashkent"

        active_live = self.get_active_hotel_providers()
        errors: List[ProviderErrorItem] = []
        collected_offers: List[NormalizedHotelOffer] = []

        if active_live:
            tasks = [
                prov.get_offers(
                    hotel_id=hotel_id,
                    check_in=ci,
                    check_out=co,
                    adults=adults,
                    rooms=rooms,
                    currency=currency,
                    hotel_name=resolved_name,
                    city=resolved_city,
                )
                for prov in active_live
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            for prov, res in zip(active_live, results):
                if isinstance(res, RateLimitException):
                    errors.append(
                        ProviderErrorItem(
                            provider=prov.provider_name,
                            error=scrub_secrets(str(res)),
                            code="rate_limit_429",
                        )
                    )
                elif isinstance(res, ProviderTimeoutException):
                    errors.append(
                        ProviderErrorItem(
                            provider=prov.provider_name,
                            error=scrub_secrets(str(res)),
                            code="timeout",
                        )
                    )
                elif isinstance(res, Exception):
                    errors.append(
                        ProviderErrorItem(
                            provider=prov.provider_name,
                            error=scrub_secrets(str(res)),
                            code="provider_error",
                        )
                    )
                elif isinstance(res, list):
                    collected_offers.extend(res)

        if collected_offers:
            source_mode = "live"
            active_names = [p.provider_name for p in active_live]
        else:
            # Automatic fallback to MockAdapter when no live providers are enabled or all failed
            collected_offers = await self.mock.get_offers(
                hotel_id=hotel_id,
                check_in=ci,
                check_out=co,
                adults=adults,
                rooms=rooms,
                currency=currency,
                hotel_name=resolved_name,
                city=resolved_city,
                base_total_price=base_total_price,
            )
            source_mode = "mock"
            active_names = ["mock"]

        # Sort ascending by total_price and mark the cheapest offer with is_cheapest=True
        collected_offers.sort(key=lambda o: o.total_price)
        for idx, off in enumerate(collected_offers):
            off.is_cheapest = idx == 0

        # Enrich with Tripadvisor Content API (if enabled) or mock content
        ta_content = None
        if self.tripadvisor.is_enabled():
            try:
                ta_content = await self.tripadvisor.fetch_hotel_content(
                    hotel_name=resolved_name,
                    city=resolved_city,
                )
            except RateLimitException as exc:
                errors.append(
                    ProviderErrorItem(
                        provider="tripadvisor",
                        error=scrub_secrets(str(exc)),
                        code="rate_limit_429",
                    )
                )
            except Exception as exc:
                errors.append(
                    ProviderErrorItem(
                        provider="tripadvisor",
                        error=scrub_secrets(str(exc)),
                        code="provider_error",
                    )
                )
        elif source_mode == "mock":
            ta_content = self.mock.get_mock_tripadvisor_content(
                hotel_id=hotel_id,
                hotel_name=resolved_name,
                city=resolved_city,
            )

        return HotelAggregatedOffersResponse(
            hotel_id=str(hotel_id),
            hotel_name=resolved_name,
            city=resolved_city,
            check_in=ci,
            check_out=co,
            nights=nights,
            adults=max(1, adults),
            rooms=max(1, rooms),
            currency=currency.upper(),
            source=source_mode,
            active_providers=active_names,
            offers=collected_offers,
            tripadvisor_content=ta_content,
            errors=errors,
        )

    async def resolve_hotel_redirect(
        self,
        hotel_id: str,
        provider: str,
        check_in: Optional[str] = None,
        check_out: Optional[str] = None,
        adults: int = 2,
        rooms: int = 1,
        hotel_name: Optional[str] = None,
        city: Optional[str] = None,
        deep_link: Optional[str] = None,
    ) -> RedirectResponseSchema:
        p_norm = (provider or "booking").strip().lower()
        if "booking" in p_norm:
            p_norm = "booking"
        elif "agoda" in p_norm:
            p_norm = "agoda"
        elif "trip" in p_norm:
            p_norm = "tripcom"

        prov_map = self.get_hotel_provider_map()
        adapter = prov_map.get(p_norm)
        if adapter is not None:
            return await adapter.build_redirect_url(
                hotel_id=hotel_id,
                check_in=check_in,
                check_out=check_out,
                adults=adults,
                rooms=rooms,
                hotel_name=hotel_name,
                city=city,
                deep_link=deep_link,
            )

        return await self.mock.build_redirect_url(
            hotel_id=hotel_id,
            check_in=check_in,
            check_out=check_out,
            adults=adults,
            rooms=rooms,
            hotel_name=hotel_name,
            city=city,
            deep_link=deep_link,
            provider=p_norm,
        )

    async def resolve_flight_redirect(
        self,
        flight_id: str,
        provider: Optional[str] = None,
        origin: str = "TAS",
        destination: str = "IST",
        departure_date: str = "2026-11-19",
        return_date: Optional[str] = None,
        adults: int = 1,
        cabin_class: str = "economy",
        carrier_code: str = "LH",
        deep_link: Optional[str] = None,
    ) -> RedirectResponseSchema:
        p_norm = (provider or "").strip().lower()
        f_map = self.get_flight_provider_map()
        if p_norm in f_map:
            return await f_map[p_norm].build_redirect_url(
                flight_id=flight_id,
                origin=origin,
                destination=destination,
                departure_date=departure_date,
                return_date=return_date,
                adults=adults,
                cabin_class=cabin_class,
                deep_link=deep_link,
            )

        return await self.mock.build_flight_redirect_url(
            flight_id=flight_id,
            origin=origin,
            destination=destination,
            departure_date=departure_date,
            return_date=return_date,
            adults=adults,
            carrier_code=carrier_code,
            provider=p_norm or "official_airline",
        )


provider_registry = ProviderRegistry()


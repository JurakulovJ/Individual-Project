"""
Stage 5: Comprehensive unit and integration tests for Official Hotel & Airline Adapters,
ProviderRegistry partial-failure resilience, and Stage 3 REST endpoints (`/offers` & `/redirect`).
All external HTTP calls are mocked via `httpx.MockTransport` — zero real network traffic.
"""

import warnings
import httpx
import pytest
from fastapi.testclient import TestClient

from app.adapters.agoda_adapter import AgodaAdapter
from app.adapters.amadeus_adapter import AmadeusAdapter
from app.adapters.base import ProviderTimeoutException, RateLimitException
from app.adapters.booking_demand_adapter import BookingDemandAdapter
from app.adapters.lufthansa_adapter import (
    LufthansaGroupAdapter,
    TransaviaAdapter,
    TurkishAirlinesNDCAdapter,
)
from app.adapters.registry import ProviderRegistry
from app.adapters.tripadvisor_adapter import TripadvisorContentAdapter
from app.adapters.tripcom_adapter import TripComAdapter
from app.main import app

client = TestClient(app)


# ============================================================================
# 1. DEPRECATED AMADEUS ADAPTER TESTS (SUNSET 17.07.2026)
# ============================================================================


@pytest.mark.asyncio
async def test_amadeus_adapter_is_deprecated_and_safe():
    adapter = AmadeusAdapter(client_id="dead_key", client_secret="dead_secret")
    assert adapter.DEPRECATED is True
    assert adapter.SUNSET_DATE == "2026-07-17"
    assert adapter.is_enabled() is False

    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always")
        hotels = await adapter.search_hotels("Paris")
        offers = await adapter.get_offers("100")
        flights = await adapter.search_flights("PAR", "LON", "2026-11-19")
        assert hotels == []
        assert offers == []
        assert flights == []
        assert any(issubclass(w.category, DeprecationWarning) for w in caught)


# ============================================================================
# 2. BOOKING.COM DEMAND API v3.1 ADAPTER TESTS
# ============================================================================


@pytest.mark.asyncio
async def test_booking_demand_adapter_disabled_without_keys():
    adapter = BookingDemandAdapter(api_token="", affiliate_id="")
    assert adapter.is_enabled() is False
    assert await adapter.search_hotels("Tashkent") == []
    assert await adapter.get_offers("101") == []


@pytest.mark.asyncio
async def test_booking_demand_adapter_success():
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers.get("Authorization") == "Bearer test_booking_token"
        assert request.headers.get("X-Affiliate-Id") == "998877"
        assert request.url.path.endswith("/accommodations/search")
        return httpx.Response(
            200,
            json={
                "data": [
                    {
                        "id": 50501,
                        "name": "Hilton Tashkent City",
                        "stars": 5,
                        "review_score": 9.4,
                        "review_nr": 3140,
                        "meal_plan": "breakfast_included",
                        "cancellation_type": "free_cancellation",
                        "url": "https://www.booking.com/hotel/uz/hilton-tashkent-city.html?aid=998877",
                        "price": {"total": 1400.0, "currency": "USD"},
                    }
                ]
            },
        )

    mock_http = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    adapter = BookingDemandAdapter(
        api_token="test_booking_token",
        affiliate_id="998877",
        http_client=mock_http,
    )
    assert adapter.is_enabled() is True

    offers = await adapter.get_offers(
        hotel_id="50501",
        check_in="2026-11-12",
        check_out="2026-11-19",
        adults=2,
    )
    assert len(offers) == 1
    assert offers[0].provider == "booking"
    assert offers[0].total_price == 1400.0
    assert offers[0].price_per_night == 200.0
    assert offers[0].link_type == "deep_link"

    redir = await adapter.build_redirect_url(
        hotel_id="50501",
        check_in="2026-11-12",
        check_out="2026-11-19",
        hotel_name="Hilton Tashkent City",
        city="Tashkent",
    )
    assert redir.link_type == "search"
    assert "booking.com/searchresults.html" in redir.target_url
    assert "aid=998877" in redir.target_url
    await mock_http.aclose()


@pytest.mark.asyncio
async def test_booking_demand_adapter_429_rate_limit():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(429, headers={"Retry-After": "0.01"}, json={"error": "rate_limit"})

    mock_http = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    adapter = BookingDemandAdapter(
        api_token="test_booking_token",
        affiliate_id="998877",
        http_client=mock_http,
    )
    with pytest.raises(RateLimitException):
        await adapter.get_offers("50501", "2026-11-12", "2026-11-19")
    await mock_http.aclose()


@pytest.mark.asyncio
async def test_booking_demand_adapter_timeout_and_empty():
    def timeout_handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("Read timed out", request=request)

    mock_http_timeout = httpx.AsyncClient(transport=httpx.MockTransport(timeout_handler))
    adapter_timeout = BookingDemandAdapter(
        api_token="test_booking_token",
        affiliate_id="998877",
        http_client=mock_http_timeout,
    )
    with pytest.raises(ProviderTimeoutException):
        await adapter_timeout.get_offers("50501", "2026-11-12", "2026-11-19")
    await mock_http_timeout.aclose()

    def empty_handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"data": []})

    mock_http_empty = httpx.AsyncClient(transport=httpx.MockTransport(empty_handler))
    adapter_empty = BookingDemandAdapter(
        api_token="test_booking_token",
        affiliate_id="998877",
        http_client=mock_http_empty,
    )
    assert await adapter_empty.get_offers("50501", "2026-11-12", "2026-11-19") == []
    await mock_http_empty.aclose()


# ============================================================================
# 3. AGODA AFFILIATE API ADAPTER TESTS
# ============================================================================


@pytest.mark.asyncio
async def test_agoda_adapter_lifecycle():
    # 1. Disabled without keys
    disabled = AgodaAdapter(site_id="", api_key="")
    assert disabled.is_enabled() is False
    assert await disabled.get_offers("101") == []

    # 2. Success
    def ok_handler(request: httpx.Request) -> httpx.Response:
        assert request.headers.get("Authorization") == "189900:agoda_secret_key"
        return httpx.Response(
            200,
            json={
                "results": [
                    {
                        "hotelId": 7788,
                        "hotelName": "Hilton Tashkent City",
                        "dailyRate": 190.0,
                        "includeBreakfast": True,
                        "freeCancellation": True,
                        "landingURL": "https://www.agoda.com/hilton-tashkent/hotel/tashkent-uz.html?cid=189900",
                    }
                ]
            },
        )

    client_ok = httpx.AsyncClient(transport=httpx.MockTransport(ok_handler))
    adapter = AgodaAdapter(site_id="189900", api_key="agoda_secret_key", http_client=client_ok)
    offers = await adapter.get_offers("7788", "2026-11-12", "2026-11-19")
    assert len(offers) == 1
    assert offers[0].provider == "agoda"
    assert offers[0].price_per_night == 190.0
    assert offers[0].total_price == 1330.0
    assert offers[0].link_type == "affiliate"
    await client_ok.aclose()

    # 3. 429 & Timeout & Empty
    client_429 = httpx.AsyncClient(
        transport=httpx.MockTransport(lambda req: httpx.Response(429, headers={"Retry-After": "0.01"}))
    )
    adapter_429 = AgodaAdapter(site_id="189900", api_key="agoda_secret_key", http_client=client_429)
    with pytest.raises(RateLimitException):
        await adapter_429.get_offers("7788")
    await client_429.aclose()

    client_empty = httpx.AsyncClient(
        transport=httpx.MockTransport(lambda req: httpx.Response(200, json={"results": []}))
    )
    adapter_empty = AgodaAdapter(site_id="189900", api_key="agoda_secret_key", http_client=client_empty)
    assert await adapter_empty.get_offers("7788") == []
    await client_empty.aclose()


# ============================================================================
# 4. TRIP.COM PARTNER SKELETON ADAPTER TESTS
# ============================================================================


@pytest.mark.asyncio
async def test_tripcom_adapter_skeleton_and_redirect():
    disabled = TripComAdapter(alliance_id="", sid="", api_key="")
    assert disabled.is_enabled() is False
    assert await disabled.get_offers("501") == []

    redir = await disabled.build_redirect_url(
        hotel_id="501",
        check_in="2026-11-12",
        check_out="2026-11-19",
        hotel_name="Hilton Tashkent City",
        city="Tashkent",
    )
    assert redir.provider == "tripcom"
    assert redir.link_type == "search"
    assert "trip.com/hotels/list" in redir.target_url


# ============================================================================
# 5. TRIPADVISOR CONTENT API v1 ADAPTER TESTS (CONTENT ONLY + QUOTA)
# ============================================================================


@pytest.mark.asyncio
async def test_tripadvisor_content_adapter_and_quota():
    disabled = TripadvisorContentAdapter(api_key="")
    assert disabled.is_enabled() is False
    assert await disabled.fetch_hotel_content("Hilton") is None
    assert await disabled.get_offers("any") == []

    def ta_handler(request: httpx.Request) -> httpx.Response:
        path = request.url.path
        if path.endswith("/location/search"):
            return httpx.Response(200, json={"data": [{"location_id": "29801", "name": "Hilton Tashkent City"}]})
        if path.endswith("/details"):
            return httpx.Response(
                200,
                json={
                    "location_id": "29801",
                    "name": "Hilton Tashkent City",
                    "description": "5-star modern luxury hotel in Tashkent City Park.",
                    "rating": "4.8",
                    "num_reviews": "540",
                    "web_url": "https://www.tripadvisor.com/Hotel_Review-d29801",
                },
            )
        if path.endswith("/photos"):
            return httpx.Response(
                200,
                json={"data": [{"images": {"large": {"url": "https://media-cdn.tripadvisor.com/photo1.jpg"}}}]},
            )
        if path.endswith("/reviews"):
            return httpx.Response(
                200,
                json={"data": [{"id": "r1", "title": "Great stay", "text": "Spotless rooms", "rating": 5}]},
            )
        return httpx.Response(404)

    mock_http = httpx.AsyncClient(transport=httpx.MockTransport(ta_handler))
    ta = TripadvisorContentAdapter(api_key="ta_live_key", daily_quota=5, http_client=mock_http)
    content = await ta.fetch_hotel_content("Hilton Tashkent City", "Tashkent")
    assert content is not None
    assert content.location_id == "29801"
    assert content.rating == 4.8
    assert len(content.photos) == 1
    assert len(content.reviews) == 1
    assert ta.call_count == 4

    # Cached call does not increment quota counter
    content_cached = await ta.fetch_hotel_content("Hilton Tashkent City", "Tashkent")
    assert content_cached is not None
    assert ta.call_count == 4

    # Exhaust quota on a new uncached hotel
    with pytest.raises(RateLimitException):
        await ta.fetch_hotel_content("Another Hotel Uncached", "Samarkand")

    await mock_http.aclose()


# ============================================================================
# 6. LUFTHANSA OPEN API ADAPTER & AIRLINE SKELETONS TESTS
# ============================================================================


@pytest.mark.asyncio
async def test_lufthansa_adapter_oauth_schedules_and_skeletons():
    disabled = LufthansaGroupAdapter(client_id="", client_secret="")
    assert disabled.is_enabled() is False
    assert await disabled.search_flights("FRA", "JFK", "2026-11-19") == []

    def lh_handler(request: httpx.Request) -> httpx.Response:
        path = request.url.path
        if path.endswith("/oauth/token"):
            return httpx.Response(200, json={"access_token": "lh_token_123", "expires_in": 3600})
        if "/operations/schedules/" in path:
            assert request.headers.get("Authorization") == "Bearer lh_token_123"
            return httpx.Response(
                200,
                json={
                    "ScheduleResource": {
                        "Schedule": [
                            {
                                "Flight": {
                                    "Departure": {"ScheduledTimeLocal": {"DateTime": "2026-11-19T10:30"}},
                                    "Arrival": {"ScheduledTimeLocal": {"DateTime": "2026-11-19T13:45"}},
                                    "MarketingCarrier": {"AirlineID": "LH", "FlightNumber": "400"},
                                }
                            }
                        ]
                    }
                },
            )
        return httpx.Response(200, json={})

    mock_http = httpx.AsyncClient(transport=httpx.MockTransport(lh_handler))
    lh = LufthansaGroupAdapter(client_id="lh_id", client_secret="lh_sec", http_client=mock_http)
    flights = await lh.search_flights("FRA", "JFK", "2026-11-19", adults=2)
    assert len(flights) == 1
    assert flights[0].carrier_code == "LH"
    assert flights[0].flight_number == "LH400"
    assert flights[0].departure_time == "10:30"
    assert flights[0].link_type == "search"

    redir = await lh.build_redirect_url("lh-fra-jfk-0", "FRA", "JFK", "2026-11-19", adults=2)
    assert "lufthansa.com" in redir.target_url
    assert redir.link_type == "search"
    await mock_http.aclose()

    # Check Turkish Airlines & Transavia skeletons
    tk = TurkishAirlinesNDCAdapter()
    assert tk.is_enabled() is False
    tk_redir = await tk.build_redirect_url("tk-1", "IST", "LON", "2026-11-19")
    assert "turkishairlines.com" in tk_redir.target_url

    hv = TransaviaAdapter()
    assert hv.is_enabled() is False
    hv_redir = await hv.build_redirect_url("hv-1", "AMS", "BCN", "2026-11-19")
    assert "transavia.com" in hv_redir.target_url


# ============================================================================
# 7. STAGE 3: PARTIAL FAILURE RESILIENCE & REST ENDPOINTS (/offers & /redirect)
# ============================================================================


@pytest.mark.asyncio
async def test_registry_partial_failure_resilience():
    """
    If BookingDemandAdapter succeeds (200 OK) while AgodaAdapter fails with HTTP 429,
    ProviderRegistry must still return Booking.com offers and list Agoda in `errors`.
    """
    ok_client = httpx.AsyncClient(
        transport=httpx.MockTransport(
            lambda req: httpx.Response(
                200,
                json={
                    "data": [
                        {
                            "id": 1001,
                            "name": "Hilton Tashkent City",
                            "price": {"total": 1540.0},
                            "meal_plan": "breakfast_included",
                            "cancellation_type": "free_cancellation",
                        }
                    ]
                },
            )
        )
    )
    fail_client = httpx.AsyncClient(
        transport=httpx.MockTransport(
            lambda req: httpx.Response(429, headers={"Retry-After": "0.01"})
        )
    )

    booking_ok = BookingDemandAdapter(api_token="b_tok", affiliate_id="123", http_client=ok_client)
    agoda_fail = AgodaAdapter(site_id="456", api_key="a_key", http_client=fail_client)

    reg = ProviderRegistry(hotel_providers=[booking_ok, agoda_fail])
    agg = await reg.aggregate_hotel_offers(
        hotel_id="1001",
        check_in="2026-11-12",
        check_out="2026-11-19",
        adults=2,
    )
    assert agg.source == "live"
    assert len(agg.offers) == 1
    assert agg.offers[0].provider == "booking"
    assert agg.offers[0].is_cheapest is True
    assert len(agg.errors) == 1
    assert agg.errors[0].provider == "agoda"
    assert agg.errors[0].code == "rate_limit_429"

    await ok_client.aclose()
    await fail_client.aclose()


def test_stage3_rest_endpoints_mock_mode():
    # 1. GET /api/v1/hotels/search?query=Tashkent
    resp_search = client.get("/api/v1/hotels/search?query=Tashkent")
    assert resp_search.status_code == 200
    search_data = resp_search.json()
    assert search_data["source"] == "mock"
    assert len(search_data["items"]) > 0
    first_hotel_id = search_data["items"][0]["id"]

    # 2. GET /api/v1/hotels/{id}/offers
    resp_offers = client.get(
        f"/api/v1/hotels/{first_hotel_id}/offers?check_in=2026-11-12&check_out=2026-11-19&adults=2"
    )
    assert resp_offers.status_code == 200
    offers_data = resp_offers.json()
    assert offers_data["source"] == "mock"
    assert len(offers_data["offers"]) == 3
    # Sorted by total_price ascending, first has is_cheapest=True
    prices = [o["total_price"] for o in offers_data["offers"]]
    assert prices == sorted(prices)
    assert offers_data["offers"][0]["is_cheapest"] is True
    assert all(not o["is_cheapest"] for o in offers_data["offers"][1:])

    # 3. GET /api/v1/hotels/{id}/offers/{provider}/redirect
    for prov in ("booking", "agoda", "tripcom"):
        resp_redir = client.get(
            f"/api/v1/hotels/{first_hotel_id}/offers/{prov}/redirect?check_in=2026-11-12&check_out=2026-11-19&adults=2"
        )
        assert resp_redir.status_code == 200
        r_data = resp_redir.json()
        assert r_data["provider"] == prov
        assert r_data["link_type"] == "search"
        assert r_data["target_url"].startswith("https://")

    # 4. GET /api/v1/flights/{id}/redirect
    resp_flt_redir = client.get(
        "/api/v1/flights/flt-tas-ist-0/redirect?carrier_code=HY&origin=TAS&destination=IST&departure_date=2026-11-19&adults=2"
    )
    assert resp_flt_redir.status_code == 200
    f_redir = resp_flt_redir.json()
    assert f_redir["target_url"].startswith("https://")
    assert f_redir["link_type"] == "search"


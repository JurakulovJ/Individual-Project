import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


def test_extract_constraints_and_generate_itinerary():
    # 1. Extract constraints (Russian prompt)
    resp_ext = client.post(
        "/api/v1/plan/extract-constraints",
        json={"prompt": "Собери тур в Нью-Йорк на 7 дней в ноябре для 2 взрослых, отель 5 звезд"},
    )
    assert resp_ext.status_code == 200
    constraints = resp_ext.json()
    assert "New York" in constraints["destination"]
    assert constraints["travelers_count"] == 2

    # 2. Generate itinerary + AI bundles
    resp_itin = client.post("/api/v1/itinerary/generate", json=constraints)
    assert resp_itin.status_code == 200
    itin = resp_itin.json()
    assert len(itin["days"]) == 7
    assert len(itin["recommended_bundles"]) >= 1


def test_hotels_search_and_mathematical_filtering():
    # All NYC 5* hotels
    resp = client.get("/api/v1/hotels/search?destination=New York&stars=5")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_count"] == 51
    assert all(h["stars"] == 5 for h in data["items"])

    # Filter by meal_plans=BB
    resp_bb = client.get("/api/v1/hotels/search?destination=New York&stars=5&meal_plans=BB")
    assert resp_bb.status_code == 200
    data_bb = resp_bb.json()
    assert all(h["meal_plan"] == "BB" for h in data_bb["items"])


def test_flights_search_and_sorting():
    resp = client.get("/api/v1/flights/search?stops=direct&sort_by=cheapest")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_count"] >= 1
    assert all(f["stops"] == 0 for f in data["items"])


def test_transfers_search():
    resp = client.get("/api/v1/transfers/search?passengers=2")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_count"] >= 3


def test_orders_and_dynamic_dashboard_summary():
    # Initial summary
    sum_before = client.get("/api/v1/dashboard/summary").json()
    initial_total = sum_before["financial_info"]["unpaid_orders_total"]

    # Create a new hotel order
    order_resp = client.post(
        "/api/v1/orders",
        json={
            "order_type": "hotel",
            "title": "The Knickerbocker Hotel (5★)",
            "subtitle": "6 Times Square, Нью-Йорк",
            "total_price": 3670.0,
            "currency": "USD",
            "is_refundable": True,
            "payment_status": "payment_required",
            "loyalty_points": 112,
            "details": ["Двухместный номер Superior"],
        },
    )
    assert order_resp.status_code == 200

    # Verify dashboard updated dynamically
    sum_after = client.get("/api/v1/dashboard/summary").json()
    assert sum_after["financial_info"]["unpaid_orders_total"] == initial_total + 3670.0
    assert sum_after["order_status"]["free_cancellation"]["expiring_24h"] >= 1


def test_aviasales_autocomplete_and_booking_locations():
    # Aviasales IATA autocomplete endpoint (/api/v1/flights/autocomplete)
    resp_auto = client.get("/api/v1/flights/autocomplete?term=Ташкент&locale=ru")
    assert resp_auto.status_code == 200
    places = resp_auto.json()
    assert isinstance(places, list)
    assert len(places) >= 1
    assert any(p["code"] == "TAS" for p in places)

    # Booking.com location lookup endpoint (/api/v1/hotels/locations)
    resp_loc = client.get("/api/v1/hotels/locations?query=Барселона&locale=ru")
    assert resp_loc.status_code == 200
    locs = resp_loc.json()
    assert isinstance(locs, list)
    assert len(locs) >= 1
    assert "source" in locs[0]


def test_istanbul_hotel_search_with_lower_stars_and_bb():
    resp = client.get("/api/v1/hotels/search?destination=Istanbul&stars=0,2&meal_plans=BB")
    assert resp.status_code == 200
    data = resp.json()
    assert "Istanbul" in data["city_label"] or "Стамбул" in data["city_label"]
    assert data["total_count"] >= 2
    assert len(data["items"]) >= 2
    assert all(h["stars"] in (0, 2) for h in data["items"])




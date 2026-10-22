import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_extract_constraints_tokyo():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "prompt": "I want a 5-day romantic trip to Tokyo with moderate budget in April",
            "conversation_id": "test-uuid-1",
        }
        response = await client.post("/api/v1/plan/extract-constraints", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "Tokyo" in data["destination"]
        assert data["budget_level"] == "moderate"
        assert data["trip_type"] == "romantic"
        assert data["travelers_count"] == 2
        assert "start_date" in data
        assert "end_date" in data


@pytest.mark.asyncio
async def test_extract_constraints_empty_validation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/plan/extract-constraints", json={"prompt": ""})
        assert response.status_code == 400


@pytest.mark.asyncio
async def test_generate_itinerary():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        constraints = {
            "destination": "Tokyo, Japan",
            "origin": "TAS",
            "start_date": "2026-04-10",
            "end_date": "2026-04-15",
            "budget_level": "moderate",
            "trip_type": "romantic",
            "interests": ["culture", "food", "sightseeing"],
            "travelers_count": 2,
        }
        response = await client.post("/api/v1/itinerary/generate", json=constraints)
        assert response.status_code == 200
        data = response.json()
        assert data["itinerary_id"].startswith("itin_")
        assert "Tokyo" in data["destination"]
        assert data["total_estimated_cost"] > 0
        assert len(data["days"]) >= 5
        assert len(data["days"][0]["activities"]) > 0
        assert data["flight_summary"] is not None
        assert data["hotel_summary"] is not None


@pytest.mark.asyncio
async def test_get_destinations():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/plan/destinations")
        assert response.status_code == 200
        destinations = response.json()
        assert isinstance(destinations, list)
        assert len(destinations) >= 3
        cities = [d["city"] for d in destinations]
        assert "Tokyo" in cities
        assert "Paris" in cities
        assert "Bali" in cities


@pytest.mark.asyncio
async def test_quick_generate():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {"prompt": "Luxury 3-day cultural weekend in Paris"}
        response = await client.post("/api/v1/plan/quick-generate", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "Paris" in data["destination"]
        assert data["total_estimated_cost"] > 0
        assert len(data["days"]) >= 3

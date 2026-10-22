# UI Data Contract Specification

## 1. Overview
This document specifies the REST API data contracts between the React frontend client and the FastAPI backend service for the TravelAI application.

---

## 2. API Endpoints Specification

### 2.1 Health Check
- **Endpoint**: `GET /api/v1/health`
- **Description**: Verifies backend server health and provider mode.
- **Response `200 OK`**:
```json
{
  "status": "ok",
  "mock_mode": true
}
```

---

### 2.2 AI Travel Constraint Extraction
- **Endpoint**: `POST /api/v1/plan/extract-constraints`
- **Request Body**:
```json
{
  "prompt": "I want a 5-day romantic trip to Tokyo with moderate budget in April",
  "conversation_id": "optional-uuid"
}
```
- **Response `200 OK`**:
```json
{
  "destination": "Tokyo, Japan",
  "origin": "TAS",
  "start_date": "2026-04-10",
  "end_date": "2026-04-15",
  "budget_level": "moderate",
  "trip_type": "romantic",
  "interests": ["culture", "food", "sightseeing"],
  "travelers_count": 2
}
```

---

### 2.3 Itinerary Synthesis
- **Endpoint**: `POST /api/v1/itinerary/generate`
- **Request Body**: (Structured constraints)
- **Response `200 OK`**:
```json
{
  "itinerary_id": "itin_10293",
  "destination": "Tokyo, Japan",
  "total_estimated_cost": 2450.00,
  "currency": "USD",
  "days": [
    {
      "day_number": 1,
      "date": "2026-04-10",
      "title": "Arrival & Shibuya Evening",
      "activities": [
        {
          "time": "14:00",
          "title": "Check-in at Hotel Gracery Shinjuku",
          "category": "hotel",
          "cost": 180.0
        },
        {
          "time": "18:00",
          "title": "Shibuya Sky Observation Deck",
          "category": "attraction",
          "cost": 25.0
        }
      ]
    }
  ]
}
```

# UI Data Contract Specification (`docs/UI_DATA_CONTRACT.md`)

## 1. Overview
This document specifies the REST API data contracts between the React 18 frontend (`http://localhost:5173`) and the FastAPI backend (`http://localhost:8000`) for the TravelAI platform, including the **Official Multi-Provider Hotel & Airline API Layer** and **Mock Mode (`source: "mock"`)**.

---

## 2. Core System & Official Provider Endpoints

### 2.1 Health Check & Active Provider Telemetry
- **Endpoint**: `GET /api/v1/health`
- **Description**: Verifies backend server health, active official providers, and whether `mock_mode` is active.
- **Response `200 OK`**:
```json
{
  "status": "ok",
  "mock_mode": true,
  "active_hotel_providers": ["mock"],
  "active_flight_providers": ["mock"],
  "tripadvisor_content_enabled": false,
  "deprecated_providers": [
    "amadeus (Self-Service portal shuts down 2026-07-17; disabled by default)"
  ]
}
```

---

### 2.2 Hotel Search (`GET /api/v1/hotels/search`)
- **Endpoint**: `GET /api/v1/hotels/search?query=Ташкент&check_in=2026-11-12&check_out=2026-11-19&guests=2&rooms=1`
- **Query Parameters**:
  - `query` (or `destination`): City or hotel name (e.g., `Ташкент`, `Istanbul`, `Hilton`).
  - `check_in`: ISO date (`YYYY-MM-DD`) or localized date string.
  - `check_out`: ISO date (`YYYY-MM-DD`) or localized date string.
  - `guests` / `adults`: Number of adult guests (default `2`).
  - `rooms`: Number of rooms (default `1`).
  - `stars`: Optional comma-separated star filter (e.g., `4,5`).
  - `meal_type`: Optional meal code (`RO`, `BB`, `HB`, `FB`, `AI`).
- **Response `200 OK`**:
```json
{
  "destination": "Ташкент (Tashkent)",
  "source": "mock",
  "total_found": 50,
  "showing_count": 15,
  "has_more": true,
  "hotels": [
    {
      "id": "htl-tashkent-0",
      "name": "Hilton Tashkent City",
      "city": "Ташкент",
      "city_en": "Tashkent",
      "stars": 5,
      "rating": 9.4,
      "reviews_count": 3140,
      "price_per_night": 265.0,
      "total_price": 1855.0,
      "currency": "USD",
      "meal_code": "BB",
      "meal_type": "Завтрак вкл.",
      "free_cancellation": true,
      "coordinates": { "lat": 41.3142, "lng": 69.2485 },
      "images": [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80"
      ],
      "provider_offers": [
        {
          "provider": "Booking.com",
          "provider_slug": "booking",
          "price": 1855.0,
          "currency": "USD",
          "meal_label": "Завтрак вкл.",
          "cancellation_label": "Бесплатная отмена",
          "deep_link": "https://www.booking.com/searchresults.ru.html?...",
          "is_cheapest": true
        }
      ]
    }
  ]
}
```

---

### 2.3 Multi-Platform Hotel Offer Aggregation (`GET /api/v1/hotels/{id}/offers`)
- **Endpoint**: `GET /api/v1/hotels/{id}/offers?check_in=2026-11-12&check_out=2026-11-19&adults=2&rooms=1`
- **Description**: Concurrently queries all active hotel price providers (`Booking.com`, `Agoda`, `Trip.com`, or `MockAdapter`), normalizes offers into a unified list sorted by `total_price` ascending, marks the lowest price with `is_cheapest: true`, enriches with content-only `TripadvisorContentData` (if enabled or in mock mode), and records any partial provider failures in `errors` without failing the whole request.
- **Response `200 OK`**:
```json
{
  "hotel_id": "htl-tashkent-0",
  "hotel_name": "Hilton Tashkent City",
  "city": "Tashkent",
  "check_in": "2026-11-12",
  "check_out": "2026-11-19",
  "adults": 2,
  "rooms": 1,
  "nights": 7,
  "currency": "USD",
  "source": "mock",
  "cheapest_provider": "booking",
  "cheapest_price": 1855.0,
  "offers": [
    {
      "provider": "booking",
      "provider_label": "Booking.com",
      "hotel_id": "htl-tashkent-0",
      "hotel_name": "Hilton Tashkent City",
      "room_name": "Двухместный номер Standard / Superior",
      "meal_plan": "BB",
      "meal_label": "Завтрак включён",
      "free_cancellation": true,
      "price_per_night": 265.0,
      "total_price": 1855.0,
      "nights": 7,
      "currency": "USD",
      "is_cheapest": true,
      "link_type": "search",
      "deep_link": null,
      "redirect_endpoint": "/api/v1/hotels/htl-tashkent-0/offers/booking/redirect",
      "badge": "Официальный партнёр Booking.com"
    },
    {
      "provider": "agoda",
      "provider_label": "Agoda",
      "hotel_id": "htl-tashkent-0",
      "hotel_name": "Hilton Tashkent City",
      "room_name": "Двухместный номер Standard / Superior",
      "meal_plan": "BB",
      "meal_label": "Завтрак включён",
      "free_cancellation": true,
      "price_per_night": 274.29,
      "total_price": 1920.0,
      "nights": 7,
      "currency": "USD",
      "is_cheapest": false,
      "link_type": "search",
      "deep_link": null,
      "redirect_endpoint": "/api/v1/hotels/htl-tashkent-0/offers/agoda/redirect",
      "badge": "Спецтариф Agoda Partner"
    },
    {
      "provider": "tripcom",
      "provider_label": "Trip.com",
      "hotel_id": "htl-tashkent-0",
      "hotel_name": "Hilton Tashkent City",
      "room_name": "Двухместный номер Standard / Superior",
      "meal_plan": "BB",
      "meal_label": "Завтрак включён",
      "free_cancellation": true,
      "price_per_night": 282.29,
      "total_price": 1976.0,
      "nights": 7,
      "currency": "USD",
      "is_cheapest": false,
      "link_type": "search",
      "deep_link": null,
      "redirect_endpoint": "/api/v1/hotels/htl-tashkent-0/offers/tripcom/redirect",
      "badge": "Официальный партнёр Trip.com"
    }
  ],
  "tripadvisor_content": {
    "location_id": "ta-mock-htl-tashkent-0",
    "name": "Hilton Tashkent City",
    "description": "Отель Hilton Tashkent City (Tashkent) отмечен высокими оценками путешественников Tripadvisor за качество сервиса, чистоту номеров и удобное расположение.",
    "rating": 9.2,
    "num_reviews": 432,
    "web_url": "https://www.tripadvisor.com/Search?q=Hilton+Tashkent+City+Tashkent",
    "photos": [
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=900&q=80"
    ],
    "reviews": [
      {
        "id": "rev-1",
        "title": "Безупречный сервис и комфорт",
        "text": "Отличный завтрак, просторный номер и быстрая регистрация.",
        "rating": 5,
        "published_date": "2026-10-15"
      }
    ],
    "source": "mock"
  },
  "errors": []
}
```

---

### 2.4 Hotel Offer Redirect (`GET /api/v1/hotels/{id}/offers/{provider}/redirect`)
- **Endpoint**: `GET /api/v1/hotels/{id}/offers/{provider}/redirect?check_in=2026-11-12&check_out=2026-11-19&adults=2&rooms=1&hotel_name=Hilton+Tashkent+City&city=Tashkent`
- **Description**: Generates a verified affiliate deep-link (`link_type: "deep_link"`) or official pre-filled platform search URL (`link_type: "search"`) for `booking`, `agoda`, or `tripcom`. If `redirect=true` is passed, returns an HTTP `302 Found` redirect.
- **Response `200 OK`**:
```json
{
  "item_id": "htl-tashkent-0",
  "provider": "booking",
  "provider_label": "Booking.com",
  "target_url": "https://www.booking.com/searchresults.ru.html?ss=Hilton+Tashkent+City+Tashkent&checkin=2026-11-12&checkout=2026-11-19&group_adults=2&no_rooms=1&selected_currency=USD",
  "link_type": "search",
  "source": "mock"
}
```

---

### 2.5 Flight Search (`GET /api/v1/flights/search`) & Airline Redirect (`GET /api/v1/flights/{id}/redirect`)
- **Search Endpoint**: `GET /api/v1/flights/search?origin=TAS&destination=IST&departure_date=2026-11-19&adults=1&cabin_class=economy`
- **Redirect Endpoint**: `GET /api/v1/flights/{id}/redirect?provider=lufthansa&origin=TAS&destination=IST&departure_date=2026-11-19&adults=1&carrier_code=LH`
- **Redirect Response `200 OK`**:
```json
{
  "item_id": "flt-tas-ist-0",
  "provider": "lufthansa",
  "provider_label": "Lufthansa",
  "target_url": "https://www.lufthansa.com/xx/en/flight-search?origin=TAS&destination=IST&outboundDate=2026-11-19&adults=1&cabin=ECONOMY",
  "link_type": "search",
  "source": "mock"
}
```

---

## 3. AI Trip Planning Endpoints

### 3.1 AI Travel Constraint Extraction
- **Endpoint**: `POST /api/v1/plan/extract-constraints`
- **Request Body**:
```json
{
  "prompt": "I want a 5-day romantic trip to Tokyo with moderate budget in April"
}
```

### 3.2 Itinerary Synthesis
- **Endpoint**: `POST /api/v1/itinerary/generate`
- **Description**: Synthesizes a multi-day itinerary with flights, hotels, and curated activities within the user's budget.

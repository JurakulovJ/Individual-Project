# TravelAI System Architecture Document

## 1. Executive Overview
TravelAI is an AI-powered travel planning and decision-support web application that empowers users to describe their dream trip in natural language and receive an intelligent, ranked, and fully cohesive itinerary. The system leverages conversational AI constraint extraction, multi-criteria flight and hotel ranking algorithms, and offline-resilient mock adapters.

---

## 2. High-Level Architecture Diagram

```
+-------------------------------------------------------------+
|                     Client Web Application                   |
|           React 18 + Vite + Tailwind CSS + Lucide           |
+------------------------------+------------------------------+
                               | HTTPS / JSON REST
                               v
+-------------------------------------------------------------+
|                  Backend API Layer (FastAPI)                 |
|             CORS Middleware, Pydantic Validation             |
+---------------+------------------------------+---------------+
                |                              |
                v                              v
+---------------+--------------+  +------------+--------------+
|       Services Layer         |  |      Data Adapters        |
| - AI Constraint Extractor    |  | - Mock Provider (JSON)    |
| - Travel Ranking Engine      |  | - Amadeus Flight/Hotel API|
| - Dynamic Itinerary Builder  |  | - Google Places/Maps API  |
+---------------+--------------+  +------------+--------------+
                |                              |
                v                              v
+---------------+--------------+  +---------------------------+
|    AI Providers (LLM)        |  |  Database & Persistence   |
| - Google Gemini 2.5 / Flash  |  |  SQLAlchemy ORM           |
| - OpenAI GPT-4o / Mini       |  |  SQLite (Dev) / Postgres  |
+------------------------------+  +---------------------------+
```

---

## 3. Core Component Responsibilities

1. **Frontend (Presentation Tier)**:
   - Split-screen AI conversational planner layout.
   - Dynamic itinerary timeline visualization and interactive map placeholders.
   - Responsive design powered by Tailwind CSS tokens.

2. **Backend API (FastAPI Tier)**:
   - RESTful endpoints (`/api/v1/...`).
   - High performance async I/O with Uvicorn.
   - Automatic OpenAPI/Swagger documentation generation at `/docs`.

3. **Adapters & Services**:
   - `MockProvider`: Guarantees seamless offline testing with deterministic responses.
   - `AmadeusAdapter`: Real flight search and hotel offers.
   - `GoogleMapsAdapter`: Geocoding, photo retrieval, and place recommendations.
   - `ConstraintExtractor`: Translates user chat prompts into structured Pydantic travel constraints.

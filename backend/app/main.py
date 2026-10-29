from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.health import router as health_router
from app.api.v1.plan import router as plan_router
from app.api.v1.hotels import router as hotels_router
from app.api.v1.flights import router as flights_router
from app.api.v1.transfers import router as transfers_router
from app.api.v1.dashboard_orders import router as dashboard_orders_router

app = FastAPI(
    title="TravelAI API",
    description="AI-Powered Travel Planning, Multi-Vertical Booking & B2B/B2C Platform API",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS for React (Vite) Frontend on any local port
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API v1 routes
app.include_router(health_router, prefix="/api/v1")
app.include_router(plan_router, prefix="/api/v1")
app.include_router(hotels_router, prefix="/api/v1")
app.include_router(flights_router, prefix="/api/v1")
app.include_router(transfers_router, prefix="/api/v1")
app.include_router(dashboard_orders_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "message": "Welcome to TravelAI Enterprise API",
        "docs": "/docs",
        "health": "/api/v1/health",
    }

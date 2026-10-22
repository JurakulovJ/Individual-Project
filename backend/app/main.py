from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.health import router as health_router
from app.api.v1.plan import router as plan_router

app = FastAPI(
    title="TravelAI API",
    description="AI-Powered Travel Planning and Decision-Support Backend API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
origins = settings.cors_origin_list
if not origins:
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(health_router, prefix="/api/v1")
app.include_router(plan_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "message": "Welcome to TravelAI API",
        "docs": "/docs",
        "health": "/api/v1/health",
    }

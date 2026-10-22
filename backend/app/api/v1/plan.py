from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException
from app.schemas.plan import (
    ConstraintExtractionRequest,
    TravelConstraints,
    ItineraryResponse,
)
from app.services.extractor import extract_constraints_from_prompt
from app.services.itinerary_builder import build_itinerary
from app.adapters.mock_provider import mock_provider

router = APIRouter(prefix="", tags=["Travel Planning & Itineraries"])


@router.post("/plan/extract-constraints", response_model=TravelConstraints)
async def extract_constraints(body: ConstraintExtractionRequest) -> TravelConstraints:
    """
    Extract structured travel constraints from a natural language user prompt.
    Spec: UI_DATA_CONTRACT.md Section 2.2
    """
    if not body.prompt or not body.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")
    return extract_constraints_from_prompt(body.prompt)


@router.post("/itinerary/generate", response_model=ItineraryResponse)
async def generate_itinerary(constraints: TravelConstraints) -> ItineraryResponse:
    """
    Generate an intelligent, ranked, and cohesive multi-day itinerary.
    Spec: UI_DATA_CONTRACT.md Section 2.3
    """
    return build_itinerary(constraints)


@router.get("/plan/destinations", response_model=List[Dict[str, Any]])
async def get_destinations() -> List[Dict[str, Any]]:
    """
    Retrieve curated destination catalog and supported cities.
    """
    return mock_provider.get_destinations()


@router.post("/plan/quick-generate", response_model=ItineraryResponse)
async def quick_generate(body: ConstraintExtractionRequest) -> ItineraryResponse:
    """
    End-to-end convenience endpoint: extracts constraints and builds itinerary from raw prompt.
    """
    if not body.prompt or not body.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")
    constraints = extract_constraints_from_prompt(body.prompt)
    return build_itinerary(constraints)

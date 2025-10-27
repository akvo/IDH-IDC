from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from db.connection import get_session
from db.procurement_library_v2 import crud_practice
from models.procurement_library_v2.pl_schemas import (
    PLPracticeInterventionDetailRead,
    PaginatedPracticeInterventionResponse,
    PaginatedPracticeByAttributeResponse
)

pl_practice_router_v2 = APIRouter(prefix="/plv2", tags=["Procurement Library V2"])


# ============================================================
# GET LIST
# ============================================================
@pl_practice_router_v2.get(
    "/practices",
    name="plv2:get_all_practices",
    summary="List practice interventions in the Procurement Library",
    response_description="Paginated list of practices with related indicators and attributes",
    response_model=PaginatedPracticeInterventionResponse,
)
def list_practices(
    db: Session = Depends(get_session),
    page: int = Query(1, ge=1, description="Page number, starting from 1"),
    limit: int = Query(10, ge=1, le=100, description="Number of items per page"),
    search: str | None = Query(None, description="Optional filter by practice label"),
):
    """
    Retrieve a paginated list of **Practice Interventions** from the Procurement Library.

    ### Parameters:
    - **page** — Page number for pagination (default: 1)
    - **limit** — Number of results per page (default: 10)
    - **search** — Optional filter to search practice labels

    ### Returns:
    - `PaginatedPracticeInterventionResponse`: contains
        - `current`: Current page number
        - `total`: Total number of items
        - `total_page`: Total number of pages
        - `data`: List of practices (`PLPracticeInterventionListItem`)
    """
    return crud_practice.get_practice_list(db, page=page, limit=limit, search=search)


# ============================================================
# GET DETAIL
# ============================================================
@pl_practice_router_v2.get(
    "/practice/{practice_id}",
    name="plv2:get_detail_by_practice_id",
    summary="Retrieve a detailed practice intervention by ID",
    response_description="Detailed record of a practice intervention, including indicators, scores, and tags",
    response_model=PLPracticeInterventionDetailRead,
)
def get_practice_detail(practice_id: int, db: Session = Depends(get_session)):
    """
    Retrieve detailed information for a **single practice intervention**.

    ### Path Parameters:
    - **practice_id** — The unique identifier of the practice intervention

    ### Returns:
    - `PLPracticeInterventionDetailRead`: includes
        - Core practice fields
        - Related `scores` and `indicators`
        - Related `tags` and `attributes`
        - Environmental and income flags
        - Procurement process summary
    """
    result = crud_practice.get_practice_by_id(db, practice_id)
    if not result:
        raise HTTPException(status_code=404, detail="Practice not found")
    return result


# ============================================================
# GET PRACTICES BY ATTRIBUTE ID (WITH OPTIONAL FILTER BY ATTRIBUTE IDS)
# ============================================================
@pl_practice_router_v2.get(
    "/practices-by-attribute/{attribute_id}",
    name="plv2:get_practices_by_attribute_id",
    summary="Get practices by attribute ID (optionally filtered by other attribute IDs)",
    response_description="Paginated list of practices filtered by attribute",
    response_model=PaginatedPracticeByAttributeResponse,
    tags=["Procurement Library V2"],
)
def get_practices_by_attribute_id(
    attribute_id: int,
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Number of items per page"),
    search: Optional[str] = Query(None, description="Search by practice label"),
    attribute_ids: Optional[list[int]] = Query(
        None,
        description="List of additional attribute IDs to filter practices (e.g., attribute_ids=1&attribute_ids=3)",
    ),
    db: Session = Depends(get_session),
):
    """
    Returns a paginated list of practice interventions linked to a specific attribute.

    **Path parameter:**
    - `attribute_id`: The ID of the main attribute (e.g., from *Sourcing Strategy Cycle*).

    **Query parameters:**
    - `page`: Page number (default = 1)
    - `limit`: Number of items per page (default = 10)
    - `search`: Optional filter by practice label
    - `attribute_ids`: Optional list of additional attribute IDs (e.g., `attribute_ids=3&attribute_ids=5`)

    **Notes:**
    - `is_environmental` is True if any indicator named `"environmental_impact"` has score > 3.
    - `is_income` is True if any indicator named `"income_impact"` has score > 3.
    """
    return crud_practice.get_practices_by_attribute(
        db,
        attribute_id=attribute_id,
        page=page,
        limit=limit,
        search=search,
        extra_attribute_ids=attribute_ids,
    )

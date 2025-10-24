from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from db.connection import get_session
from db.procurement_library_v2 import crud_practice
from models.procurement_library_v2.pl_schemas import (
    PLPracticeInterventionDetailRead,
    PaginatedPracticeInterventionResponse,
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

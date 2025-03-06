from math import ceil
from fastapi import APIRouter
from fastapi import Depends
from sqlalchemy.orm import Session
from db.connection import get_session
from db.procurement_library import crud_practice
from models.procurement_library.practice import (
    ImpactArea,
    PracticeDict,
    PaginatedPracticeResponse,
)
from typing import Optional

practice_route = APIRouter()


@practice_route.get(
    "/practices",
    summary="Get all practices",
    response_description="List of all practices",
    response_model=PaginatedPracticeResponse,
    tags=["Procurement Library"],
    name="pl:get_all_practices",
)
def get_all_practices(
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None,
    procurement_process_ids: Optional[str] = None,
    impact_area: Optional[ImpactArea] = None,
    session: Session = Depends(get_session),
) -> PaginatedPracticeResponse:
    procurement_process_ids_list = (
        [int(id) for id in procurement_process_ids.split(",")]
        if procurement_process_ids
        else None
    )
    results = crud_practice.get_practices(
        session=session,
        skip=(limit * (page - 1)),
        limit=limit,
        search=search,
        procurement_process_ids=procurement_process_ids_list,
        impact_area=impact_area,
    )
    total = results["count"]
    total_page = ceil(total / limit) if total > 0 else 1
    return {
        "current": page,
        "data": results["data"],
        "total": total,
        "total_page": total_page,
    }


@practice_route.get(
    "/practice/{practice_id}",
    summary="Get practice by id",
    response_description="Practice details",
    response_model=PracticeDict,
    tags=["Procurement Library"],
    name="pl:get_practice_by_id",
)
def get_practice_by_id(
    practice_id: int,
    session: Session = Depends(get_session),
) -> PracticeDict:
    return crud_practice.get_practice_by_id(session, practice_id)

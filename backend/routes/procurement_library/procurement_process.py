from typing import List
from fastapi import APIRouter
from sqlalchemy.orm import Session
from fastapi import Depends
from db.connection import get_session
from models.procurement_library.procurement_process import (
    ProcurementProcessDict,
)
from db.procurement_library import crud_procurement_process

procurement_process_route = APIRouter()


@procurement_process_route.get(
    "/pl/procurement-processes",
    summary="Get all procurement processes",
    description="Get all procurement processes",
    tags=["Procurement Library"],
    name="pl:get_all_procurement_processes",
)
def get_all_procurement_processes(
    session: Session = Depends(get_session),
) -> List[ProcurementProcessDict]:
    return crud_procurement_process.get_all_procurement_processes(
        session=session
    )

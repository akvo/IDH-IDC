from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from db.connection import get_session
from db.procurement_library_v2 import crud_practice

pl_practice_router_v2 = APIRouter(prefix="/plv2", tags=["Procurement Library V2"])


# ============================================================
# GET LIST
# ============================================================
@pl_practice_router_v2.get("/practices")
def list_practices(
    db: Session = Depends(get_session),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: str = Query(None, description="Filter by label"),
):
    result = crud_practice.get_practice_list(
        db, page=page, limit=limit, search=search)
    return result


# ============================================================
# GET DETAIL
# ============================================================
@pl_practice_router_v2.get("/practice/{practice_id}")
def get_practice_detail(practice_id: int, db: Session = Depends(get_session)):
    result = crud_practice.get_practice_by_id(db, practice_id)
    if not result:
        raise HTTPException(status_code=404, detail="Practice not found")
    return result

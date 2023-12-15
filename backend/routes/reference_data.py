import db.crud_reference_data as crud_ref

from math import ceil
from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPBasicCredentials as credentials
from sqlalchemy.orm import Session
from typing import Optional

from db.connection import get_session
from models.reference_data import (
    PaginatedReferenceDataResponse,
    ReferenceDataBase,
    ReferenceDataDict,
    Driver,
)
from middleware import verify_admin

security = HTTPBearer()
reference_data_routes = APIRouter()


@reference_data_routes.get(
    "/reference_data",
    response_model=PaginatedReferenceDataResponse,
    summary="get all reference data",
    name="reference_data:get_all",
    tags=["Reference Data"],
)
def get_all(
    req: Request,
    page: int = 1,
    limit: int = 10,
    country: Optional[int] = None,
    commodity: Optional[int] = None,
    source: Optional[str] = None,
    driver: Optional[Driver] = None,
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    data = crud_ref.get_all_reference(
        session=session,
        commodity=commodity,
        country=country,
        source=source,
        driver=driver,
        skip=(limit * (page - 1)),
        limit=limit,
    )
    if not data:
        raise HTTPException(status_code=404, detail="Not found")
    total = data["count"]
    data = [d.to_data_list for d in data["data"]]
    total_page = ceil(total / limit) if total > 0 else 0
    if total_page < page:
        raise HTTPException(status_code=404, detail="Not found")
    return {
        "current": page,
        "data": data,
        "total": total,
        "total_page": total_page,
    }


@reference_data_routes.post(
    "/reference_data",
    response_model=ReferenceDataDict,
    summary="create reference data",
    name="reference_data:create",
    tags=["Reference Data"],
)
def create_reference_data(
    req: Request,
    payload: ReferenceDataBase,
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    user = verify_admin(session=session, authenticated=req.state.authenticated)
    data = crud_ref.add_reference(session=session, payload=payload, user=user)
    return data.serialize


@reference_data_routes.get(
    "/reference_data/{reference_data_id:path}",
    response_model=ReferenceDataDict,
    summary="get reference data by id",
    name="reference_data:get_by_id",
    tags=["Reference Data"],
)
def get_reference_data_by_id(
    req: Request,
    reference_data_id: int,
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    data = crud_ref.get_reference_by_id(session=session, id=reference_data_id)
    return data.serialize


@reference_data_routes.put(
    "/reference_data/{reference_data_id:path}",
    response_model=ReferenceDataDict,
    summary="update reference data by id",
    name="reference_data:update",
    tags=["Reference Data"],
)
def update_tag(
    req: Request,
    reference_data_id: int,
    payload: ReferenceDataBase,
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    verify_admin(session=session, authenticated=req.state.authenticated)
    data = crud_ref.update_reference(
        session=session, id=reference_data_id, payload=payload
    )
    return data.serialize

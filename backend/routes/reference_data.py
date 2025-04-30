import logging
import db.crud_reference_data as crud_ref

from math import ceil
from http import HTTPStatus
from fastapi import APIRouter, Request, Depends, HTTPException, Response, Query
from fastapi.security import HTTPBearer, HTTPBasicCredentials as credentials
from sqlalchemy.orm import Session
from typing import Optional, List

from db.connection import get_session
from models.reference_data import (
    PaginatedReferenceDataResponse,
    ReferenceDataBase,
    ReferenceDataDict,
    ReferenceValueList,
    Driver,
    ReferenceCountByCountryDict,
    ReferenceFilter,
)
from middleware import verify_admin, verify_user

security = HTTPBearer()
reference_data_routes = APIRouter()

logger = logging.getLogger(__name__)


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
    country: Optional[List[int]] = Query(
        None, description="List of country ids"
    ),
    commodity: Optional[List[int]] = Query(
        None, description="List of commodity ids"
    ),
    source: Optional[List[str]] = Query(None, description="List of sources"),
    driver: Optional[List[Driver]] = Query(
        None, description="List of drivers"
    ),
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    user = verify_user(session=session, authenticated=req.state.authenticated)
    user = user.to_user_info
    is_internal_user = user.get("internal_user", False)
    visible_to_external_user = not is_internal_user

    logText = "/reference_data | on Search explore studies by"
    if country:
        logger.info(f"{logText} country: {country}")
    if commodity:
        logger.info(f"{logText} commodity: {commodity}")
    if source:
        logger.info(f"{logText} source: {source}")
    if driver:
        logger.info(f"{logText} driver: {[d.value for d in driver]}")

    data = crud_ref.get_all_reference(
        session=session,
        commodity=commodity,
        country=country,
        source=source,
        driver=driver,
        visible_to_external_user=visible_to_external_user,
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


@reference_data_routes.get(
    "/reference_data/count_by_country",
    response_model=List[ReferenceCountByCountryDict],
    summary="Count reference data by country",
    name="reference_data:count_by_country",
    tags=["Reference Data"],
)
def count_reference_data_by_country(
    req: Request,
    country: Optional[List[int]] = Query(
        None, description="List of country ids"
    ),
    commodity: Optional[List[int]] = Query(
        None, description="List of commodity ids"
    ),
    source: Optional[List[str]] = Query(None, description="List of sources"),
    driver: Optional[List[Driver]] = Query(
        None, description="List of drivers"
    ),
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    user = verify_user(session=session, authenticated=req.state.authenticated)
    user = user.to_user_info
    is_internal_user = user.get("internal_user", False)
    visible_to_external_user = not is_internal_user

    res = crud_ref.count_reference_data_by_country(
        session=session,
        country=country,
        commodity=commodity,
        source=source,
        driver=driver,
        visible_to_external_user=visible_to_external_user,
    )
    return res


@reference_data_routes.get(
    "/reference_data/reduce_filter_dropdown",
    response_model=ReferenceFilter,
    summary="get reference value to reduce_filter_dropdown by country",
    name="reference_data:reduce_filter_dropdown",
    tags=["Reference Data"],
)
def reduce_filter_dropdown(
    req: Request,
    country: List[int] = Query(description="List of country ids"),
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    user = verify_user(session=session, authenticated=req.state.authenticated)
    user = user.to_user_info
    is_internal_user = user.get("internal_user", False)
    visible_to_external_user = not is_internal_user

    res = crud_ref.reduce_filter_dropdown(
        session=session,
        country=country,
        visible_to_external_user=visible_to_external_user,
    )
    return res


@reference_data_routes.get(
    "/reference_data/reference_value",
    response_model=List[ReferenceValueList],
    summary="get reference value",
    name="reference_data:get_reference_value",
    tags=["Reference Data"],
)
def get_reference_value(
    req: Request,
    country: int,
    commodity: int,
    driver: Driver,
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    data = crud_ref.get_reference_value(
        session=session,
        commodity=commodity,
        country=country,
        driver=driver,
    )
    if not data:
        return []
    # transform value
    data = [d.serialize for d in data]
    for d in data:
        value = None
        unit = None
        type = None
        if driver == Driver.area:
            value = d["area"]
            unit = d["area_size_unit"]
            type = d["type_area"]
        if driver == Driver.price:
            value = d["price"]
            unit = d["price_unit"]
            type = d["type_price"]
        if driver == Driver.volume:
            value = d["volume"]
            unit = d["volume_measurement_unit"]
            type = d["type_volume"]
        if driver == Driver.cost_of_production:
            value = d["cost_of_production"]
            unit = d["cost_of_production_unit"]
            type = d["type_cost_of_production"]
        if driver == Driver.diversified_income:
            value = d["diversified_income"]
            unit = d["diversified_income_unit"]
            type = d["type_diversified_income"]
        d["value"] = value
        d["unit"] = unit
        d["type"] = type
    return data


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


@reference_data_routes.delete(
    "/reference_data/{reference_data_id:path}",
    responses={204: {"model": None}},
    status_code=HTTPStatus.NO_CONTENT,
    summary="delete reference data by id",
    name="reference_data:delete",
    tags=["Reference Data"],
)
def delete_reference_data(
    req: Request,
    reference_data_id: int,
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    verify_admin(session=session, authenticated=req.state.authenticated)
    crud_ref.delete_reference(session=session, id=reference_data_id)
    return Response(status_code=HTTPStatus.NO_CONTENT.value)

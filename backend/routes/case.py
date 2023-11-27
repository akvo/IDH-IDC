import db.crud_case as crud_case
import db.crud_user_business_unit as crud_bu
import db.crud_living_income_benchmark as crud_lib
import db.crud_user_case_access as crud_uca

from math import ceil
from fastapi import APIRouter, Request, Depends, HTTPException, Query
from fastapi.security import HTTPBearer, HTTPBasicCredentials as credentials
from sqlalchemy.orm import Session
from typing import Optional, List
from db.connection import get_session
from models.case import (
    CaseBase,
    CaseDict,
    PaginatedCaseResponse,
    CaseDetailDict,
    CaseDropdown,
)
from models.user import UserRole
from models.user_case_access import UserCaseAccessPayload, UserCaseAccessDict
from middleware import (
    verify_admin,
    verify_user,
    verify_case_owner,
    verify_case_creator,
    verify_case_editor,
    verify_case_viewer,
)

security = HTTPBearer()
case_route = APIRouter()


@case_route.post(
    "/case",
    response_model=CaseDict,
    summary="create case",
    name="case:create",
    tags=["Case"],
)
def create_case(
    req: Request,
    payload: CaseBase,
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    user = verify_case_creator(session=session, authenticated=req.state.authenticated)
    case = crud_case.add_case(session=session, payload=payload, user=user)
    return case.serialize


@case_route.get(
    "/case",
    response_model=PaginatedCaseResponse,
    summary="get all case",
    name="case:get_all",
    tags=["Case"],
)
def get_all_case(
    req: Request,
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None,
    country: Optional[int] = Query(None),
    tags: Optional[List[int]] = Query(None),
    focus_commodity: Optional[List[int]] = Query(None),
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    user = verify_user(session=session, authenticated=req.state.authenticated)

    # prevent external user which doesn't have access to cases
    user_permission = crud_uca.find_user_case_access_viewer(
        session=session, user_id=user.id
    )
    if (
        user.role == UserRole.user
        and not len(user.user_business_units)
        and not user_permission
    ):
        raise HTTPException(status_code=404, detail="Not found")

    # handle show/hide private case
    user_cases = []
    show_private = False
    if user.role in [UserRole.super_admin, UserRole.admin]:
        show_private = True
    if user.role == UserRole.user and user_permission:
        show_private = True
        user_cases = [d.case for d in user_permission]

    # handle case owner
    if user.role == UserRole.user:
        cases = crud_case.get_case_by_created_by(session=session, created_by=user.id)
        user_cases = user_cases + [c.id for c in cases]

    if user.role == UserRole.user or not user.all_cases:
        user_cases = [uc.case for uc in user.user_case_access]
    cases = crud_case.get_all_case(
        session=session,
        search=search,
        tags=tags,
        focus_commodities=focus_commodity,
        skip=(limit * (page - 1)),
        limit=limit,
        user_cases=user_cases,
        country=country,
        show_private=show_private,
    )
    if not cases:
        raise HTTPException(status_code=404, detail="Not found")
    total = cases["count"]
    cases = [case.to_case_list for case in cases["data"]]
    total_page = ceil(total / limit) if total > 0 else 0
    if total_page < page:
        raise HTTPException(status_code=404, detail="Not found")
    return {"current": page, "data": cases, "total": total, "total_page": total_page}


@case_route.get(
    "/case/options",
    response_model=List[CaseDropdown],
    summary="get case options dropdown",
    name="case:get_options",
    tags=["Case"],
)
def get_case_options(
    req: Request,
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    user = verify_admin(session=session, authenticated=req.state.authenticated)
    business_unit_users = []
    if user.role != UserRole.super_admin and user.all_cases:
        business_unit_users = crud_bu.find_users_in_same_business_unit(
            session=session,
            business_units=[bu.business_unit for bu in user.user_business_units],
        )
        if not business_unit_users:
            raise HTTPException(status_code=404, detail="Not found")
    user_cases = []
    if user.role != UserRole.super_admin or not user.all_cases:
        user_cases = [uc.case for uc in user.user_case_access]
    cases = crud_case.get_case_options(
        session=session, business_unit_users=business_unit_users, user_cases=user_cases
    )
    if not cases:
        raise HTTPException(status_code=404, detail="Not found")
    return [case.to_dropdown for case in cases]


@case_route.put(
    "/case/{case_id:path}",
    response_model=CaseDict,
    summary="update case by id",
    name="case:update",
    tags=["Case"],
)
def update_Case(
    req: Request,
    case_id: int,
    payload: CaseBase,
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    verify_case_editor(
        session=session, authenticated=req.state.authenticated, case_id=case_id
    )
    case = crud_case.update_case(session=session, id=case_id, payload=payload)
    return case.serialize


@case_route.get(
    "/case/{case_id:path}",
    response_model=CaseDetailDict,
    summary="get case by id",
    name="case:get_by_id",
    tags=["Case"],
)
def get_case_by_id(
    req: Request,
    case_id: int,
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    verify_case_viewer(
        session=session, authenticated=req.state.authenticated, case_id=case_id
    )
    case = crud_case.get_case_by_id(session=session, id=case_id)
    case = case.to_case_detail
    for segment in case["segments"]:
        benchmark = crud_lib.get_by_country_region_year(
            session=session,
            country=case["country"],
            region=segment["region"],
            year=case["year"],
        )
        segment["benchmark"] = benchmark
    return case


@case_route.post(
    "/case_access/{case_id:path}",
    response_model=List[UserCaseAccessDict],
    summary="add user access too a case",
    name="case:add_user_case_access",
    tags=["Case"],
)
def add_user_case_access(
    req: Request,
    case_id: int,
    payload: List[UserCaseAccessPayload],
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    verify_case_owner(
        session=session, authenticated=req.state.authenticated, case_id=case_id
    )
    res = crud_uca.add_case_access(session=session, payloads=payload, case_id=case_id)
    return [r.serialize for r in res]

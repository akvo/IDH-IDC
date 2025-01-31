import os
import db.crud_map as crud_map
import db.crud_user_case_access as crud_uca
import db.crud_case as crud_case

from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import Response
from fastapi.security import HTTPBearer, HTTPBasicCredentials as credentials
from sqlalchemy.orm import Session
from typing import List, Optional
from typing_extensions import TypedDict

from db.connection import get_session
from middleware import verify_user
from models.user import UserRole

security = HTTPBearer()
map_route = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MASTER_DIR = BASE_DIR + "/source/master/"


class CaseCountByCountryDict(TypedDict):
    country_id: int
    COUNTRY: str
    case_count: int
    total_farmers: int


class CaseCountByCountryCompanyDict(TypedDict):
    country_id: int
    COUNTRY: str
    case_count: int
    total_farmers: int
    company_id: Optional[int] = None
    company: Optional[str] = None


def get_user_cases_and_permissions(req: Request, session: Session):
    user = verify_user(session=session, authenticated=req.state.authenticated)

    # Prevent external users without access to cases
    user_permission = crud_uca.find_user_case_access_viewer(
        session=session, user_id=user.id
    )
    if (
        user.role == UserRole.user
        and not len(user.user_business_units)
        and not user_permission
    ):
        raise HTTPException(status_code=404, detail="Not found")

    # Handle show/hide private case
    user_cases = []
    show_private = False
    if user.role in [UserRole.super_admin, UserRole.admin]:
        show_private = True
    if user.role == UserRole.user and user_permission:
        show_private = True
        user_cases = [d.case for d in user_permission]

    # Handle regular/internal user
    if user.role == UserRole.user and len(user.user_business_units):
        # All public cases
        show_private = True
        all_public_cases = crud_case.get_case_by_private(
            session=session, private=False
        )
        user_cases = user_cases + [c.id for c in all_public_cases]

    # Handle case owner
    if user.role == UserRole.user:
        show_private = True
        cases = crud_case.get_case_by_created_by(
            session=session, created_by=user.id
        )
        user_cases = user_cases + [c.id for c in cases]

    return show_private, user_cases


@map_route.get(
    "/map/static/world_map.js",
    tags=["Map"],
)
def serve_js():
    js_content = open(f"{MASTER_DIR}/world_map.geojson").read()
    return Response(content=js_content, media_type="application/json")


@map_route.get(
    "/map/case-by-country",
    response_model=List[CaseCountByCountryDict],
    summary="Get map value for case by country",
    name="map:get_case_by_country",
    tags=["Map"],
)
def get_case_by_country(
    req: Request,
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    show_private, user_cases = get_user_cases_and_permissions(req, session)

    # Get all cases without pagination
    cases = crud_map.get_case_count_by_country(
        session=session,
        user_cases=user_cases,
        show_private=show_private,
    )

    return cases


@map_route.get(
    "/map/case-by-country-and-company",
    response_model=List[CaseCountByCountryCompanyDict],
    summary="Get map value for case by country and company",
    name="map:get_case_by_country_and_company",
    tags=["Map"],
)
def get_case_by_country_and_company(
    req: Request,
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    show_private, user_cases = get_user_cases_and_permissions(req, session)

    # Get all cases without pagination
    cases = crud_map.get_case_count_by_country_and_company(
        session=session,
        user_cases=user_cases,
        show_private=show_private,
    )

    return cases

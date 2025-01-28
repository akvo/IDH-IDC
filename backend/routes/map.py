import db.crud_view_case_count_by_country_company as crud_view
import os

from fastapi import APIRouter, Request, Depends
from fastapi.responses import Response
from fastapi.security import HTTPBearer, HTTPBasicCredentials as credentials
from sqlalchemy.orm import Session
from typing import List

from db.connection import get_session
from models.view_case_count_by_country_company import CaseCountByCountryDict
from middleware import verify_user

security = HTTPBearer()
map_route = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MASTER_DIR = BASE_DIR + "/source/master/"


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
    summary="get map value for case by country",
    name="map:get_case_by_country",
    tags=["Map"],
)
def get_case_by_country(
    req: Request,
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    verify_user(session=session, authenticated=req.state.authenticated)
    return crud_view.get_case_count_by_country(session=session)

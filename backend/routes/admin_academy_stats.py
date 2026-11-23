from typing import Optional
from fastapi import APIRouter, Depends, Query, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from db.connection import get_session
from db import crud_admin_academy_stats
from middleware import verify_admin
from models.admin_academy_stats import AcademyUserStatsResponse

security = HTTPBearer()
admin_academy_stats_router = APIRouter()


@admin_academy_stats_router.get(
    "/admin/academy-user-statistics",
    response_model=AcademyUserStatsResponse,
    summary="Get Living Income Academy user statistics and analytics",
    name="admin_academy_stats:get",
    tags=["Admin Academy Stats"],
)
def get_academy_user_statistics(
    req: Request,
    year: Optional[int] = Query(
        None, description="Filter by user registration year"
    ),
    region: Optional[str] = Query(
        None, description="Filter by region name"
    ),
    sector: Optional[str] = Query(
        None, description="Filter by sector"
    ),
    session: Session = Depends(get_session),
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    verify_admin(session=session, authenticated=req.state.authenticated)
    return crud_admin_academy_stats.get_academy_user_statistics(
        session=session, year=year, region=region, sector=sector
    )

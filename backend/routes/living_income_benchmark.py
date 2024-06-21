import db.crud_living_income_benchmark as crud_lib

from fastapi import APIRouter, Request, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session

from db.connection import get_session
from models.living_income_benchmark import LivingIncomeBenchmarkDict

security = HTTPBearer()
lib_route = APIRouter()


@lib_route.get(
    "/country_region_benchmark",
    response_model=LivingIncomeBenchmarkDict,
    summary="get living income benchmark by country, region, and year",
    name="lib:get_by_country_region_year",
    tags=["Living Income Benchmark"],
)
def get_by_country_region_year(
    req: Request,
    country_id: int,
    region_id: int,
    year: int,
    session: Session = Depends(get_session),
):
    res = crud_lib.get_by_country_region_year(
        session=session, country=country_id, region=region_id, year=year
    )
    if not res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Benchmark value not found."
        )
    return res

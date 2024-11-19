import db.crud_company as crud_company

from math import ceil
from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPBasicCredentials as credentials
from sqlalchemy.orm import Session
from typing import List, Optional

from db.connection import get_session
from models.company import (
    CompanyOption,
    CompanyDict,
    CompanyBase,
    PaginatedCompanyResponse,
)
from middleware import verify_admin

security = HTTPBearer()
company_route = APIRouter()


@company_route.post(
    "/company",
    response_model=CompanyDict,
    summary="create a company",
    name="company:create",
    tags=["Company"],
)
def create_company(
    req: Request,
    payload: CompanyBase,
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    verify_admin(session=session, authenticated=req.state.authenticated)
    company = crud_company.add_company(session=session, payload=payload)
    return company.serialize


@company_route.get(
    "/company/options",
    response_model=List[CompanyOption],
    summary="get company options",
    name="company:get_options",
    tags=["Company"],
)
def get_company_options(
    req: Request,
    session: Session = Depends(get_session),
):
    companies = crud_company.get_all_company(session=session)
    return [company.to_option for company in companies]


@company_route.get(
    "/company",
    response_model=PaginatedCompanyResponse,
    summary="get all comapany",
    name="company:get_all",
    tags=["Company"],
)
def get_all_company(
    req: Request,
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None,
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    verify_admin(session=session, authenticated=req.state.authenticated)

    companies = crud_company.filter_company(
        session=session,
        search=search,
        skip=(limit * (page - 1)),
        limit=limit,
    )
    if not companies:
        raise HTTPException(status_code=404, detail="Not found")
    total = companies["count"]
    companies = [company.serialize for company in companies["data"]]
    total_page = ceil(total / limit) if total > 0 else 0
    if total_page < page:
        raise HTTPException(status_code=404, detail="Not found")
    return {
        "current": page,
        "data": companies,
        "total": total,
        "total_page": total_page,
    }

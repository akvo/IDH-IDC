from typing import List, Optional
from typing_extensions import TypedDict
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from models.company import (
    Company,
    CompanyDict,
    CompanyBase,
)
from models.user import User


class PaginatedCompanyData(TypedDict):
    count: int
    data: List[CompanyDict]


def add_company(
    session: Session,
    payload: CompanyBase,
) -> CompanyDict:
    company = Company(id=payload.id, name=payload.name)
    session.add(company)
    session.commit()
    session.flush()
    session.refresh(company)
    return company


def get_company_by_name(session: Session, name: str) -> Company:
    return (
        session.query(Company)
        .filter(Company.name.ilike("%{}%".format(name.lower().strip())))
        .first()
    )


def get_company_by_id(session: Session, id: int) -> CompanyDict:
    company = session.query(Company).filter(Company.id == id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Company {id} not found",
        )
    return company


def get_all_company(session: Session):
    return session.query(Company).all()


def filter_company(
    session: Session,
    skip: int = 0,
    limit: int = 10,
    search: Optional[str] = None,
) -> List[CompanyDict]:
    companies = session.query(Company)
    if search:
        companies = companies.filter(
            Company.name.ilike("%{}%".format(search.lower().strip()))
        )
    count = companies.count()
    companies = (
        companies.order_by(Company.id.desc()).offset(skip).limit(limit).all()
    )
    return PaginatedCompanyData(count=count, data=companies)


def update_company(
    session: Session, company_id: int, payload: CompanyBase
) -> CompanyDict:
    company = get_company_by_id(session=session, id=company_id)
    company.name = payload.name
    session.commit()
    session.flush()
    session.refresh(company)
    return company


def delete_company(session: Session, company_id: int):
    company = get_company_by_id(session=session, id=company_id)

    # check if users in company
    # TODO :: query user by company
    users = session.query(User).all()
    if users:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Company {id} has users",
        )

    session.delete(company)
    session.commit()
    session.flush()
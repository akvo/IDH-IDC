from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from models.company import Company, CompanyDict


def add_Company(
    session: Session,
    name: str,
    id: Optional[int] = None,
) -> CompanyDict:
    company = Company(id=id, name=name)
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


def get_all_company(session: Session) -> List[CompanyDict]:
    return session.query(Company).all()

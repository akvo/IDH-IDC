from db.connection import Base
from sqlalchemy import Column, Integer, String

from sqlalchemy.orm import relationship
from typing import Optional, List
from typing_extensions import TypedDict
from pydantic import BaseModel


class CompanyDict(TypedDict):
    id: int
    name: str
    count_users: int
    count_cases: int


class CompanyOption(TypedDict):
    label: str
    value: int
    count_users: int


class CompanyHavingCaseOption(TypedDict):
    label: str
    value: int
    case_count: int


class Company(Base):
    __tablename__ = "company"

    id = Column(Integer, primary_key=True, nullable=False)
    name = Column(String, nullable=False)

    user_company_detail = relationship(
        "User",
        cascade="all, delete",
        passive_deletes=True,
        back_populates="user_company",
    )

    def __init__(self, id: Optional[int], name: str):
        self.id = id
        self.name = name

    def __repr__(self) -> int:
        return f"<Company {self.id}>"

    @property
    def serialize(self) -> CompanyDict:
        return {
            "id": self.id,
            "name": self.name,
            "count_users": len(self.user_company_detail) or 0,
            "count_cases": len(self.company_cases) or 0,
        }

    @property
    def to_option(self) -> CompanyOption:
        return {
            "label": self.name,
            "value": self.id,
            "count_users": len(self.user_company_detail) or 0,
        }


class CompanyBase(BaseModel):
    name: str
    id: Optional[int] = None


class PaginatedCompanyResponse(BaseModel):
    current: int
    data: List[CompanyDict]
    total: int
    total_page: int

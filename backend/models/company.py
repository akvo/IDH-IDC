from db.connection import Base
from sqlalchemy import Column, Integer, String

# from sqlalchemy.orm import relationship
from typing import Optional, List
from typing_extensions import TypedDict
from pydantic import BaseModel


class CompanyDict(TypedDict):
    id: int
    name: str


class CompanyOption(TypedDict):
    label: str
    value: int


class Company(Base):
    __tablename__ = "company"

    id = Column(Integer, primary_key=True, nullable=False)
    name = Column(String, nullable=False)

    # user_company_detail = relationship(
    #     "User",
    #     cascade="all, delete",
    #     passive_deletes=True,
    #     back_populates="user_companies",
    # )

    def __init__(self, id: Optional[int], name: str):
        self.id = id
        self.name = name

    def __repr__(self) -> int:
        return f"<Company {self.id}>"

    @property
    def serialize(self) -> CompanyDict:
        return {"id": self.id, "name": self.name}

    @property
    def to_option(self) -> CompanyOption:
        return {
            "label": self.name,
            "value": self.id,
        }


class CompanyBase(BaseModel):
    name: str
    id: Optional[int] = None


class PaginatedCompanyResponse(BaseModel):
    current: int
    data: List[CompanyDict]
    total: int
    total_page: int

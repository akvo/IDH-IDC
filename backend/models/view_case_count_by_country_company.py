from sqlalchemy import Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from typing_extensions import TypedDict

Base = declarative_base()


class CaseCountByCountryDict(TypedDict):
    country_id: int
    COUNTRY: str
    case_count: int
    total_farmers: int


class CaseCountByCompanyAndCountry(Base):
    __tablename__ = "case_count_by_company_and_country"

    # Virtual primary key
    id = Column(Integer, primary_key=True, autoincrement=True)

    country_id = Column(Integer)
    country = Column(String)
    company_id = Column(Integer)
    company = Column(String)
    case_count = Column(Integer)
    total_farmers = Column(Integer)

    def __init__(
        self,
        id: int,
        country_id: int,
        country: str,
        company_id: int,
        company: str,
        case_count: int,
        total_farmers: int,
    ):
        self.id = id
        self.country_id = country_id
        self.country = country
        self.company_id = company_id
        self.company = company
        self.case_count = case_count
        self.total_farmers = total_farmers

    def __repr__(self) -> int:
        return f"<CaseCountByCompanyAndCountry {self.id}>"

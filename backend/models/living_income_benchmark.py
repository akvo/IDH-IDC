from db.connection import Base
from sqlalchemy import Column, Integer, Float, ForeignKey, String
from typing import Optional
from typing_extensions import TypedDict
from pydantic import BaseModel
from models.country import Country
from models.region import Region


class LivingIncomeBenchmarkValue(TypedDict):
    lcu: float
    usd: float
    eur: float


class LivingIncomeBenchmarkDict(TypedDict):
    id: int
    country: int
    region: int
    household_size: float
    year: int
    value: LivingIncomeBenchmarkValue
    case_year_cpi: Optional[float]
    last_year_cpi: Optional[float]
    cpi_factor: Optional[float]


class LivingIncomeBenchmark(Base):
    __tablename__ = "living_income_benchmark"

    id = Column(Integer, primary_key=True, nullable=False)
    country = Column(Integer, ForeignKey(Country.id))
    region = Column(Integer, ForeignKey(Region.id))
    household_size = Column(Float, nullable=False)
    year = Column(Integer, nullable=False)
    source = Column(String, nullable=True)
    lcu = Column(Float, nullable=False)
    usd = Column(Float, nullable=False)
    eur = Column(Float, nullable=False)

    def __init__(
        self,
        country: int,
        region: int,
        year: int,
        household_size: float,
        lcu: float,
        usd: float,
        eur: float,
        id: Optional[int] = None,
        source: Optional[str] = None,
    ):
        self.id = id
        self.country = country
        self.region = region
        self.year = year
        self.household_size = household_size
        self.source = source
        self.lcu = lcu
        self.usd = usd
        self.eur = eur

    def __repr__(self) -> int:
        return f"<LivingIncomeBenchmark {self.id}>"

    @property
    def serialize(self) -> LivingIncomeBenchmarkDict:
        return {
            "id": self.id,
            "country": self.country,
            "region": self.region,
            "year": self.year,
            "household_size": self.household_size,
            "value": {
                "lcu": self.lcu,
                "usd": self.usd,
                "eur": self.eur,
            },
            "case_year_cpi": None,
            "last_year_cpi": None,
        }


class LivingIncomeBenchmarkBase(BaseModel):
    id: int
    country: int
    region: int
    year: int
    household_size: float
    lcu: float
    usd: float
    eur: float
    source: Optional[str]

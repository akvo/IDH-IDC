from db.connection import Base
from sqlalchemy import Column, Integer, Float, ForeignKey, String
from typing import Optional
from typing_extensions import TypedDict
from pydantic import BaseModel
from models.country import Country
from models.region import Region


class MapLIBDict(TypedDict):
    country_id: int
    COUNTRY: str
    count: int


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
    nr_adults: Optional[int]
    household_equiv: Optional[float]
    source: Optional[str]
    links: Optional[str]
    value: LivingIncomeBenchmarkValue
    case_year_cpi: Optional[float]
    last_year_cpi: Optional[float]
    cpi_factor: Optional[float]
    message: Optional[str] = None


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
    nr_adults = Column(Integer, nullable=True)
    household_equiv = Column(Float, nullable=True)
    links = Column(String, nullable=True)

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
        nr_adults: Optional[int] = None,
        household_equiv: Optional[float] = None,
        links: Optional[str] = None,
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
        self.nr_adults = nr_adults
        self.household_equiv = household_equiv
        self.links = links

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
            "nr_adults": self.nr_adults,
            "household_equiv": self.household_equiv,
            "source": self.source,
            "links": self.links,
            "value": {
                "lcu": self.lcu,
                "usd": self.usd,
                "eur": self.eur,
            },
            "case_year_cpi": None,
            "last_year_cpi": None,
            "cpi_factor": None,
            "message": None,
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
    nr_adults: Optional[int] = None
    household_equiv: Optional[float] = None
    links: Optional[str] = None

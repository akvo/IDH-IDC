import enum
from db.connection import Base
from sqlalchemy import (
    Column,
    Integer,
    Float,
    String,
    ForeignKey,
    DateTime,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from typing import Optional, List
from typing_extensions import TypedDict
from pydantic import BaseModel


class Driver(enum.Enum):
    area = "area"
    volume = "volume"
    price = "price"
    cost_of_production = "cost_of_production"
    diversified_income = "diversified_income"


class ReferenceDataDict(TypedDict):
    id: int
    country: int
    commodity: int
    region: str
    currency: str
    year: int
    source: str
    link: str
    notes: Optional[str]
    confidence_level: Optional[str]
    range: Optional[str]
    type: Optional[str]
    area: Optional[float]
    volume: Optional[float]
    price: Optional[float]
    cost_of_production: Optional[float]
    diversified_income: Optional[float]
    area_size_unit: Optional[str]
    volume_measurement_unit: Optional[str]
    cost_of_production_unit: Optional[str]
    diversified_income_unit: Optional[str]


class ReferenceDataList(TypedDict):
    id: int
    country: str
    commodity: str
    source: str
    link: str
    confidence_level: Optional[str]


class ReferenceValueList(TypedDict):
    id: int
    source: str
    link: str
    value: Optional[float]
    unit: Optional[str]


class ReferenceData(Base):
    __tablename__ = "reference_data"

    id = Column(Integer, primary_key=True, index=True)
    country = Column(Integer, ForeignKey("country.id"))
    commodity = Column(Integer, ForeignKey("commodity.id"))
    region = Column(String, nullable=True)
    currency = Column(String, nullable=True)
    year = Column(Integer, nullable=True)
    source = Column(String, nullable=True)
    link = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    confidence_level = Column(String, nullable=True)
    range = Column(String, nullable=True)
    type = Column(String, nullable=True)
    area = Column(Float, nullable=True)
    volume = Column(Float, nullable=True)
    price = Column(Float, nullable=True)
    cost_of_production = Column(
        Float,
        nullable=True,
    )
    diversified_income = Column(Float, nullable=True)
    area_size_unit = Column(String, nullable=True)
    volume_measurement_unit = Column(String, nullable=True)
    cost_of_production_unit = Column(String, nullable=True)
    diversified_income_unit = Column(String, nullable=True)
    created_by = Column(Integer, ForeignKey("user.id"))
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    country_detail = relationship(
        "Country",
        cascade="all, delete",
        passive_deletes=True,
        backref="country_reference_data",
    )
    commodity_detail = relationship(
        "Commodity",
        cascade="all, delete",
        passive_deletes=True,
        backref="commodity_reference_data",
    )

    def __init__(
        self,
        country: int,
        commodity: int,
        region: str,
        currency: str,
        year: int,
        source: str,
        link: str,
        notes: Optional[str],
        confidence_level: Optional[str],
        range: Optional[str],
        type: Optional[str],
        area: Optional[float],
        volume: Optional[float],
        price: Optional[float],
        cost_of_production: Optional[float],
        diversified_income: Optional[float],
        area_size_unit: Optional[str],
        volume_measurement_unit: Optional[str],
        cost_of_production_unit: Optional[str],
        diversified_income_unit: Optional[str],
        created_by: Optional[str],
        id: Optional[int] = None,
    ):
        self.id = id
        self.country = country
        self.commodity = commodity
        self.region = region
        self.currency = currency
        self.year = year
        self.source = source
        self.link = link
        self.notes = notes
        self.confidence_level = confidence_level
        self.range = range
        self.type = type
        self.area = area
        self.volume = volume
        self.price = price
        self.cost_of_production = cost_of_production
        self.diversified_income = diversified_income
        self.area_size_unit = area_size_unit
        self.volume_measurement_unit = volume_measurement_unit
        self.cost_of_production_unit = cost_of_production_unit
        self.diversified_income_unit = diversified_income_unit
        self.created_by = created_by

    def __repr__(self) -> int:
        return f"<ReferenceData {self.id}>"

    @property
    def serialize(self) -> ReferenceDataDict:
        return {
            "id": self.id,
            "country": self.country,
            "commodity": self.commodity,
            "region": self.region,
            "currency": self.currency,
            "year": self.year,
            "source": self.source,
            "link": self.link,
            "notes": self.notes,
            "confidence_level": self.confidence_level,
            "range": self.range,
            "type": self.type,
            "area": self.area,
            "volume": self.volume,
            "price": self.price,
            "cost_of_production": self.cost_of_production,
            "diversified_income": self.diversified_income,
            "area_size_unit": self.area_size_unit,
            "volume_measurement_unit": self.volume_measurement_unit,
            "cost_of_production_unit": self.cost_of_production_unit,
            "diversified_income_unit": self.diversified_income_unit,
        }

    @property
    def to_data_list(self) -> ReferenceDataList:
        return {
            "id": self.id,
            "country": self.country_detail.name,
            "commodity": self.commodity_detail.name,
            "source": self.source,
            "link": self.link,
            "confidence_level": self.confidence_level,
        }


class ReferenceDataBase(BaseModel):
    country: int
    commodity: int
    region: str
    currency: str
    year: int
    source: str
    link: str
    id: Optional[int] = None
    notes: Optional[str] = None
    confidence_level: Optional[str] = None
    range: Optional[str] = None
    type: Optional[str] = None
    area: Optional[float] = None
    volume: Optional[float] = None
    price: Optional[float] = None
    cost_of_production: Optional[float] = None
    diversified_income: Optional[float] = None
    area_size_unit: Optional[str] = None
    volume_measurement_unit: Optional[str] = None
    cost_of_production_unit: Optional[str] = None
    diversified_income_unit: Optional[str] = None


class PaginatedReferenceDataResponse(BaseModel):
    current: int
    data: List[ReferenceDataList]
    total: int
    total_page: int

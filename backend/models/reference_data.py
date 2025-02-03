import enum
from db.connection import Base
from sqlalchemy import (
    Column,
    Integer,
    Text,
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
    region: Optional[str]
    currency: Optional[str]
    year: Optional[str]
    source: Optional[str]
    link: Optional[str]
    notes: Optional[str]
    confidence_level: Optional[str]
    range: Optional[str]
    area: Optional[str]
    volume: Optional[str]
    price: Optional[str]
    cost_of_production: Optional[str]
    diversified_income: Optional[str]
    area_size_unit: Optional[str]
    volume_measurement_unit: Optional[str]
    cost_of_production_unit: Optional[str]
    diversified_income_unit: Optional[str]
    price_unit: Optional[str]
    type_area: Optional[str]
    type_volume: Optional[str]
    type_price: Optional[str]
    type_cost_of_production: Optional[str]
    type_diversified_income: Optional[str]


class ReferenceDataList(TypedDict):
    id: int
    country: str
    commodity: str
    source: Optional[str]
    link: Optional[str]
    confidence_level: Optional[str]


class ReferenceValueList(TypedDict):
    id: int
    source: Optional[str]
    link: Optional[str]
    value: Optional[str]
    unit: Optional[str]
    region: Optional[str]
    year: Optional[str]
    confidence_level: Optional[str]
    type: Optional[str]


class ReferenceCountByCountryDict(TypedDict):
    country_id: int
    COUNTRY: str
    count: int


class ReferenceData(Base):
    __tablename__ = "reference_data"

    id = Column(Integer, primary_key=True, index=True)
    country = Column(Integer, ForeignKey("country.id"))
    commodity = Column(Integer, ForeignKey("commodity.id"))
    region = Column(String, nullable=True)
    currency = Column(String, nullable=True)
    year = Column(String, nullable=True)
    source = Column(String, nullable=True)
    link = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    confidence_level = Column(String, nullable=True)
    range = Column(String, nullable=True)
    area = Column(String, nullable=True)
    volume = Column(String, nullable=True)
    price = Column(String, nullable=True)
    cost_of_production = Column(
        String,
        nullable=True,
    )
    diversified_income = Column(String, nullable=True)
    area_size_unit = Column(String, nullable=True)
    volume_measurement_unit = Column(String, nullable=True)
    cost_of_production_unit = Column(String, nullable=True)
    diversified_income_unit = Column(String, nullable=True)
    price_unit = Column(String, nullable=True)
    type_area = Column(String, nullable=True)
    type_volume = Column(String, nullable=True)
    type_price = Column(String, nullable=True)
    type_cost_of_production = Column(String, nullable=True)
    type_diversified_income = Column(String, nullable=True)

    created_by = Column(Integer, ForeignKey("user.id"), nullable=True)
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
        year: str,
        source: str,
        link: str,
        notes: Optional[str] = None,
        confidence_level: Optional[str] = None,
        range: Optional[str] = None,
        area: Optional[str] = None,
        volume: Optional[str] = None,
        price: Optional[str] = None,
        cost_of_production: Optional[str] = None,
        diversified_income: Optional[str] = None,
        area_size_unit: Optional[str] = None,
        volume_measurement_unit: Optional[str] = None,
        cost_of_production_unit: Optional[str] = None,
        diversified_income_unit: Optional[str] = None,
        price_unit: Optional[str] = None,
        type_area: Optional[str] = None,
        type_volume: Optional[str] = None,
        type_price: Optional[str] = None,
        type_cost_of_production: Optional[str] = None,
        type_diversified_income: Optional[str] = None,
        created_by: Optional[int] = None,
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
        self.area = area
        self.volume = volume
        self.price = price
        self.cost_of_production = cost_of_production
        self.diversified_income = diversified_income
        self.area_size_unit = area_size_unit
        self.volume_measurement_unit = volume_measurement_unit
        self.cost_of_production_unit = cost_of_production_unit
        self.diversified_income_unit = diversified_income_unit
        self.price_unit = price_unit
        self.type_area = type_area
        self.type_volume = type_volume
        self.type_price = type_price
        self.type_cost_of_production = type_cost_of_production
        self.type_diversified_income = type_diversified_income
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
            "area": self.area,
            "volume": self.volume,
            "price": self.price,
            "cost_of_production": self.cost_of_production,
            "diversified_income": self.diversified_income,
            "area_size_unit": self.area_size_unit,
            "volume_measurement_unit": self.volume_measurement_unit,
            "cost_of_production_unit": self.cost_of_production_unit,
            "diversified_income_unit": self.diversified_income_unit,
            "price_unit": self.price_unit,
            "type_area": self.type_area,
            "type_volume": self.type_volume,
            "type_price": self.type_price,
            "type_cost_of_production": self.type_cost_of_production,
            "type_diversified_income": self.type_diversified_income,
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
    year: str
    source: str
    link: str
    id: Optional[int] = None
    notes: Optional[str] = None
    confidence_level: Optional[str] = None
    range: Optional[str] = None
    area: Optional[str] = None
    volume: Optional[str] = None
    price: Optional[str] = None
    cost_of_production: Optional[str] = None
    diversified_income: Optional[str] = None
    area_size_unit: Optional[str] = None
    volume_measurement_unit: Optional[str] = None
    cost_of_production_unit: Optional[str] = None
    diversified_income_unit: Optional[str] = None
    price_unit: Optional[str] = None
    type_area: Optional[str] = None
    type_volume: Optional[str] = None
    type_price: Optional[str] = None
    type_cost_of_production: Optional[str] = None
    type_diversified_income: Optional[str] = None


class PaginatedReferenceDataResponse(BaseModel):
    current: int
    data: List[ReferenceDataList]
    total: int
    total_page: int

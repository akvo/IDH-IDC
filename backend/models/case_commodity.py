import enum
from db.connection import Base
from sqlalchemy import Column, Integer, SmallInteger, ForeignKey, String, Enum
from sqlalchemy.orm import relationship
from typing import Optional
from pydantic import BaseModel
from typing_extensions import TypedDict


class CaseCommodityType(enum.Enum):
    focus = "focus"
    secondary = "secondary"
    tertiary = "tertiary"
    diversified = "diversified"


class SimplifiedCaseCommodityDict(TypedDict):
    id: int
    commodity: Optional[int]
    breakdown: bool
    commodity_type: CaseCommodityType
    area_size_unit: Optional[str] = None
    volume_measurement_unit: Optional[str] = None


class CaseCommodity(Base):
    __tablename__ = "case_commodity"

    id = Column(Integer, primary_key=True, nullable=False)
    case = Column(Integer, ForeignKey("case.id"), nullable=True)
    commodity = Column(Integer, ForeignKey("commodity.id"))
    breakdown = Column(SmallInteger, nullable=False, default=0)
    commodity_type = Column(
        Enum(CaseCommodityType, name="case_commodity_type"),
        nullable=False,
    )
    area_size_unit = Column(String, nullable=True)
    volume_measurement_unit = Column(String, nullable=True)

    case_detail = relationship(
        "Case",
        cascade="all, delete",
        passive_deletes=True,
        back_populates="case_commodities",
    )

    def __init__(
        self,
        commodity_type: CaseCommodityType,
        case: Optional[int] = None,
        id: Optional[int] = None,
        area_size_unit: Optional[str] = None,
        volume_measurement_unit: Optional[str] = None,
        commodity: Optional[int] = None,
        breakdown: Optional[int] = 0,
    ):
        self.id = id
        self.case = case
        self.commodity = commodity
        self.breakdown = breakdown
        self.commodity_type = commodity_type
        self.area_size_unit = area_size_unit
        self.volume_measurement_unit = volume_measurement_unit

    def __repr__(self) -> int:
        return f"<CaseCommodity {self.id}>"

    @property
    def simplify(self):
        return {
            "id": self.id,
            "commodity": self.commodity,
            "breakdown": self.breakdown,
            "commodity_type": self.commodity_type,
            "area_size_unit": self.area_size_unit,
            "volume_measurement_unit": self.volume_measurement_unit,
        }


class CaseCommodityBase(BaseModel):
    id: int
    case: int
    commodity: Optional[int]
    commodity_type: CaseCommodityType
    breakdown: Optional[int] = 0
    area_size_unit: Optional[str] = None
    volume_measurement_unit: Optional[str] = None

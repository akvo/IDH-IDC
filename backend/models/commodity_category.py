from db.connection import Base
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from typing import Optional, List
from typing_extensions import TypedDict
from pydantic import BaseModel
from models.commodity import Commodity, SimplifiedCommodityDict
from models.commodity_category_question import CommodityCategoryQuestion


class CommodityCategoryDict(TypedDict):
    id: int
    name: str


class CommodityCategoryWithChildDict(TypedDict):
    id: int
    name: str
    commodities: Optional[List[SimplifiedCommodityDict]]


class CommodityCategory(Base):
    __tablename__ = "commodity_category"

    id = Column(Integer, primary_key=True, nullable=False)
    name = Column(String, nullable=False, unique=True)

    commodities = relationship(
        Commodity,
        cascade="all, delete",
        passive_deletes=True,
        back_populates="commodity_category_detail",
    )
    commodity_category_questions = relationship(
        "Question",
        secondary=CommodityCategoryQuestion.__tablename__,
        cascade="all, delete",
        passive_deletes=True,
        back_populates="question_commodity_category_detail",
    )

    def __init__(self, name: str, id: Optional[int] = None):
        self.id = id
        self.name = name

    def __repr__(self) -> int:
        return f"<CommodityCategory {self.id}>"

    @property
    def serialize(self) -> CommodityCategoryDict:
        return {
            "id": self.id,
            "name": self.name,
        }

    @property
    def serialize_with_commodities(self) -> CommodityCategoryWithChildDict:
        return {
            "id": self.id,
            "name": self.name,
            "commodities": [c.simplify for c in self.commodities],
        }


class CommodityCategoryBase(BaseModel):
    id: int
    name: str

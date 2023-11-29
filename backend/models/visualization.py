import enum
from db.connection import Base
from typing import Optional
from typing_extensions import TypedDict
from pydantic import BaseModel
from sqlalchemy import Column, Integer, Enum, ForeignKey
import sqlalchemy.dialects.postgresql as pg
from sqlalchemy.orm import relationship


class VisualizationTab(enum.Enum):
    sensitivity_analysis = "sensitivity_analysis"
    scenario_modeling = "scenario_modeling"


class VisualizationDict(TypedDict):
    id: int
    case: int
    tab: VisualizationTab
    config: dict


class Visualization(Base):
    __tablename__ = "visualization"

    id = Column(Integer, primary_key=True, index=True, nullable=True)
    case = Column(Integer, ForeignKey("case.id"))
    tab = Column(
        Enum(VisualizationTab, name="visualization_tab"),
        default=VisualizationTab.sensitivity_analysis,
    )
    config = Column(pg.JSONB, nullable=False)

    case_detail = relationship(
        "Case",
        cascade="all, delete",
        passive_deletes=True,
        backref="case_visualization",
    )

    def __init__(
        self,
        case: int,
        tab: VisualizationTab,
        config: dict,
        id: Optional[int] = None,
    ):
        self.id = id
        self.case = case
        self.tab = tab
        self.config = config

    def __repr__(self) -> int:
        return f"<Visualization {self.id}>"

    @property
    def serialize(self) -> VisualizationDict:
        return {
            "id": self.id,
            "case": self.case,
            "tab": self.tab,
            "config": self.config,
        }


class VisualizationBase(BaseModel):
    case: int
    tab: VisualizationTab
    config: dict
    id: Optional[int] = None

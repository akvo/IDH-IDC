from typing_extensions import TypedDict
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from enum import Enum
from sqlalchemy import (
    Column,
    Integer,
    Text,
    ForeignKey,
    String,
    DateTime,
)
from sqlalchemy.sql import func
from db.connection import Base
from sqlalchemy.orm import relationship
from models.procurement_library.procurement_process import ProcurementProcess
from models.procurement_library.practice_indicator_score import (
    PracticeIndicatorScore,
)


class ImpactArea(str, Enum):
    income = "income_impact"
    env = "environmental_impact"


class PracticeListDict(BaseModel):
    id: int
    procurement_process_label: str
    label: str
    is_environmental: bool
    is_income: bool
    total_score: Optional[float] = None
    scores: Optional[List[str]] = []
    created_at: datetime


class PracticeDict(TypedDict):
    id: int
    procurement_process_label: str
    label: str
    intervention_definition: str
    enabling_conditions: str
    business_rationale: str
    farmer_rationale: str
    risks_n_trade_offs: str
    intervention_impact_income: str
    intervention_impact_env: str
    source_or_evidence: str
    created_at: datetime


class Practice(Base):
    __tablename__ = "pl_practice"

    id = Column(Integer, primary_key=True, autoincrement=True)
    procurement_process_id = Column(
        Integer,
        ForeignKey("pl_procurement_process.id")
    )
    label = Column(String(225), nullable=False)
    intervention_definition = Column(Text, nullable=True)
    enabling_conditions = Column(Text, nullable=True)
    business_rationale = Column(Text, nullable=True)
    farmer_rationale = Column(Text, nullable=True)
    risks_n_trade_offs = Column(Text, nullable=True)
    intervention_impact_income = Column(Text, nullable=True)
    intervention_impact_env = Column(Text, nullable=True)
    source_or_evidence = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    procurement_process = relationship(
        ProcurementProcess,
        foreign_keys=[procurement_process_id],
        cascade="all, delete",
        passive_deletes=True,
        backref="practices",
    )

    scores = relationship(
        PracticeIndicatorScore,
        foreign_keys=[PracticeIndicatorScore.practice_id],
        cascade="all, delete",
        passive_deletes=True,
        backref="practice_scores",
        overlaps="practice_scores,practice",
    )

    def __repr__(self):
        return f"<Practice(id={self.id}, label={self.label}>"

    @property
    def serialize(self) -> PracticeDict:
        return {
            "id": self.id,
            "procurement_process_label": self.procurement_process.label,
            "label": self.label,
            "intervention_definition": self.intervention_definition,
            "enabling_conditions": self.enabling_conditions,
            "business_rationale": self.business_rationale,
            "farmer_rationale": self.farmer_rationale,
            "risks_n_trade_offs": self.risks_n_trade_offs,
            "intervention_impact_income": self.intervention_impact_income,
            "intervention_impact_env": self.intervention_impact_env,
            "source_or_evidence": self.source_or_evidence,
            "created_at": self.created_at,
        }

    @property
    def is_environmental(self) -> bool:
        for score in self.scores:
            if score.indicator.name == "environmental_impact":
                return score.score > 3
        return False

    @property
    def is_income(self) -> bool:
        for score in self.scores:
            if score.indicator.name == "income_impact":
                return score.score > 3
        return False

    @property
    def to_list_dict(self) -> PracticeListDict:
        is_environmental = self.is_environmental
        is_income = self.is_income
        return {
            "id": self.id,
            "procurement_process_label": self.procurement_process.label,
            "label": self.label,
            "is_environmental": is_environmental,
            "is_income": is_income,
            "created_at": self.created_at,
        }


class PaginatedPracticeResponse(BaseModel):
    current: int
    data: List[PracticeListDict]
    total: int
    total_page: int

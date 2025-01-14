from db.connection import Base
from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from typing import Optional, List
from typing_extensions import TypedDict
from pydantic import BaseModel
from models.segment_answer import SegmentAnswerBase
from models.living_income_benchmark import LivingIncomeBenchmarkDict


class SegmentDict(TypedDict):
    id: int
    case: int
    name: str
    region: Optional[int]
    target: Optional[float]
    adult: Optional[float]
    child: Optional[float]


class SimplifiedSegmentDict(TypedDict):
    id: int
    name: str
    region: Optional[int]
    target: Optional[float]
    adult: Optional[float]
    child: Optional[float]


class SegmentWithAnswersDict(TypedDict):
    id: int
    case: int
    name: str
    region: Optional[int]
    target: Optional[float]
    adult: Optional[float]
    child: Optional[float]
    answers: Optional[dict]
    benchmark: Optional[LivingIncomeBenchmarkDict]


class Segment(Base):
    __tablename__ = "segment"

    id = Column(Integer, primary_key=True, nullable=False)
    case = Column(Integer, ForeignKey("case.id"))
    region = Column(Integer, ForeignKey("region.id"), nullable=True)
    name = Column(String, nullable=False)
    target = Column(Float, nullable=True)
    adult = Column(Float, nullable=True)
    child = Column(Float, nullable=True)

    case_detail = relationship(
        "Case",
        cascade="all, delete",
        passive_deletes=True,
        back_populates="case_segments",
    )
    segment_answers = relationship(
        "SegmentAnswer",
        cascade="all, delete",
        passive_deletes=True,
        backref="segment_detail",
    )

    def __init__(
        self,
        name: str,
        case: Optional[int] = None,
        region: Optional[int] = None,
        target: Optional[float] = None,
        adult: Optional[float] = None,
        child: Optional[float] = None,
        id: Optional[int] = None,
    ):
        self.id = id
        self.case = case
        self.region = region
        self.name = name
        self.target = target
        self.adult = adult
        self.child = child

    def __repr__(self) -> int:
        return f"<Segment {self.id}>"

    @property
    def serialize(self) -> SegmentDict:
        return {
            "id": self.id,
            "case": self.case,
            "region": self.region,
            "name": self.name,
            "target": self.target,
            "adult": self.adult,
            "child": self.child,
        }

    @property
    def simplify(self) -> SimplifiedSegmentDict:
        return {
            "id": self.id,
            "region": self.region,
            "name": self.name,
            "target": self.target,
            "adult": self.adult,
            "child": self.child,
        }

    @property
    def serialize_with_answers(self) -> SegmentWithAnswersDict:
        answers = {}
        for sa in self.segment_answers:
            case_commodity = sa.case_commodity
            current_key = f"current-{case_commodity}-{sa.question}"
            feasible_key = f"feasible-{case_commodity}-{sa.question}"
            answers[current_key] = sa.current_value
            answers[feasible_key] = sa.feasible_value
        return {
            "id": self.id,
            "case": self.case,
            "region": self.region,
            "name": self.name,
            "target": self.target,
            "adult": self.adult,
            "child": self.child,
            "answers": answers,
            "benchmark": None,
        }


class SegmentBase(BaseModel):
    name: str
    case: int
    region: Optional[int] = None
    target: Optional[float] = None
    adult: Optional[float] = None
    child: Optional[float] = None
    answers: Optional[List[SegmentAnswerBase]] = []


class SegmentUpdateBase(BaseModel):
    id: int
    name: str
    case: int
    region: Optional[int] = None
    target: Optional[float] = None
    adult: Optional[float] = None
    child: Optional[float] = None
    answers: Optional[List[SegmentAnswerBase]] = []


class CaseSettingSegmentPayload(BaseModel):
    name: str
    number_of_farmers: int
    id: Optional[int] = None

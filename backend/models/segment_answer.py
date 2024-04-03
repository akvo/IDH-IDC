from db.connection import Base
from sqlalchemy import Column, Integer, Float, ForeignKey
from sqlalchemy.orm import relationship
from typing import Optional
from typing_extensions import TypedDict
from pydantic import BaseModel
from models.question import Question


class SegmentAnswerDict(TypedDict):
    id: int
    case_commodity: int
    segment: int
    question: int
    current_value: float
    feasible_value: Optional[float]


class SegmentAnswer(Base):
    __tablename__ = "segment_answer"

    id = Column(Integer, primary_key=True, nullable=False)
    case_commodity = Column(Integer, ForeignKey("case_commodity.id"))
    segment = Column(Integer, ForeignKey("segment.id"))
    question = Column(Integer, ForeignKey("question.id"))
    current_value = Column(Float, nullable=False)
    feasible_value = Column(Float, nullable=True)

    case_commodity_detail = relationship(
        "CaseCommodity",
        cascade="all, delete",
        passive_deletes=True,
        backref="case_commodity_segment_answer",
    )
    question_detail = relationship(
        Question,
        cascade="all, delete",
        passive_deletes=True,
        backref="question_segment_answer",
    )

    def __init__(
        self,
        case_commodity: int,
        question: int,
        segment: Optional[int] = None,
        current_value: Optional[float] = None,
        feasible_value: Optional[float] = None,
        id: Optional[int] = None,
    ):
        self.id = id
        self.case_commodity = case_commodity
        self.segment = segment
        self.question = question
        self.current_value = current_value
        self.feasible_value = feasible_value

    def __repr__(self) -> int:
        return f"<SegmentAnswer {self.id}>"

    @property
    def serialize(self) -> SegmentAnswerDict:
        return {
            "id": self.id,
            "case_commodity": self.case_commodity,
            "segment": self.segment,
            "question": self.question,
            "current_value": self.current_value,
            "feasible_value": self.feasible_value,
        }


class SegmentAnswerBase(BaseModel):
    case_commodity: int
    question: int
    segment: Optional[int] = None
    current_value: Optional[float] = None
    feasible_value: Optional[float] = None

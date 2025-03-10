from datetime import datetime
from typing_extensions import TypedDict
from sqlalchemy import (
    Column,
    Integer,
    ForeignKey,
    DateTime,
    String,
)
from pydantic import BaseModel
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from db.connection import Base
from models.procurement_library.practice_indicator import PracticeIndicator


class SelectedOption(BaseModel):
    question_id: int
    indicator_id: int


class OptionDict(TypedDict):
    id: int
    question_id: int
    indicator_id: int
    label: str
    name: str
    description: str
    created_at: datetime


class AssessmentQuestionOption(Base):
    __tablename__ = "pl_assessment_question_option"

    id = Column(Integer, primary_key=True, autoincrement=True)
    question_id = Column(Integer, ForeignKey("pl_assessment_question.id"))
    indicator_id = Column(Integer, ForeignKey("pl_practice_indicator.id"))
    label = Column(String(125), nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    question = relationship("AssessmentQuestion", back_populates="options")
    indicator = relationship(PracticeIndicator)

    def __repr__(self):
        return f"<AssessmentQuestionOption(id={self.id}>"

    @property
    def serialize(self) -> OptionDict:
        return {
            "id": self.id,
            "question_id": self.question_id,
            "indicator_id": self.indicator_id,
            "label": self.label if self.label else self.indicator.label,
            "name": self.indicator.name,
            "description": self.indicator.description,
            "created_at": self.created_at,
        }

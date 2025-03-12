from datetime import datetime
from typing_extensions import TypedDict
from sqlalchemy import (
    Column,
    String,
    DateTime,
    Integer,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from db.connection import Base
from models.procurement_library.assessment_question_option import OptionDict


class AssessmentQuestionDict(TypedDict):
    id: int
    label: str
    created_at: datetime
    updated_at: datetime
    options: list[OptionDict]


class AssessmentQuestion(Base):
    __tablename__ = "pl_assessment_question"

    id = Column(Integer, primary_key=True, autoincrement=True)
    label = Column(String(255), nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    options = relationship(
        "AssessmentQuestionOption",
        back_populates="question"
    )

    def __repr__(self):
        return f"<AssessmentQuestion(id={self.id}, name={self.name}>"

    @property
    def serialize(self) -> AssessmentQuestionDict:
        return {
            "id": self.id,
            "label": self.label,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "options": [option.serialize for option in self.options],
        }

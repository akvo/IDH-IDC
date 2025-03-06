from sqlalchemy import (
    Column,
    Integer,
    ForeignKey,
    DateTime,
    String,
)
from sqlalchemy.sql import func
from db.connection import Base


class AssessmentQuestionOption(Base):
    __tablename__ = "pl_assessment_question_option"

    id = Column(Integer, primary_key=True, autoincrement=True)
    question_id = Column(Integer, ForeignKey("pl_assessment_question.id"))
    indicator_id = Column(Integer, ForeignKey("pl_practice_indicator.id"))
    label = Column(String(125), nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    def __repr__(self):
        return f"<AssessmentQuestionOption(id={self.id}>"

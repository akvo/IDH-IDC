from sqlalchemy import (
    Column,
    String,
    DateTime,
    Integer,
)
from sqlalchemy.sql import func
from db.connection import Base


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

    def __repr__(self):
        return f"<AssessmentQuestion(id={self.id}, name={self.name}>"

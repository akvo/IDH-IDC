from sqlalchemy import (
    Column,
    Integer,
    ForeignKey,
    DateTime,
    Float,
)
from sqlalchemy.sql import func
from db.connection import Base
from sqlalchemy.orm import relationship


class PracticeIndicatorScore(Base):
    __tablename__ = "pl_practice_indicator_score"

    id = Column(Integer, primary_key=True, autoincrement=True)
    practice_id = Column(Integer, ForeignKey("pl_practice.id"))
    indicator_id = Column(Integer, ForeignKey("pl_practice_indicator.id"))
    score = Column(Float, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    practice = relationship("Practice", back_populates="scores")
    indicator = relationship("PracticeIndicator", back_populates="scores")

    def __repr__(self):
        return f"<PracticeIndicatorScore(id={self.id}>"

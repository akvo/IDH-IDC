from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    DateTime
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from db.connection import Base


class PracticeIndicator(Base):
    __tablename__ = 'pl_practice_indicator'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False)
    label = Column(String(125), nullable=False)
    description = Column(Text, nullable=True)
    is_option = Column(Boolean, default=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Add this relationship to link to PracticeIndicatorScore
    scores = relationship(
        "PracticeIndicatorScore",
        back_populates="indicator"
    )

    def __repr__(self):
        return f"<PracticeIndicator(id={self.id}, name={self.name}>"

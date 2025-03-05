import enum
from sqlalchemy import (
    Column,
    Enum,
    Integer,
    String,
    Text,
    Boolean,
    DateTime
)
from sqlalchemy.sql import func
from db.connection import Base


class IndicatorGroup(enum.Enum):
    relative_potential_impact = "Relative Potential Impact"
    relative_ease_of_implementation = "Relative Ease of Implementation"
    position_of_business_in_supply_chain = (
        "Position of Business in Supply Chain"
    )
    market_formality = "Market Formality"
    total_value_addition_lifecycle = (
        "Total Value Addition through Product Lifecycle"
    )
    size_of_business_in_value_chain = "Size of Business in Value Chain"


class PracticeIndicator(Base):
    __tablename__ = 'pl_practice_indicator'

    id = Column(Integer, primary_key=True, autoincrement=True)
    indicator_group = Column(
        Enum(IndicatorGroup, name="indicator_group_type"),
        nullable=True,
    )
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

    def __repr__(self):
        return f"<PracticeIndicator(id={self.id}, name={self.name}>"

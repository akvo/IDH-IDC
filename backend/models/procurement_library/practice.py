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
        "ProcurementProcess",
        foreign_keys=[procurement_process_id],
        cascade="all, delete",
        passive_deletes=True,
        backref="practices",
    )

    def __repr__(self):
        return f"<Practice(id={self.id}, label={self.label}>"

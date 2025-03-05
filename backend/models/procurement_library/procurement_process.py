from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
)
from sqlalchemy.sql import func
from db.connection import Base


class ProcurementProcess(Base):
    __tablename__ = "pl_procurement_process"

    id = Column(Integer, primary_key=True, autoincrement=True)
    label = Column(String(125), nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    def __repr__(self):
        return f"<ProcurementProcess(id={self.id}, label={self.label}>"

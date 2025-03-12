from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
)
from sqlalchemy.sql import func
from db.connection import Base
from sqlalchemy.orm import relationship
from models.procurement_library.procurement_practice_tag import (
    procurement_practice_tag
)
from typing_extensions import TypedDict


class ProcurementProcessDict(TypedDict):
    id: int
    label: str


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

    practices = relationship(
        "Practice",
        secondary=procurement_practice_tag,
        back_populates="procurement_processes",
    )

    def __repr__(self):
        return f"<ProcurementProcess(id={self.id}, label={self.label}>"

    @property
    def serialize(self) -> ProcurementProcessDict:
        return {
            "id": self.id,
            "label": self.label,
        }

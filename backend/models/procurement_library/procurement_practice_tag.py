from sqlalchemy import (
    Column,
    Integer,
    ForeignKey,
    DateTime,
    Table,
)
from sqlalchemy.sql import func
from db.connection import Base

# Define the pivot table
procurement_practice_tag = Table(
    "pl_procurement_practice_tag",
    Base.metadata,
    Column(
        "practice_id",
        Integer,
        ForeignKey("pl_practice.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "procurement_process_id",
        Integer,
        ForeignKey("pl_procurement_process.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column("created_at", DateTime, nullable=False, server_default=func.now()),
    Column(
        "updated_at",
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    ),
)

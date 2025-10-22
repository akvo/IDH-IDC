from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    String,
    Integer,
    Text,
    Boolean,
    Float,
    DateTime,
    ForeignKey,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship, declarative_base

Base = declarative_base()


# ============================================================
# CATEGORY
# ============================================================
class PLCategory(Base):
    __tablename__ = "pl_category"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(125), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    attributes: Mapped[List["PLAttribute"]] = relationship(
        "PLAttribute", back_populates="category", cascade="all, delete-orphan"
    )


# ============================================================
# ATTRIBUTE
# ============================================================
class PLAttribute(Base):
    __tablename__ = "pl_attribute"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    category_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("pl_category.id", ondelete="SET NULL"), nullable=True, index=True
    )
    label: Mapped[str] = mapped_column(String(125), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    category: Mapped[Optional[PLCategory]] = relationship("PLCategory", back_populates="attributes")
    tags: Mapped[List["PLPracticeInterventionTag"]] = relationship(
        "PLPracticeInterventionTag", back_populates="attribute", cascade="all, delete-orphan"
    )


# ============================================================
# PRACTICE INTERVENTION
# ============================================================
class PLPracticeIntervention(Base):
    __tablename__ = "pl_practice_intervention"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    label: Mapped[str] = mapped_column(String(225), nullable=False, index=True)
    intervention_definition: Mapped[Optional[str]] = mapped_column(Text)
    enabling_conditions: Mapped[Optional[str]] = mapped_column(Text)
    business_rationale: Mapped[Optional[str]] = mapped_column(Text)
    farmer_rationale: Mapped[Optional[str]] = mapped_column(Text)
    risks_n_trade_offs: Mapped[Optional[str]] = mapped_column(Text)
    intervention_impact_income: Mapped[Optional[str]] = mapped_column(Text)
    intervention_impact_env: Mapped[Optional[str]] = mapped_column(Text)
    source_or_evidence: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    tags: Mapped[List["PLPracticeInterventionTag"]] = relationship(
        "PLPracticeInterventionTag", back_populates="practice_intervention", cascade="all, delete-orphan"
    )
    indicator_scores: Mapped[List["PLPracticeInterventionIndicatorScore"]] = relationship(
        "PLPracticeInterventionIndicatorScore",
        back_populates="practice_intervention",
        cascade="all, delete-orphan",
    )


# ============================================================
# PRACTICE INTERVENTION TAG (Many-to-Many)
# ============================================================
class PLPracticeInterventionTag(Base):
    __tablename__ = "pl_practice_intervention_tag"

    practice_intervention_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("pl_practice_intervention.id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    )
    attribute_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("pl_attribute.id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    practice_intervention: Mapped["PLPracticeIntervention"] = relationship(
        "PLPracticeIntervention", back_populates="tags"
    )
    attribute: Mapped["PLAttribute"] = relationship("PLAttribute", back_populates="tags")


# ============================================================
# INDICATOR
# ============================================================
class PLIndicator(Base):
    __tablename__ = "pl_indicator"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False, unique=True, index=True)
    label: Mapped[str] = mapped_column(String(125), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    indicator_scores: Mapped[List["PLPracticeInterventionIndicatorScore"]] = relationship(
        "PLPracticeInterventionIndicatorScore",
        back_populates="indicator",
        cascade="all, delete-orphan",
    )


# ============================================================
# PRACTICE INTERVENTION INDICATOR SCORE
# ============================================================
class PLPracticeInterventionIndicatorScore(Base):
    __tablename__ = "pl_practice_intervention_indicator_score"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    practice_intervention_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("pl_practice_intervention.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    indicator_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("pl_indicator.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    score: Mapped[Optional[float]] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    practice_intervention: Mapped["PLPracticeIntervention"] = relationship(
        "PLPracticeIntervention", back_populates="indicator_scores"
    )
    indicator: Mapped["PLIndicator"] = relationship("PLIndicator", back_populates="indicator_scores")

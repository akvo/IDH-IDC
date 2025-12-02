from datetime import datetime
from typing import List, Optional
from sqlalchemy import (
    String,
    Integer,
    Text,
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
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    attributes: Mapped[List["PLAttribute"]] = relationship(
        "PLAttribute", back_populates="category", cascade="all, delete-orphan"
    )

    # ✅ Simple serializer
    @property
    def serialize(self):
        return {"id": self.id, "label": self.name}

    @property
    def category_with_attributes(self):
        return {
            "id": self.id,
            "name": self.name,
            "attributes": [
                attr.simplify for attr in (self.attributes or [])
            ]
        }


# ============================================================
# ATTRIBUTE
# ============================================================
class PLAttribute(Base):
    __tablename__ = "pl_attribute"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    category_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("pl_category.id", ondelete="SET NULL"), nullable=True, index=True)
    label: Mapped[str] = mapped_column(String(125), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    category: Mapped[Optional[PLCategory]] = relationship("PLCategory", back_populates="attributes")
    tags: Mapped[List["PLPracticeInterventionTag"]] = relationship("PLPracticeInterventionTag", back_populates="attribute", cascade="all, delete-orphan")

    # ✅ Reusable serializer
    @property
    def serialize(self):
        return {
            "id": self.id,
            "label": self.label,
            "category": self.category.serialize if self.category else None,
        }

    @property
    def simplify(self):
        return {
            "id": self.id,
            "label": self.label,
        }

    @property
    def serializeWithCategoryId(self):
        return {
            "id": self.id,
            "label": self.label,
            "category_id": self.category_id,
        }


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
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    indicator_scores: Mapped[List["PLPracticeInterventionIndicatorScore"]] = relationship(
        "PLPracticeInterventionIndicatorScore",
        back_populates="indicator",
        cascade="all, delete-orphan",
    )

    # ✅ Reusable serializer
    @property
    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "label": self.label,
            "description": self.description,
        }


# ============================================================
# PRACTICE INTERVENTION INDICATOR SCORE
# ============================================================
class PLPracticeInterventionIndicatorScore(Base):
    __tablename__ = "pl_practice_intervention_indicator_score"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    practice_intervention_id: Mapped[int] = mapped_column(Integer, ForeignKey("pl_practice_intervention.id", ondelete="CASCADE"), nullable=False, index=True)
    indicator_id: Mapped[int] = mapped_column(Integer, ForeignKey("pl_indicator.id", ondelete="CASCADE"), nullable=False, index=True)
    score: Mapped[Optional[float]] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    practice_intervention: Mapped["PLPracticeIntervention"] = relationship("PLPracticeIntervention", back_populates="indicator_scores")
    indicator: Mapped["PLIndicator"] = relationship("PLIndicator", back_populates="indicator_scores")

    # ✅ Reusable serializer
    @property
    def serialize(self):
        return {
            "id": self.id,
            "practice_intervention_id": self.practice_intervention_id,
            "indicator_id": self.indicator_id,
            "score": self.score,
            "indicator": self.indicator.serialize if self.indicator else None,
        }


# ============================================================
# PRACTICE INTERVENTION TAG
# ============================================================
class PLPracticeInterventionTag(Base):
    __tablename__ = "pl_practice_intervention_tag"

    practice_intervention_id: Mapped[int] = mapped_column(Integer, ForeignKey("pl_practice_intervention.id", ondelete="CASCADE"), primary_key=True, index=True)
    attribute_id: Mapped[int] = mapped_column(Integer, ForeignKey("pl_attribute.id", ondelete="CASCADE"), primary_key=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    practice_intervention: Mapped["PLPracticeIntervention"] = relationship("PLPracticeIntervention", back_populates="tags")
    attribute: Mapped["PLAttribute"] = relationship("PLAttribute", back_populates="tags")

    # ✅ Reusable serializer
    @property
    def serialize(self):
        return self.attribute.serialize if self.attribute else None


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
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    tags: Mapped[List["PLPracticeInterventionTag"]] = relationship("PLPracticeInterventionTag", back_populates="practice_intervention", cascade="all, delete-orphan")
    indicator_scores: Mapped[List["PLPracticeInterventionIndicatorScore"]] = relationship("PLPracticeInterventionIndicatorScore", back_populates="practice_intervention", cascade="all, delete-orphan")

    # ============================================================
    # Derived / Serialized Properties
    # ============================================================
    @property
    def is_environmental(self) -> bool:
        # return any(score.indicator.name == "environmental_impact" and score.score > 3 for score in self.indicator_scores)
        return any(tag.attribute.label == "Environment" for tag in self.tags)

    @property
    def is_income(self) -> bool:
        # return any(score.indicator.name == "income_impact" and score.score > 3 for score in self.indicator_scores)
        return any(tag.attribute.label == "Income" for tag in self.tags)

    @property
    def serialize(self):
        """Lightweight version for list view."""
        return {
            "id": self.id,
            "label": self.label,
            "tags": [t.attribute.simplify for t in self.tags if t.attribute],
            "is_environmental": self.is_environmental,
            "is_income": self.is_income,
            "scores": [s.serialize for s in self.indicator_scores],
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

    @property
    def serialize_detail(self):
        """Full version for detail endpoint."""
        return {
            "id": self.id,
            "label": self.label,
            "intervention_definition": self.intervention_definition,
            "enabling_conditions": self.enabling_conditions,
            "business_rationale": self.business_rationale,
            "farmer_rationale": self.farmer_rationale,
            "risks_n_trade_offs": self.risks_n_trade_offs,
            "intervention_impact_income": self.intervention_impact_income,
            "intervention_impact_env": self.intervention_impact_env,
            "source_or_evidence": self.source_or_evidence,
            "is_environmental": self.is_environmental,
            "is_income": self.is_income,
            "created_at": self.created_at,
            "tags": [
                t.attribute.serializeWithCategoryId
                for t in self.tags if t.attribute
            ],
            "scores": [
                {
                    "id": s.id,
                    "indicator_name": s.indicator.name if s.indicator else None,
                    "score": s.score,
                }
                for s in self.indicator_scores
            ],
        }

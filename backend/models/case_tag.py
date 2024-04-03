from db.connection import Base
from sqlalchemy import Column, ForeignKey, Integer
from sqlalchemy.orm import relationship
from typing import Optional
from pydantic import BaseModel
from models.tag import Tag


class CaseTag(Base):
    __tablename__ = "case_tag"

    id = Column(Integer, primary_key=True, nullable=False)
    case = Column(Integer, ForeignKey("case.id"), nullable=False)
    tag = Column(Integer, ForeignKey("tag.id"), nullable=False)

    case_detail = relationship(
        "Case",
        cascade="all, delete",
        passive_deletes=True,
        back_populates="case_tags",
    )
    case_tag_detail = relationship(
        Tag,
        cascade="all, delete",
        passive_deletes=True,
        back_populates="tag_cases",
    )

    def __init__(
        self,
        case: Optional[int] = None,
        tag: Optional[int] = None,
        id: Optional[int] = None,
    ):
        self.id = id
        self.case = case
        self.tag = tag

    def __repr__(self) -> int:
        return f"<CaseTag {self.id}>"


class CaseTagBase(BaseModel):
    id: int
    case: int
    tag: int

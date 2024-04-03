from db.connection import Base
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from typing_extensions import TypedDict
from typing import Optional, List
from pydantic import BaseModel


class TagDict(TypedDict):
    id: int
    name: str
    description: Optional[str]
    created_by: int


class TagListDict(TypedDict):
    id: int
    name: str
    description: Optional[str]
    cases_count: int


class TagOption(TypedDict):
    label: str
    value: int


class Tag(Base):
    __tablename__ = "tag"

    id = Column(Integer, primary_key=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    created_by = Column(Integer, ForeignKey("user.id"), nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    created_by_user = relationship(
        "User", cascade="all, delete", passive_deletes=True, backref="Tags"
    )
    tag_cases = relationship(
        "CaseTag",
        cascade="all, delete",
        passive_deletes=True,
        back_populates="case_tag_detail",
    )

    def __init__(
        self,
        name: str,
        id: Optional[int] = None,
        description: Optional[str] = None,
        created_by: Optional[int] = None,
    ):
        self.id = id
        self.name = name
        self.description = description
        self.created_by = created_by

    def __repr__(self) -> int:
        return f"<Tag {self.id}>"

    @property
    def serialize(self) -> TagDict:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
        }

    @property
    def to_tag_list(self) -> TagListDict:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "cases_count": len(self.tag_cases),
        }

    @property
    def to_option(self) -> TagOption:
        return {
            "label": self.name,
            "value": self.id,
        }


class TagBase(BaseModel):
    name: str
    id: Optional[int] = None
    description: Optional[str] = None
    cases: Optional[List[int]] = None


class UpdateTagBase(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    cases: Optional[List[int]] = None


class PaginatedTagResponse(BaseModel):
    current: int
    data: List[TagListDict]
    total: int
    total_page: int

from datetime import datetime
from typing import Optional, List
from typing_extensions import TypedDict
from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    func,
)
import sqlalchemy.dialects.postgresql as pg
from sqlalchemy.orm import relationship, backref

from db.connection import Base
from models.user import User  # noqa: F401
from models.region import Region  # noqa: F401


# ============================================================
# TYPED DICT
# ============================================================
class UserProfileDict(TypedDict, total=False):
    id: int
    user_id: int
    first_name: Optional[str]
    last_name: Optional[str]
    company_name: Optional[str]
    company_type: Optional[str]
    sector: Optional[str]
    region_id: Optional[int]
    region_name: Optional[str]
    commodities: List[str]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]


# ============================================================
# SQLALCHEMY MODEL
# ============================================================
class UserProfile(Base):
    __tablename__ = "user_profile"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(
        Integer,
        ForeignKey("user.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    first_name = Column(String(125), nullable=True)
    last_name = Column(String(125), nullable=True)
    company_name = Column(String(255), nullable=True)
    company_type = Column(String(100), nullable=True)
    sector = Column(String(100), nullable=True)
    region_id = Column(
        Integer,
        ForeignKey("region.id", ondelete="SET NULL"),
        nullable=True,
    )
    region_name = Column(String(125), nullable=True)
    commodities = Column(pg.JSONB, nullable=False, default=list)
    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )
    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    user = relationship(
        "User",
        backref=backref("profile", uselist=False, cascade="all, delete-orphan"),
    )
    region = relationship("Region")

    def __init__(
        self,
        user_id: int,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        company_name: Optional[str] = None,
        company_type: Optional[str] = None,
        sector: Optional[str] = None,
        region_id: Optional[int] = None,
        region_name: Optional[str] = None,
        commodities: Optional[List[str]] = None,
    ):
        self.user_id = user_id
        self.first_name = first_name
        self.last_name = last_name
        self.company_name = company_name
        self.company_type = company_type
        self.sector = sector
        self.region_id = region_id
        self.region_name = region_name
        self.commodities = commodities if commodities is not None else []

    def to_dict(self) -> UserProfileDict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "company_name": self.company_name,
            "company_type": self.company_type,
            "sector": self.sector,
            "region_id": self.region_id,
            "region_name": self.region_name,
            "commodities": self.commodities or [],
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


# ============================================================
# PYDANTIC SCHEMAS (Pydantic v2 compatible)
# ============================================================
class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class UserProfileBase(BaseSchema):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company_name: Optional[str] = None
    company_type: Optional[str] = None
    sector: Optional[str] = None
    region_id: Optional[int] = None
    region_name: Optional[str] = None
    commodities: List[str] = Field(default_factory=list)


class UserProfileCreate(UserProfileBase):
    user_id: int


class UserProfileUpdate(UserProfileBase):
    pass


class UserProfileResponse(UserProfileBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

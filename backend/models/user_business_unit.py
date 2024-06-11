import enum

from typing import Optional
from typing_extensions import TypedDict
from sqlalchemy import Column, ForeignKey, Integer, Enum
from sqlalchemy.orm import relationship

from pydantic import BaseModel
from db.connection import Base


class UserBusinessUnitRole(enum.Enum):
    admin = "admin"
    member = "member"


class UserBusinessUnitDict(TypedDict):
    id: int
    user: int
    business_unit: int
    role: UserBusinessUnitRole


class UserBusinessUnitDetailDict(TypedDict):
    id: int
    name: str
    role: UserBusinessUnitRole


class UserBusinessUnitRoleDict(TypedDict):
    business_unit: int
    role: UserBusinessUnitRole


class UserBusinessUnit(Base):
    __tablename__ = "user_business_unit"

    id = Column(Integer, primary_key=True, nullable=False)
    user = Column(Integer, ForeignKey("user.id"), nullable=False)
    business_unit = Column(
        Integer, ForeignKey("business_unit.id"), nullable=False)
    role = Column(Enum(
        UserBusinessUnitRole, name="user_business_unit_role"), nullable=False)

    user_business_unit_user_detail = relationship(
        "User",
        cascade="all, delete",
        passive_deletes=True,
        back_populates="user_business_units",
    )
    business_unit_detail = relationship(
        "BusinessUnit",
        cascade="all, delete",
        passive_deletes=True,
        back_populates="business_unit_users",
    )

    def __init__(
        self,
        business_unit: int,
        role: UserBusinessUnitRole,
        id: Optional[int] = None,
        user: Optional[int] = None
    ):
        self.id = id
        self.user = user
        self.business_unit = business_unit
        self.role = role

    def __repr__(self) -> int:
        return f"<UserBusinessUnit {self.id}>"

    @property
    def to_business_unit_role(self) -> UserBusinessUnitRoleDict:
        return {"business_unit": self.business_unit, "role": self.role}

    @property
    def to_business_unit_detail(self) -> UserBusinessUnitDetailDict:
        return {
            "id": self.id,
            "name": self.business_unit_detail.name,
            "role": self.role,
        }


class UserBusinessUnitBase(BaseModel):
    business_unit: int
    role: UserBusinessUnitRole
    user: Optional[int] = None
    id: Optional[int] = None

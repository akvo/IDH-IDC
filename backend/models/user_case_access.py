from db.connection import Base
from sqlalchemy import Column, ForeignKey, Integer, Enum
from sqlalchemy.orm import relationship
from typing import Optional
from typing_extensions import TypedDict
from pydantic import BaseModel
from models.enum_type import PermissionType


class UserCaseAccessDict(TypedDict):
    id: int
    case: int
    label: str
    value: int
    permission: PermissionType


class UserCasePermissionDict(TypedDict):
    case: int
    permission: PermissionType


class UserCaseAccess(Base):
    __tablename__ = "user_case_access"

    id = Column(Integer, primary_key=True, nullable=False)
    user = Column(Integer, ForeignKey("user.id"), nullable=False)
    case = Column(Integer, ForeignKey("case.id"), nullable=False)
    permission = Column(
        Enum(PermissionType, name="user_case_access_permission"),
        nullable=False,
    )

    user_case_access_detail = relationship(
        "User",
        cascade="all, delete",
        passive_deletes=True,
        back_populates="user_case_access",
    )
    # case_detail = relationship(
    #     'Case',
    #     cascade="all, delete",
    #     passive_deletes=True,
    #     backref='case_access'
    # )

    def __init__(
        self,
        case: int,
        permission: PermissionType,
        id: Optional[int] = None,
        user: Optional[int] = None,
    ):
        self.id = id
        self.user = user
        self.case = case
        self.permission = permission

    def __repr__(self) -> int:
        return f"<UserCaseAccess {self.id}>"

    @property
    def serialize(self) -> UserCaseAccessDict:
        name = self.user_case_access_detail.fullname
        email = self.user_case_access_detail.email
        label = f"{name} <{email}>"
        return {
            "id": self.id,
            "case": self.case,
            "value": self.user,
            "label": label,
            "permission": self.permission,
        }

    @property
    def to_case_permission(self) -> UserCasePermissionDict:
        return {"case": self.case, "permission": self.permission}


class UserCaseAccessBase(BaseModel):
    case: int
    permission: PermissionType
    id: Optional[int] = None
    user: Optional[int] = None


class UserCaseAccessPayload(BaseModel):
    user: int
    permission: PermissionType

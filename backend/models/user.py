import enum
import json
from db.connection import Base
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    SmallInteger,
    Enum,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from typing import Optional, List
from typing_extensions import TypedDict
from pydantic import BaseModel, SecretStr, field_validator, ValidationInfo
from models.organisation import OrganisationDict
from fastapi import Form, HTTPException, status
from models.user_tag import UserTag
from models.user_case_access import UserCaseAccess, UserCasePermissionDict
from models.user_business_unit import (
    UserBusinessUnitDetailDict,
    UserBusinessUnitRoleDict,
)

tags_desc = "JSON stringify of tag ids [1, 2, 3]"
cases_desc = "JSON stringify of [{'case': 1, 'permission': 'edit/view'}]"
bus_desc = "JSON stringify of [{'business_unit': 1, 'role': 'admin/member'}]"


class UserRole(enum.Enum):
    super_admin = "super_admin"
    admin = "admin"
    editor = "editor"
    viewer = "viewer"
    user = "user"


# only for user:get_all route
class FilterUserRole(enum.Enum):
    super_admin = "super_admin"
    admin = "admin"
    internal = "internal"
    external = "external"


def json_load(value: Optional[str] = None):
    if value:
        return json.loads(value)
    return value


def validate_business_units(info: ValidationInfo, value: Optional[str] = None):
    business_units_required = [UserRole.admin]
    role = info.data.get("role", None)
    # business unit required for admin role
    if role and role in business_units_required and not value:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"business_units required for {role.value} role",
        )
    return json_load(value=value)


class UserInfo(TypedDict):
    id: int
    fullname: str
    email: str
    role: UserRole
    all_cases: bool
    active: bool
    business_unit_detail: Optional[List[UserBusinessUnitDetailDict]]
    organisation_detail: OrganisationDict
    tags_count: int
    cases_count: int
    case_access: Optional[List[UserCasePermissionDict]]
    internal_user: bool  # UserRole == user has business unit


class UserDetailDict(TypedDict):
    id: int
    fullname: str
    organisation: int
    email: str
    role: UserRole
    all_cases: bool
    active: bool
    company: Optional[int]
    tags: Optional[List[int]]
    business_units: Optional[List[UserBusinessUnitRoleDict]]
    cases: Optional[List[UserCasePermissionDict]]


class UserPageDict(TypedDict):
    id: int
    organisation: int
    email: str
    fullname: str
    role: UserRole
    active: bool
    tags_count: int
    cases_count: int
    business_unit_count: int


class UserDict(TypedDict):
    id: int
    organisation: int
    email: str
    fullname: str
    role: UserRole
    active: bool
    company: Optional[int]


class UserInvitation(TypedDict):
    id: int
    fullname: str
    email: str
    role: UserRole
    invitation_id: Optional[str]


class UserSearchDict(TypedDict):
    value: int
    label: str


class EmailRecipient(TypedDict):
    Email: str
    Name: str


class User(Base):
    __tablename__ = "user"

    id = Column(Integer, primary_key=True)
    organisation = Column(Integer, ForeignKey("organisation.id"))
    company = Column(Integer, ForeignKey("company.id"))
    email = Column(String, nullable=False, unique=True)
    fullname = Column(String, nullable=False)
    password = Column(String, nullable=True)
    role = Column(Enum(UserRole, name="user_role"), nullable=False)
    all_cases = Column(SmallInteger, nullable=False, default=0)
    is_active = Column(SmallInteger, nullable=False, default=0)
    invitation_id = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    user_organisation = relationship(
        "Organisation",
        cascade="all, delete",
        passive_deletes=True,
        back_populates="users",
    )
    user_companies = relationship(
        "Company",
        cascade="all, delete",
        passive_deletes=True,
        back_populates="user_company_detail",
    )
    user_tags = relationship(
        UserTag,
        cascade="all, delete",
        passive_deletes=True,
        back_populates="user_tag_detail",
    )
    user_case_access = relationship(
        UserCaseAccess,
        cascade="all, delete",
        passive_deletes=True,
        back_populates="user_case_access_detail",
    )
    user_business_units = relationship(
        "UserBusinessUnit",
        cascade="all, delete",
        passive_deletes=True,
        back_populates="user_business_unit_user_detail",
    )

    def __init__(
        self,
        organisation: int,
        email: str,
        fullname: str,
        role: UserRole,
        id: Optional[int] = None,
        is_active: Optional[int] = 0,
        invitation_id: Optional[str] = None,
        password: Optional[str] = None,
        all_cases: Optional[int] = 0,
        company: Optional[int] = None,
    ):
        self.id = id
        self.organisation = organisation
        self.email = email
        self.fullname = fullname
        self.password = password
        self.role = role
        self.all_cases = all_cases
        self.is_active = is_active
        self.invitation_id = invitation_id
        self.company = company

    def __repr__(self) -> int:
        return f"<User {self.id}>"

    @property
    def serialize(self) -> UserDict:
        return {
            "id": self.id,
            "organisation": self.organisation,
            "company": self.company,
            "email": self.email,
            "fullname": self.fullname,
            "role": self.role,
            "active": self.is_active,
        }

    @property
    def to_user_info(self) -> UserInfo:
        business_unit_detail = [
            bu.to_business_unit_detail for bu in self.user_business_units
        ]
        business_unit_detail = (
            business_unit_detail if business_unit_detail else None
        )

        case_access = []
        if self.user_case_access:
            case_access = [c.to_case_permission for c in self.user_case_access]

        return {
            "id": self.id,
            "fullname": self.fullname,
            "email": self.email,
            "role": self.role,
            "all_cases": self.all_cases,
            "active": self.is_active,
            "business_unit_detail": business_unit_detail,
            "organisation_detail": self.user_organisation.serialize,
            "tags_count": len(self.user_tags),
            "cases_count": len(self.user_case_access),
            "case_access": case_access,
            "internal_user": (
                False
                if not business_unit_detail and self.role == UserRole.user
                else True
            ),
        }

    @property
    def to_user_detail(self) -> UserDetailDict:
        tags = []
        business_units = []
        cases = []
        if self.user_business_units:
            business_units = [
                bu.to_business_unit_role for bu in self.user_business_units
            ]
        if self.user_tags:
            tags = [t.tag for t in self.user_tags]
        if self.user_case_access:
            cases = [c.to_case_permission for c in self.user_case_access]
        return {
            "id": self.id,
            "fullname": self.fullname,
            "email": self.email,
            "role": self.role,
            "all_cases": self.all_cases,
            "active": self.is_active,
            "organisation": self.organisation,
            "company": self.company,
            "tags": tags,
            "business_units": business_units,
            "cases": cases,
        }

    @property
    def to_user_list(self) -> UserPageDict:
        return {
            "id": self.id,
            "organisation": self.organisation,
            "email": self.email,
            "fullname": self.fullname,
            "role": self.role,
            "active": self.is_active,
            "tags_count": len(self.user_tags),
            "cases_count": len(self.user_case_access),
            "business_unit_count": len(self.user_business_units),
        }

    @property
    def to_user_invitation(self) -> UserInvitation:
        return {
            "id": self.id,
            "fullname": self.fullname,
            "email": self.email,
            "role": self.role,
            "invitation_id": self.invitation_id,
        }

    @property
    def to_search_dropdown(self) -> UserSearchDict:
        label = f"{self.fullname} <{self.email}>"
        return {"value": self.id, "label": label}

    @property
    def recipient(self) -> EmailRecipient:
        return {"Email": self.email, "Name": self.fullname}


class UserBase(BaseModel):
    id: Optional[int] = None
    email: str
    fullname: str
    organisation: Optional[int] = None
    role: Optional[UserRole] = UserRole.user
    password: Optional[SecretStr] = None
    all_cases: Optional[bool] = False
    tags: Optional[str] = None
    cases: Optional[str] = None
    business_units: Optional[str] = None
    company: Optional[int] = None

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, value) -> dict:
        return json_load(value=value)

    @field_validator("cases")
    @classmethod
    def validate_cases(cls, value) -> dict:
        return json_load(value=value)

    @field_validator("business_units")
    @classmethod
    def validate_business_units(cls, value, info: ValidationInfo) -> dict:
        value = validate_business_units(value=value, info=info)
        return value

    @classmethod
    def as_form(
        cls,
        fullname: str = Form(...),
        email: str = Form(...),
        organisation: int = Form(None),
        company: int = Form(None),
        password: SecretStr = Form(None),
        role: UserRole = Form(None),
        all_cases: bool = Form(False),
        tags: str = Form(None, description=tags_desc),
        cases: str = Form(None, description=cases_desc),
        business_units: str = Form(None, description=bus_desc),
    ):
        return cls(
            fullname=fullname,
            email=email,
            password=password,
            organisation=organisation,
            company=company,
            role=role,
            all_cases=all_cases,
            tags=tags,
            cases=cases,
            business_units=business_units,
        )


class UserResponse(BaseModel):
    current: int
    data: List[UserPageDict]
    total: int
    total_page: int


class UserUpdateBase(BaseModel):
    fullname: str
    organisation: Optional[int] = None
    role: Optional[UserRole] = None
    all_cases: Optional[bool] = False
    is_active: Optional[bool] = False
    password: Optional[SecretStr] = None
    tags: Optional[str] = None
    cases: Optional[str] = None
    business_units: Optional[str] = None
    company: Optional[int] = None

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, value) -> dict:
        return json_load(value=value)

    @field_validator("cases")
    @classmethod
    def validate_cases(cls, value) -> dict:
        return json_load(value=value)

    @field_validator("business_units")
    @classmethod
    def validate_business_units(cls, value, info: ValidationInfo) -> dict:
        value = validate_business_units(value=value, info=info)
        return value

    @classmethod
    def as_form(
        cls,
        fullname: str = Form(...),
        organisation: int = Form(None),
        company: int = Form(None),
        password: SecretStr = Form(None),
        role: UserRole = Form(None),
        all_cases: bool = Form(False),
        is_active: bool = Form(False),
        tags: str = Form(None, description=tags_desc),
        cases: str = Form(None, description=cases_desc),
        business_units: str = Form(None, description=bus_desc),
    ):
        return cls(
            fullname=fullname,
            password=password,
            role=role,
            all_cases=all_cases,
            organisation=organisation,
            company=company,
            is_active=is_active,
            tags=tags,
            cases=cases,
            business_units=business_units,
        )

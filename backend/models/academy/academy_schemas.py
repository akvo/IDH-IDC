from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

from models.academy.academy_models import (
    AcademyResourceType,
    AcademyGlossaryTermType,
)


# ============================================================
# BASE SCHEMA (Pydantic v2)
# ============================================================
class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ============================================================
# 1. ACADEMY TAG SCHEMAS
# ============================================================
class AcademyTagBase(BaseSchema):
    name: str
    slug: str
    order_index: int = 0


class AcademyTagCreate(AcademyTagBase):
    pass


class AcademyTagUpdate(BaseSchema):
    name: Optional[str] = None
    slug: Optional[str] = None
    order_index: Optional[int] = None


class AcademyTagResponse(AcademyTagBase):
    id: int
    created_at: datetime


# ============================================================
# 2. ACADEMY RESOURCE SCHEMAS
# ============================================================
class AcademyResourceBase(BaseSchema):
    name: str
    resource_type: AcademyResourceType
    file_url: str


class AcademyResourceCreate(AcademyResourceBase):
    pass


class AcademyResourceUpdate(BaseSchema):
    name: Optional[str] = None
    resource_type: Optional[AcademyResourceType] = None
    file_url: Optional[str] = None


class AcademyResourceResponse(AcademyResourceBase):
    id: int
    created_at: datetime
    updated_at: datetime


# ============================================================
# 3. ACADEMY GLOSSARY TERM SCHEMAS
# ============================================================
class AcademyGlossaryTermBase(BaseSchema):
    name: str
    term_type: AcademyGlossaryTermType
    definition: str


class AcademyGlossaryTermCreate(AcademyGlossaryTermBase):
    pass


class AcademyGlossaryTermUpdate(BaseSchema):
    name: Optional[str] = None
    term_type: Optional[AcademyGlossaryTermType] = None
    definition: Optional[str] = None


class AcademyGlossaryTermResponse(AcademyGlossaryTermBase):
    id: int
    created_at: datetime
    updated_at: datetime

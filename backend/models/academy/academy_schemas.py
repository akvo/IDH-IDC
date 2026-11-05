from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

from models.academy.academy_models import (
    AcademyResourceType,
    AcademyGlossaryTermType,
    AcademyChapterProgressStatus,
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


# ============================================================
# 4. ACADEMY MODULE SCHEMAS
# ============================================================
class AcademyModuleBase(BaseSchema):
    order_index: int
    title: str
    description: Optional[str] = None
    estimated_minutes: int = 16
    icon_theme: Optional[str] = None


class AcademyModuleCreate(AcademyModuleBase):
    pass


class AcademyModuleUpdate(BaseSchema):
    order_index: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    estimated_minutes: Optional[int] = None
    icon_theme: Optional[str] = None


class AcademyModuleResponse(AcademyModuleBase):
    id: int
    created_at: datetime
    updated_at: datetime


# ============================================================
# 5. ACADEMY CHAPTER SCHEMAS
# ============================================================
class AcademyChapterBase(BaseSchema):
    module_id: int
    chapter_number: int
    title: str
    content_html: Optional[str] = None
    estimated_minutes: int = 5


class AcademyChapterCreate(AcademyChapterBase):
    pass


class AcademyChapterUpdate(BaseSchema):
    module_id: Optional[int] = None
    chapter_number: Optional[int] = None
    title: Optional[str] = None
    content_html: Optional[str] = None
    estimated_minutes: Optional[int] = None


class AcademyChapterResponse(AcademyChapterBase):
    id: int
    created_at: datetime
    updated_at: datetime


# ============================================================
# 6. ACADEMY TAG RELATION SCHEMAS
# ============================================================
class AcademyTagRelationBase(BaseSchema):
    tag_id: int
    module_id: Optional[int] = None
    chapter_id: Optional[int] = None


class AcademyTagRelationCreate(AcademyTagRelationBase):
    pass


class AcademyTagRelationResponse(AcademyTagRelationBase):
    id: int
    created_at: datetime


# ============================================================
# 7. ACADEMY USER CHAPTER PROGRESS SCHEMAS
# ============================================================
class AcademyUserChapterProgressBase(BaseSchema):
    user_id: int
    chapter_id: int
    status: AcademyChapterProgressStatus = (
        AcademyChapterProgressStatus.not_started
    )
    last_opened_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class AcademyUserChapterProgressCreate(AcademyUserChapterProgressBase):
    pass


class AcademyUserChapterProgressUpdate(BaseSchema):
    status: Optional[AcademyChapterProgressStatus] = None
    last_opened_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class AcademyUserChapterProgressResponse(AcademyUserChapterProgressBase):
    id: int
    created_at: datetime
    updated_at: datetime

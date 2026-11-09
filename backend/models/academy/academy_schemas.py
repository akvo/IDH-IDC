from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, model_validator

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


class AcademyResourceItemResponse(BaseSchema):
    id: int
    name: str
    type: AcademyResourceType
    url: str
    description: Optional[str] = None
    created_at: datetime

    @model_validator(mode="before")
    @classmethod
    def map_resource_fields(cls, data):
        if not isinstance(data, dict):
            return {
                "id": getattr(data, "id", None),
                "name": getattr(data, "name", None),
                "type": getattr(
                    data, "resource_type", getattr(data, "type", None)
                ),
                "url": getattr(data, "file_url", getattr(data, "url", None)),
                "description": getattr(data, "description", None),
                "created_at": getattr(data, "created_at", None),
            }
        mapped = dict(data)
        if "type" not in mapped and "resource_type" in mapped:
            mapped["type"] = mapped["resource_type"]
        if "url" not in mapped and "file_url" in mapped:
            mapped["url"] = mapped["file_url"]
        return mapped


class AcademyResourceListResponse(BaseSchema):
    total: int
    data: List[AcademyResourceItemResponse] = []


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


class AcademyGlossaryItemResponse(BaseSchema):
    id: int
    term: str
    type: AcademyGlossaryTermType
    definition: str
    created_at: datetime

    @model_validator(mode="before")
    @classmethod
    def map_glossary_fields(cls, data):
        if not isinstance(data, dict):
            return {
                "id": getattr(data, "id", None),
                "term": getattr(data, "name", getattr(data, "term", None)),
                "type": getattr(
                    data, "term_type", getattr(data, "type", None)
                ),
                "definition": getattr(data, "definition", None),
                "created_at": getattr(data, "created_at", None),
            }
        mapped = dict(data)
        if "term" not in mapped and "name" in mapped:
            mapped["term"] = mapped["name"]
        if "type" not in mapped and "term_type" in mapped:
            mapped["type"] = mapped["term_type"]
        return mapped


class AcademyGlossaryListResponse(BaseSchema):
    total: int
    data: List[AcademyGlossaryItemResponse] = []


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


# ============================================================
# 8. COURSE OVERVIEW, PROGRESS & HISTORY SCHEMAS (BE-03)
# ============================================================
class AcademyTagSummary(BaseSchema):
    id: int
    name: str
    slug: str


class AcademyTagWithCounts(BaseSchema):
    id: int
    name: str
    slug: str
    order_index: int = 0
    module_count: int = 0
    chapter_count: int = 0


AcademyTagWithCountsResponse = AcademyTagWithCounts


class AcademyMetricsResponse(BaseSchema):
    academy_progress_pct: int = 0
    modules_completed: int = 0
    total_modules: int = 0
    modules_completed_pct: int = 0
    chapters_completed: int = 0
    total_chapters: int = 0
    chapters_completed_pct: int = 0


class AcademyModuleOverviewCard(BaseSchema):
    id: int
    order_index: int
    title: str
    description: Optional[str] = None
    estimated_minutes: int
    icon_theme: Optional[str] = None
    progress_pct: int = 0
    status: str = "Not started"
    tags: List[AcademyTagSummary] = []


class AcademyRecentlyOpenedChapter(BaseSchema):
    id: int
    module_id: int
    module_order_index: int
    module_title: str
    chapter_number: int
    title: str
    estimated_minutes: int
    status: str = "Not started"
    last_opened_at: Optional[datetime] = None
    tags: List[AcademyTagSummary] = []


class AcademyOverviewResponse(BaseSchema):
    greeting_name: str
    continue_chapter_id: Optional[int] = None
    metrics: AcademyMetricsResponse
    modules: List[AcademyModuleOverviewCard]
    recently_opened: List[AcademyRecentlyOpenedChapter] = []


class AcademyChapterSummary(BaseSchema):
    id: int
    chapter_number: int
    title: str
    estimated_minutes: int
    status: str = "Not started"
    tags: List[AcademyTagSummary] = []


class AcademyModuleDetailItem(BaseSchema):
    id: int
    order_index: int
    title: str
    description: Optional[str] = None
    estimated_minutes: int
    icon_theme: Optional[str] = None
    progress_pct: int = 0
    status: str = "Not started"
    tags: List[AcademyTagSummary] = []
    chapters: List[AcademyChapterSummary] = []


class AcademyModulesResponse(BaseSchema):
    total_modules: int
    course_summary_html: Optional[str] = None
    modules: List[AcademyModuleDetailItem]


AcademyModulesListResponse = AcademyModulesResponse


class AcademyChapterDetailResponse(BaseSchema):
    id: int
    module_id: int
    module_title: Optional[str] = None
    chapter_number: int
    title: str
    content_html: Optional[str] = None
    estimated_minutes: int
    status: str = "Not started"
    tags: List[AcademyTagSummary] = []
    prev_chapter_id: Optional[int] = None
    next_chapter_id: Optional[int] = None


class ChapterProgressUpdateRequest(BaseSchema):
    status: AcademyChapterProgressStatus = (
        AcademyChapterProgressStatus.not_started
    )
    mark_opened: bool = False


AcademyChapterProgressUpdateRequest = ChapterProgressUpdateRequest


class ChapterProgressUpdateResponse(BaseSchema):
    chapter_id: int
    status: str
    last_opened_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    module_id: int
    module_progress_pct: int
    module_status: str
    course_progress_pct: int
    modules_completed: int
    chapters_completed: int


AcademyChapterProgressUpdateResponse = ChapterProgressUpdateResponse


class AcademyHistoryItem(BaseSchema):
    chapter_id: int
    chapter_title: str
    chapter_number: int
    module_id: int
    module_order_index: int
    module_title: str
    estimated_minutes: int
    status: str
    last_opened_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


AcademyHistoryItemResponse = AcademyHistoryItem


class AcademyHistoryResponse(BaseSchema):
    total: int
    page: int
    page_size: int
    total_pages: int
    data: List[AcademyHistoryItem] = []


from models.user_profile import (  # noqa: E402, F401
    UserProfileBase,
    UserProfileCreate,
    UserProfileUpdate,
    UserProfileUpdatePayload,
    UserProfileResponse,
)

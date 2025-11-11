from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from enum import Enum


class ImpactArea(str, Enum):
    income = "income_impact"
    env = "environmental_impact"


# ============================================================
# BASE CONFIG
# ============================================================
class BaseSchema(BaseModel):
    class Config:
        orm_mode = True


# ============================================================
# CATEGORY
# ============================================================
class PLCategoryRead(BaseSchema):
    id: int
    name: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class PLCategorySimpleRead(BaseSchema):
    id: int
    name: str


# ============================================================
# ATTRIBUTE
# ============================================================
class PLAttributeRead(BaseSchema):
    id: int
    label: str
    description: Optional[str] = None
    category_id: Optional[int] = None
    category: Optional[PLCategoryRead] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ✅ Simplified Attribute (for lightweight responses like `procurement_processes`)
class PLAttributeSimpleRead(BaseSchema):
    id: int
    label: str


# ============================================================
# CATEGORY WITH ATTRIBUTES (for /category/attributes endpoint)
# ============================================================
class PLCategoryWithAttributesRead(PLCategorySimpleRead):
    attributes: Optional[List[PLAttributeSimpleRead]] = []


# ============================================================
# INDICATOR + SCORE
# ============================================================
class PLIndicatorRead(BaseSchema):
    id: int
    name: str
    label: str
    description: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class PLPracticeInterventionIndicatorScoreRead(BaseSchema):
    id: int
    practice_intervention_id: int
    indicator_id: int
    score: Optional[float] = None
    indicator: Optional[PLIndicatorRead]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ============================================================
# TAG RELATIONSHIP (ATTRIBUTE LINK)
# ============================================================
class PLPracticeInterventionTagRead(BaseSchema):
    practice_intervention_id: int
    attribute_id: int
    attribute: Optional[PLAttributeRead]
    created_at: datetime
    updated_at: datetime


# ============================================================
# PRACTICE INTERVENTION (BASE)
# ============================================================
class PLPracticeInterventionRead(BaseSchema):
    id: int
    label: str
    intervention_definition: Optional[str] = None
    enabling_conditions: Optional[str] = None
    business_rationale: Optional[str] = None
    farmer_rationale: Optional[str] = None
    risks_n_trade_offs: Optional[str] = None
    intervention_impact_income: Optional[str] = None
    intervention_impact_env: Optional[str] = None
    source_or_evidence: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ============================================================
# LIST VIEW (LIGHTWEIGHT)
# ============================================================
class PLPracticeInterventionListItem(BaseSchema):
    id: int
    label: str
    procurement_processes: List[PLAttributeRead]
    is_environmental: bool
    is_income: bool
    scores: List[PLPracticeInterventionIndicatorScoreRead]
    created_at: datetime
    updated_at: datetime


# ============================================================
# DETAIL VIEW (MATCHES EXPECTED RESPONSE)
# ============================================================
class PLPracticeInterventionDetailRead(BaseSchema):
    id: int
    label: str
    procurement_processes: List[PLAttributeSimpleRead] = []
    is_environmental: bool = False
    is_income: bool = False
    scores: List[PLPracticeInterventionIndicatorScoreRead] = []
    created_at: datetime
    updated_at: datetime


# ============================================================
# PAGINATION / RESPONSE MODELS
# ============================================================
class PaginatedResponse(BaseSchema):
    current: int
    total: int
    total_page: int


class PaginatedPracticeInterventionResponse(PaginatedResponse):
    data: List[PLPracticeInterventionListItem]


# ============================================================
# PRACTICE BY ATTRIBUTE RESPONSE
# ============================================================
class PLPracticeByAttributeListItem(BaseSchema):
    id: int
    label: str
    is_environmental: bool
    is_income: bool
    tags: List[str]


class PaginatedPracticeByAttributeResponse(PaginatedResponse):
    data: List[PLPracticeByAttributeListItem]

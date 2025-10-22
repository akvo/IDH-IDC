from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


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


# ============================================================
# ATTRIBUTE
# ============================================================
class PLAttributeRead(BaseSchema):
    id: int
    label: str
    description: Optional[str] = None
    category_id: Optional[int] = None
    category: Optional[PLCategoryRead]
    created_at: datetime
    updated_at: datetime


# ============================================================
# INDICATOR + SCORE
# ============================================================
class PLIndicatorRead(BaseSchema):
    id: int
    name: str
    label: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class PLPracticeInterventionIndicatorScoreRead(BaseSchema):
    id: int
    practice_intervention_id: int
    indicator_id: int
    score: Optional[float] = None
    indicator: Optional[PLIndicatorRead]
    created_at: datetime
    updated_at: datetime


# ============================================================
# PRACTICE INTERVENTION (MAIN)
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
# TAG RELATIONSHIP (ATTRIBUTE LINK)
# ============================================================
class PLPracticeInterventionTagRead(BaseSchema):
    practice_intervention_id: int
    attribute_id: int
    attribute: Optional[PLAttributeRead]
    created_at: datetime
    updated_at: datetime


# ============================================================
# EXTENDED READ (LIST / DETAIL)
# ============================================================
class PLPracticeInterventionListItem(PLPracticeInterventionRead):
    procurement_processes: Optional[List[PLAttributeRead]] = []
    is_environmental: bool = False
    is_income: bool = False
    total_score: Optional[float] = None
    scores: Optional[List[PLPracticeInterventionIndicatorScoreRead]] = []


# ============================================================
# PAGINATION / RESPONSE MODELS
# ============================================================
class PaginatedResponse(BaseSchema):
    current: int
    total: int
    total_page: int


class PaginatedPracticeInterventionResponse(PaginatedResponse):
    data: List[PLPracticeInterventionListItem]

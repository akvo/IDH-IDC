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
class PLCategoryBase(BaseSchema):
    name: str
    description: Optional[str] = None


class PLCategoryCreate(PLCategoryBase):
    pass


class PLCategoryUpdate(BaseSchema):
    name: Optional[str] = None
    description: Optional[str] = None


class PLCategoryRead(PLCategoryBase):
    id: int
    created_at: datetime
    updated_at: datetime


# ============================================================
# ATTRIBUTE
# ============================================================
class PLAttributeBase(BaseSchema):
    label: str
    description: Optional[str] = None
    category_id: Optional[int] = None


class PLAttributeCreate(PLAttributeBase):
    pass


class PLAttributeUpdate(BaseSchema):
    label: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None


class PLAttributeRead(PLAttributeBase):
    id: int
    created_at: datetime
    updated_at: datetime
    category: Optional[PLCategoryRead]


# ============================================================
# PRACTICE INTERVENTION
# ============================================================
class PLPracticeInterventionBase(BaseSchema):
    label: str
    intervention_definition: Optional[str] = None
    enabling_conditions: Optional[str] = None
    business_rationale: Optional[str] = None
    farmer_rationale: Optional[str] = None
    risks_n_trade_offs: Optional[str] = None
    intervention_impact_income: Optional[str] = None
    intervention_impact_env: Optional[str] = None
    source_or_evidence: Optional[str] = None


class PLPracticeInterventionCreate(PLPracticeInterventionBase):
    attribute_ids: Optional[List[int]] = []  # For seeder or POST endpoint
    indicator_scores: Optional[List["PLPracticeInterventionIndicatorScoreCreate"]] = []


class PLPracticeInterventionUpdate(BaseSchema):
    label: Optional[str] = None
    intervention_definition: Optional[str] = None
    enabling_conditions: Optional[str] = None
    business_rationale: Optional[str] = None
    farmer_rationale: Optional[str] = None
    risks_n_trade_offs: Optional[str] = None
    intervention_impact_income: Optional[str] = None
    intervention_impact_env: Optional[str] = None
    source_or_evidence: Optional[str] = None
    attribute_ids: Optional[List[int]] = []
    indicator_scores: Optional[List["PLPracticeInterventionIndicatorScoreUpdate"]] = []


class PLPracticeInterventionRead(PLPracticeInterventionBase):
    id: int
    created_at: datetime
    updated_at: datetime


# ============================================================
# INDICATOR
# ============================================================
class PLIndicatorBase(BaseSchema):
    name: str
    label: str
    description: Optional[str] = None


class PLIndicatorCreate(PLIndicatorBase):
    pass


class PLIndicatorUpdate(BaseSchema):
    name: Optional[str] = None
    label: Optional[str] = None
    description: Optional[str] = None


class PLIndicatorRead(PLIndicatorBase):
    id: int
    created_at: datetime
    updated_at: datetime


# ============================================================
# PRACTICE INTERVENTION INDICATOR SCORE
# ============================================================
class PLPracticeInterventionIndicatorScoreBase(BaseSchema):
    practice_intervention_id: int
    indicator_id: int
    score: Optional[float] = None


class PLPracticeInterventionIndicatorScoreCreate(PLPracticeInterventionIndicatorScoreBase):
    pass


class PLPracticeInterventionIndicatorScoreUpdate(BaseSchema):
    score: Optional[float] = None


class PLPracticeInterventionIndicatorScoreRead(PLPracticeInterventionIndicatorScoreBase):
    id: int
    created_at: datetime
    updated_at: datetime
    indicator: Optional[PLIndicatorRead]


# ============================================================
# TAG RELATIONSHIP (Many-to-Many)
# ============================================================
class PLPracticeInterventionTagBase(BaseSchema):
    practice_intervention_id: int
    attribute_id: int


class PLPracticeInterventionTagCreate(PLPracticeInterventionTagBase):
    pass


class PLPracticeInterventionTagRead(PLPracticeInterventionTagBase):
    created_at: datetime
    updated_at: datetime
    attribute: Optional[PLAttributeRead]


# ============================================================
# EXTENDED READ MODELS (NESTED)
# ============================================================
class PLPracticeInterventionDetailRead(PLPracticeInterventionRead):
    attributes: Optional[List[PLAttributeRead]] = []
    indicator_scores: Optional[List[PLPracticeInterventionIndicatorScoreRead]] = []


# ============================================================
# PAGINATION / RESPONSE MODELS
# ============================================================
class PaginatedResponse(BaseSchema):
    current: int
    total: int
    total_page: int


class PaginatedPracticeInterventionResponse(PaginatedResponse):
    data: List[PLPracticeInterventionRead]

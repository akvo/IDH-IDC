from typing import List
from pydantic import BaseModel, ConfigDict, Field


class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class AcademyKpiStats(BaseSchema):
    registered_users: int = Field(
        ...,
        description="Total verified users with academy in tools and is_active=1",
    )
    active_users_30d: int = Field(
        ...,
        description="Cohort users with activity in academy progress in last 30 days",
    )
    companies_count: int = Field(
        ...,
        description="Distinct companies taking part in the cohort",
    )
    avg_modules_completed: float = Field(
        ...,
        description="Average number of completed modules out of 6 per user",
    )
    total_modules: int = Field(
        6,
        description="Total number of modules in the curriculum",
    )


class AcademyModuleDistributionBin(BaseSchema):
    modules_completed: int = Field(
        ...,
        ge=0,
        le=6,
        description="Number of modules completed (0 to 6)",
    )
    count: int = Field(
        ...,
        ge=0,
        description="Number of users who completed exactly this many modules",
    )
    percentage: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Percentage of total filtered cohort",
    )


class AcademyCompanyStatItem(BaseSchema):
    company: str = Field(
        ...,
        description="Company or organization name",
    )
    users_count: int = Field(
        ...,
        ge=1,
        description="Number of registered academy users in this company",
    )
    average_progress_pct: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Average chapter progress percentage across company users",
    )
    completed_all_modules_count: int = Field(
        ...,
        ge=0,
        description="Number of users in company who completed all 6 modules",
    )


class AcademyStatsFilterOptions(BaseSchema):
    years: List[int] = Field(
        default_factory=list,
        description="Available registration years for filtering",
    )
    regions: List[str] = Field(
        default_factory=list,
        description="Available region names for filtering",
    )
    sectors: List[str] = Field(
        default_factory=list,
        description="Available sector names for filtering",
    )


class AcademyUserStatsResponse(BaseSchema):
    kpis: AcademyKpiStats
    module_distribution: List[AcademyModuleDistributionBin]
    companies: List[AcademyCompanyStatItem]
    filter_options: AcademyStatsFilterOptions

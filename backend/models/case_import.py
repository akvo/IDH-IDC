import uuid
from datetime import datetime, timedelta

from sqlalchemy import Column, DateTime, Integer, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from db.connection import Base
from typing import List, Literal, Optional, Union
from pydantic import BaseModel, Field
from typing_extensions import TypedDict


class CaseSpreadSheetColumns(TypedDict):
    categorical: List[str]
    numerical: List[str]


class CaseImportResponse(TypedDict):
    import_id: str
    columns: CaseSpreadSheetColumns


class SegmentationPreviewRequest(BaseModel):
    import_id: str
    segmentation_variable: str
    variable_type: Literal["categorical", "numerical"]
    number_of_segments: Optional[int] = Field(
        None,
        description="Required when variable_type is numerical",
        ge=0,
    )


class SegmentDefinition(BaseModel):
    index: int
    name: str
    value: Union[int, float, str]


class GenerateSegmentValuesRequest(BaseModel):
    case_id: int
    import_id: str
    segmentation_variable: str
    segments: List[SegmentDefinition]


# class CategoricalCondition(BaseModel):
#     operator: Literal["is"]
#     value: str


# class NumericalCondition(BaseModel):
#     operator: Literal["<=", ">", "between"]
#     value: Union[float, List[float]]


class SegmentationSegment(BaseModel):
    index: int
    name: str
    operator: Union[Literal["<=", ">", "between"], Literal["is"]]
    value: Union[Union[float, List[float]], str]


class SegmentationPreviewResponse(BaseModel):
    import_id: str
    segmentation_variable: str
    variable_type: Literal["categorical", "numerical"]
    segments: List[SegmentationSegment]


class CaseImport(Base):
    __tablename__ = "case_import"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(
        Integer,
        ForeignKey("case.id", ondelete="CASCADE"),
        nullable=True,
    )
    user_id = Column(
        Integer,
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
    )
    file_path = Column(String, nullable=False)
    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )
    expires_at = Column(
        DateTime,
        default=lambda: datetime.utcnow() + timedelta(hours=24),
        nullable=False,
    )

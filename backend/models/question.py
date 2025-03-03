import enum
from db.connection import Base
from sqlalchemy import Column, Integer, String, ForeignKey, Enum
from sqlalchemy.orm import relationship
from typing import Optional, List
from typing_extensions import TypedDict
from pydantic import BaseModel
from models.commodity_category_question import CommodityCategoryQuestion
from models.commodity_category import CommodityCategory
from models.user import User


class QuestionType(enum.Enum):
    aggregator = "aggregator"
    question = "question"
    diversified = "diversified"


class QuestionGroupParam(TypedDict):
    commodity: int
    breakdown: bool


class QuestionDict(TypedDict):
    id: int
    parent: Optional[int]
    unit: Optional[str]
    question_type: QuestionType
    text: str
    description: Optional[str]
    default_value: Optional[str] = None
    created_by: Optional[int] = None
    childrens: Optional[List]


class QuestionGroupListDict(TypedDict):
    case_commodity_id: int
    case_commodity_type: str
    commodity_id: Optional[int]
    commodity_name: str
    questions: List[QuestionDict]


class Question(Base):
    __tablename__ = "question"

    id = Column(Integer, primary_key=True, nullable=False)
    parent = Column(Integer, ForeignKey("question.id"))
    question_type = Column(
        Enum(QuestionType, name="question_type"),
        nullable=False,
        default=QuestionType.question.value,
    )
    unit = Column(String, nullable=True)
    text = Column(String, nullable=False)
    description = Column(String, nullable=True)
    default_value = Column(String, nullable=True)
    created_by = Column(
        Integer, ForeignKey("user.id"), nullable=True, default=None
    )

    children = relationship("Question")
    parent_detail = relationship(
        "Question", remote_side=[id], overlaps="children"
    )
    created_by_user = relationship(
        User, cascade="all, delete", passive_deletes=True, backref="questions"
    )
    question_commodity_category_detail = relationship(
        CommodityCategory,
        secondary=CommodityCategoryQuestion.__tablename__,
        cascade="all, delete",
        passive_deletes=True,
        back_populates="commodity_category_questions",
    )

    def __init__(
        self,
        text: str,
        id: Optional[int] = None,
        parent: Optional[int] = None,
        unit: Optional[str] = None,
        question_type: Optional[QuestionType] = QuestionType.question,
        description: Optional[str] = None,
        default_value: Optional[str] = None,
        created_by: Optional[int] = None,
    ):
        self.id = id
        self.parent = parent
        self.unit = unit
        self.question_type = question_type
        self.text = text
        self.description = description
        self.default_value = default_value
        self.created_by = created_by

    def __repr__(self) -> int:
        return f"<Question {self.id}>"

    @property
    def serialize(self) -> QuestionDict:
        return {
            "id": self.id,
            "parent": self.parent,
            "unit": self.unit,
            "question_type": self.question_type.value,
            "text": self.text,
            "description": self.description,
            "default_value": self.default_value,
            "created_by": self.created_by,
            "childrens": [],
        }

    @property
    def serialize_with_child(self) -> QuestionDict:
        childrens = [c.serialize_with_child for c in self.children]
        return {
            "id": self.id,
            "parent": self.parent,
            "unit": self.unit,
            "question_type": self.question_type,
            "text": self.text,
            "description": self.description,
            "default_value": self.default_value,
            "created_by": self.created_by,
            "childrens": childrens,
        }


class QuestionBase(BaseModel):
    id: int
    parent: Optional[int] = None
    unit: Optional[str] = None
    text: str
    description: Optional[str] = None
    default_value: Optional[str] = None
    created_by: Optional[int] = None

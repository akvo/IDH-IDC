from datetime import datetime
import enum
from typing import Optional
from typing_extensions import TypedDict
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    Enum,
    func,
)

from db.connection import Base


# ============================================================
# 1. ACADEMY TAG
# ============================================================
class AcademyTagDict(TypedDict, total=False):
    id: int
    name: str
    slug: str
    order_index: int
    created_at: Optional[datetime]


class AcademyTag(Base):
    __tablename__ = "academy_tag"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    order_index = Column(Integer, default=0, nullable=False)
    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )

    def __init__(
        self,
        name: str,
        slug: str,
        order_index: int = 0,
        id: Optional[int] = None,
    ):
        self.id = id
        self.name = name
        self.slug = slug
        self.order_index = order_index

    def to_dict(self) -> AcademyTagDict:
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "order_index": self.order_index,
            "created_at": self.created_at,
        }


# ============================================================
# 2. ACADEMY RESOURCE
# ============================================================
class AcademyResourceType(str, enum.Enum):
    Guidance = "Guidance"
    Organisation = "Organisation"
    Template = "Template"
    Tool = "Tool"


class AcademyResourceDict(TypedDict, total=False):
    id: int
    name: str
    resource_type: str
    file_url: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]


class AcademyResource(Base):
    __tablename__ = "academy_resource"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    resource_type = Column(
        Enum(AcademyResourceType, name="academy_resource_type"),
        nullable=False,
        index=True,
    )
    file_url = Column(String(500), nullable=False)
    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )
    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    def __init__(
        self,
        name: str,
        resource_type: AcademyResourceType,
        file_url: str,
        id: Optional[int] = None,
    ):
        self.id = id
        self.name = name
        self.resource_type = resource_type
        self.file_url = file_url

    def to_dict(self) -> AcademyResourceDict:
        return {
            "id": self.id,
            "name": self.name,
            "resource_type": (
                self.resource_type.value
                if isinstance(self.resource_type, AcademyResourceType)
                else str(self.resource_type)
            ),
            "file_url": self.file_url,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


# ============================================================
# 3. ACADEMY GLOSSARY TERM
# ============================================================
class AcademyGlossaryTermType(str, enum.Enum):
    Core = "Core"
    Finance = "Finance"
    Additional = "Additional"


class AcademyGlossaryTermDict(TypedDict, total=False):
    id: int
    name: str
    term_type: str
    definition: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]


class AcademyGlossaryTerm(Base):
    __tablename__ = "academy_glossary_term"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False, index=True)
    term_type = Column(
        Enum(AcademyGlossaryTermType, name="academy_glossary_term_type"),
        nullable=False,
        index=True,
    )
    definition = Column(Text, nullable=False)
    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )
    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    def __init__(
        self,
        name: str,
        term_type: AcademyGlossaryTermType,
        definition: str,
        id: Optional[int] = None,
    ):
        self.id = id
        self.name = name
        self.term_type = term_type
        self.definition = definition

    def to_dict(self) -> AcademyGlossaryTermDict:
        return {
            "id": self.id,
            "name": self.name,
            "term_type": (
                self.term_type.value
                if isinstance(self.term_type, AcademyGlossaryTermType)
                else str(self.term_type)
            ),
            "definition": self.definition,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

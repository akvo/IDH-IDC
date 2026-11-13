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
    ForeignKey,
    CheckConstraint,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import relationship, backref

from db.connection import Base
from models.user import User  # noqa: F401


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


# ============================================================
# 4. ACADEMY MODULE
# ============================================================
class AcademyModuleDict(TypedDict, total=False):
    id: int
    order_index: int
    title: str
    description: Optional[str]
    estimated_minutes: int
    icon_theme: Optional[str]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]


class AcademyModule(Base):
    __tablename__ = "academy_module"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_index = Column(Integer, unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    estimated_minutes = Column(Integer, default=16, nullable=False)
    icon_theme = Column(String(50), nullable=True)
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

    chapters = relationship(
        "AcademyChapter",
        back_populates="module",
        cascade="all, delete-orphan",
        order_by="AcademyChapter.chapter_number",
    )
    tag_relations = relationship(
        "AcademyTagRelation",
        back_populates="module",
        cascade="all, delete-orphan",
    )

    def __init__(
        self,
        order_index: int,
        title: str,
        description: Optional[str] = None,
        estimated_minutes: int = 16,
        icon_theme: Optional[str] = None,
        id: Optional[int] = None,
    ):
        self.id = id
        self.order_index = order_index
        self.title = title
        self.description = description
        self.estimated_minutes = estimated_minutes
        self.icon_theme = icon_theme

    def to_dict(self) -> AcademyModuleDict:
        return {
            "id": self.id,
            "order_index": self.order_index,
            "title": self.title,
            "description": self.description,
            "estimated_minutes": self.estimated_minutes,
            "icon_theme": self.icon_theme,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


# ============================================================
# 5. ACADEMY CHAPTER
# ============================================================
class AcademyChapterDict(TypedDict, total=False):
    id: int
    module_id: int
    chapter_number: int
    title: str
    content_html: Optional[str]
    estimated_minutes: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]


class AcademyChapter(Base):
    __tablename__ = "academy_chapter"
    __table_args__ = (
        UniqueConstraint(
            "module_id",
            "chapter_number",
            name="uq_academy_chapter_module_number",
        ),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    module_id = Column(
        Integer,
        ForeignKey("academy_module.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    chapter_number = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False)
    content_html = Column(Text, nullable=True)
    estimated_minutes = Column(Integer, default=5, nullable=False)
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

    module = relationship(
        "AcademyModule",
        back_populates="chapters",
    )
    progress_records = relationship(
        "AcademyUserChapterProgress",
        back_populates="chapter",
        cascade="all, delete-orphan",
    )
    tag_relations = relationship(
        "AcademyTagRelation",
        back_populates="chapter",
        cascade="all, delete-orphan",
    )

    def __init__(
        self,
        module_id: int,
        chapter_number: int,
        title: str,
        content_html: Optional[str] = None,
        estimated_minutes: int = 5,
        id: Optional[int] = None,
    ):
        self.id = id
        self.module_id = module_id
        self.chapter_number = chapter_number
        self.title = title
        self.content_html = content_html
        self.estimated_minutes = estimated_minutes

    def to_dict(self) -> AcademyChapterDict:
        return {
            "id": self.id,
            "module_id": self.module_id,
            "chapter_number": self.chapter_number,
            "title": self.title,
            "content_html": self.content_html,
            "estimated_minutes": self.estimated_minutes,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


# ============================================================
# 6. ACADEMY TAG RELATION
# ============================================================
class AcademyTagRelationDict(TypedDict, total=False):
    id: int
    tag_id: int
    module_id: Optional[int]
    chapter_id: Optional[int]
    created_at: Optional[datetime]


class AcademyTagRelation(Base):
    __tablename__ = "academy_tag_relation"
    __table_args__ = (
        CheckConstraint(
            "(module_id IS NOT NULL AND chapter_id IS NULL) OR "
            "(module_id IS NULL AND chapter_id IS NOT NULL)",
            name="ck_academy_tag_relation_target_xor",
        ),
        UniqueConstraint(
            "tag_id",
            "module_id",
            name="uq_academy_tag_relation_tag_module",
        ),
        UniqueConstraint(
            "tag_id",
            "chapter_id",
            name="uq_academy_tag_relation_tag_chapter",
        ),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    tag_id = Column(
        Integer,
        ForeignKey("academy_tag.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    module_id = Column(
        Integer,
        ForeignKey("academy_module.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    chapter_id = Column(
        Integer,
        ForeignKey("academy_chapter.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )

    tag = relationship(
        "AcademyTag",
        backref=backref("tag_relations", cascade="all, delete-orphan"),
    )
    module = relationship(
        "AcademyModule",
        back_populates="tag_relations",
    )
    chapter = relationship(
        "AcademyChapter",
        back_populates="tag_relations",
    )

    def __init__(
        self,
        tag_id: int,
        module_id: Optional[int] = None,
        chapter_id: Optional[int] = None,
        id: Optional[int] = None,
    ):
        self.id = id
        self.tag_id = tag_id
        self.module_id = module_id
        self.chapter_id = chapter_id

    def to_dict(self) -> AcademyTagRelationDict:
        return {
            "id": self.id,
            "tag_id": self.tag_id,
            "module_id": self.module_id,
            "chapter_id": self.chapter_id,
            "created_at": self.created_at,
        }


# ============================================================
# 7. ACADEMY USER CHAPTER PROGRESS
# ============================================================
class AcademyChapterProgressStatus(str, enum.Enum):
    not_started = "not_started"
    in_progress = "in_progress"
    completed = "completed"


class AcademyUserChapterProgressDict(TypedDict, total=False):
    id: int
    user_id: int
    chapter_id: int
    status: str
    last_opened_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]


class AcademyUserChapterProgress(Base):
    __tablename__ = "academy_user_chapter_progress"
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "chapter_id",
            name="uq_academy_user_chapter_progress_user_chapter",
        ),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(
        Integer,
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    chapter_id = Column(
        Integer,
        ForeignKey("academy_chapter.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status = Column(
        Enum(
            AcademyChapterProgressStatus,
            name="academy_chapter_progress_status",
        ),
        default=AcademyChapterProgressStatus.not_started,
        nullable=False,
        index=True,
    )
    last_opened_at = Column(DateTime, nullable=True, index=True)
    completed_at = Column(DateTime, nullable=True)
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

    user = relationship(
        "User",
        backref=backref("academy_chapter_progress", cascade="all, delete-orphan"),
    )
    chapter = relationship(
        "AcademyChapter",
        back_populates="progress_records",
    )

    def __init__(
        self,
        user_id: int,
        chapter_id: int,
        status: AcademyChapterProgressStatus = AcademyChapterProgressStatus.not_started,
        last_opened_at: Optional[datetime] = None,
        completed_at: Optional[datetime] = None,
        id: Optional[int] = None,
    ):
        self.id = id
        self.user_id = user_id
        self.chapter_id = chapter_id
        self.status = status
        self.last_opened_at = last_opened_at
        self.completed_at = completed_at

    def to_dict(self) -> AcademyUserChapterProgressDict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "chapter_id": self.chapter_id,
            "status": (
                self.status.value
                if isinstance(self.status, AcademyChapterProgressStatus)
                else str(self.status)
            ),
            "last_opened_at": self.last_opened_at,
            "completed_at": self.completed_at,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

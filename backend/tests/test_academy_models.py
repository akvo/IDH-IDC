from datetime import datetime
import pytest
from pydantic import ValidationError
from sqlalchemy import (
    Integer,
    String,
    Text,
    DateTime,
    Enum,
    CheckConstraint,
    UniqueConstraint,
)

from models.academy import (
    AcademyTag,
    AcademyTagDict,
    AcademyTagBase,
    AcademyTagCreate,
    AcademyTagUpdate,
    AcademyTagResponse,
    AcademyResource,
    AcademyResourceType,
    AcademyResourceDict,
    AcademyResourceBase,
    AcademyResourceCreate,
    AcademyResourceUpdate,
    AcademyResourceResponse,
    AcademyGlossaryTerm,
    AcademyGlossaryTermType,
    AcademyGlossaryTermDict,
    AcademyGlossaryTermBase,
    AcademyGlossaryTermCreate,
    AcademyGlossaryTermUpdate,
    AcademyGlossaryTermResponse,
    AcademyModule,
    AcademyModuleDict,
    AcademyModuleBase,
    AcademyModuleCreate,
    AcademyModuleUpdate,
    AcademyModuleResponse,
    AcademyChapter,
    AcademyChapterDict,
    AcademyChapterBase,
    AcademyChapterCreate,
    AcademyChapterUpdate,
    AcademyChapterResponse,
    AcademyTagRelation,
    AcademyTagRelationDict,
    AcademyTagRelationBase,
    AcademyTagRelationCreate,
    AcademyTagRelationResponse,
    AcademyUserChapterProgress,
    AcademyChapterProgressStatus,
    AcademyUserChapterProgressDict,
    AcademyUserChapterProgressBase,
    AcademyUserChapterProgressCreate,
    AcademyUserChapterProgressUpdate,
    AcademyUserChapterProgressResponse,
)


# ============================================================
# 1. ACADEMY TAG TESTS
# ============================================================
class TestAcademyTagModel:
    def test_table_name_and_columns(self):
        assert AcademyTag.__tablename__ == "academy_tag"

        # Check primary key
        id_col = AcademyTag.__table__.c.id
        assert isinstance(id_col.type, Integer)
        assert id_col.primary_key is True

        # Check name and slug
        name_col = AcademyTag.__table__.c.name
        assert isinstance(name_col.type, String)
        assert name_col.type.length == 100
        assert name_col.nullable is False
        assert name_col.unique is True

        slug_col = AcademyTag.__table__.c.slug
        assert isinstance(slug_col.type, String)
        assert slug_col.type.length == 100
        assert slug_col.nullable is False
        assert slug_col.unique is True

        # Check order_index and created_at
        order_col = AcademyTag.__table__.c.order_index
        assert isinstance(order_col.type, Integer)
        assert order_col.nullable is False

        created_col = AcademyTag.__table__.c.created_at
        assert isinstance(created_col.type, DateTime)

    def test_instantiation_and_to_dict(self):
        tag = AcademyTag(
            name="Income measurement",
            slug="income-measurement",
            order_index=1,
        )
        assert tag.name == "Income measurement"
        assert tag.slug == "income-measurement"
        assert tag.order_index == 1

        d: AcademyTagDict = tag.to_dict()
        assert d["name"] == "Income measurement"
        assert d["slug"] == "income-measurement"
        assert d["order_index"] == 1

    def test_pydantic_schemas(self):
        # Base schema
        base_data = AcademyTagBase(name="Base Tag", slug="base-tag")
        assert base_data.order_index == 0

        # Create schema
        create_data = AcademyTagCreate(
            name="Income gap",
            slug="income-gap",
            order_index=2,
        )
        assert create_data.name == "Income gap"
        assert create_data.slug == "income-gap"

        # Update schema
        update_data = AcademyTagUpdate(name="Updated Tag")
        assert update_data.name == "Updated Tag"
        assert update_data.slug is None

        # Response schema
        now = datetime.now()
        res = AcademyTagResponse(
            id=1,
            name="Income gap",
            slug="income-gap",
            order_index=2,
            created_at=now,
        )
        assert res.id == 1
        assert res.name == "Income gap"


# ============================================================
# 2. ACADEMY RESOURCE TESTS
# ============================================================
class TestAcademyResourceModel:
    def test_table_name_and_columns(self):
        assert AcademyResource.__tablename__ == "academy_resource"

        # Check columns
        id_col = AcademyResource.__table__.c.id
        assert isinstance(id_col.type, Integer)
        assert id_col.primary_key is True

        name_col = AcademyResource.__table__.c.name
        assert isinstance(name_col.type, String)
        assert name_col.type.length == 255
        assert name_col.nullable is False

        file_url_col = AcademyResource.__table__.c.file_url
        assert isinstance(file_url_col.type, String)
        assert file_url_col.type.length == 500
        assert file_url_col.nullable is False

        # Enum column
        type_col = AcademyResource.__table__.c.resource_type
        assert isinstance(type_col.type, Enum)
        assert type_col.type.name == "academy_resource_type"
        assert set(type_col.type.enums) == {
            "Guidance",
            "Organisation",
            "Template",
            "Tool",
        }

        # Timestamps
        assert isinstance(AcademyResource.__table__.c.created_at.type, DateTime)
        assert isinstance(AcademyResource.__table__.c.updated_at.type, DateTime)

    def test_instantiation_and_to_dict(self):
        resource = AcademyResource(
            name="Tech requirements.pdf",
            resource_type=AcademyResourceType.Guidance,
            file_url="/assets/academy/tech_requirements.pdf",
        )
        assert resource.name == "Tech requirements.pdf"
        assert resource.resource_type == AcademyResourceType.Guidance
        assert resource.file_url == "/assets/academy/tech_requirements.pdf"

        d: AcademyResourceDict = resource.to_dict()
        assert d["name"] == "Tech requirements.pdf"
        assert d["resource_type"] == "Guidance"
        assert d["file_url"] == "/assets/academy/tech_requirements.pdf"

    def test_pydantic_schemas(self):
        base_data = AcademyResourceBase(
            name="Base.pdf",
            resource_type=AcademyResourceType.Guidance,
            file_url="/base.pdf",
        )
        assert base_data.name == "Base.pdf"

        create_data = AcademyResourceCreate(
            name="Calculation Template.xlsx",
            resource_type=AcademyResourceType.Template,
            file_url="/assets/academy/template.xlsx",
        )
        assert create_data.name == "Calculation Template.xlsx"
        assert create_data.resource_type == AcademyResourceType.Template

        update_data = AcademyResourceUpdate(name="Updated Name.pdf")
        assert update_data.name == "Updated Name.pdf"
        assert update_data.file_url is None

        # Invalid enum value fails validation
        with pytest.raises(ValidationError):
            AcademyResourceCreate(
                name="Invalid.pdf",
                resource_type="InvalidType",
                file_url="/test.pdf",
            )

        now = datetime.now()
        res = AcademyResourceResponse(
            id=10,
            name="Tool.zip",
            resource_type=AcademyResourceType.Tool,
            file_url="/tool.zip",
            created_at=now,
            updated_at=now,
        )
        assert res.id == 10
        assert res.resource_type == AcademyResourceType.Tool


# ============================================================
# 3. ACADEMY GLOSSARY TERM TESTS
# ============================================================
class TestAcademyGlossaryTermModel:
    def test_table_name_and_columns(self):
        assert AcademyGlossaryTerm.__tablename__ == "academy_glossary_term"

        id_col = AcademyGlossaryTerm.__table__.c.id
        assert isinstance(id_col.type, Integer)
        assert id_col.primary_key is True

        name_col = AcademyGlossaryTerm.__table__.c.name
        assert isinstance(name_col.type, String)
        assert name_col.type.length == 255
        assert name_col.nullable is False

        definition_col = AcademyGlossaryTerm.__table__.c.definition
        assert isinstance(definition_col.type, Text)
        assert definition_col.nullable is False

        # Enum column
        type_col = AcademyGlossaryTerm.__table__.c.term_type
        assert isinstance(type_col.type, Enum)
        assert type_col.type.name == "academy_glossary_term_type"
        assert set(type_col.type.enums) == {"Core", "Finance", "Additional"}

        # Timestamps
        assert isinstance(
            AcademyGlossaryTerm.__table__.c.created_at.type, DateTime
        )
        assert isinstance(
            AcademyGlossaryTerm.__table__.c.updated_at.type, DateTime
        )

    def test_instantiation_and_to_dict(self):
        term = AcademyGlossaryTerm(
            name="Actual income",
            term_type=AcademyGlossaryTermType.Core,
            definition="Total household income from all sources over a year.",
        )
        assert term.name == "Actual income"
        assert term.term_type == AcademyGlossaryTermType.Core
        assert "Total household income" in term.definition

        d: AcademyGlossaryTermDict = term.to_dict()
        assert d["name"] == "Actual income"
        assert d["term_type"] == "Core"
        assert d["definition"] == term.definition

    def test_pydantic_schemas(self):
        base_data = AcademyGlossaryTermBase(
            name="Base Term",
            term_type=AcademyGlossaryTermType.Core,
            definition="A foundational concept.",
        )
        assert base_data.name == "Base Term"

        create_data = AcademyGlossaryTermCreate(
            name="Cost of Living",
            term_type=AcademyGlossaryTermType.Finance,
            definition="The amount of money needed to cover basic expenses.",
        )
        assert create_data.name == "Cost of Living"
        assert create_data.term_type == AcademyGlossaryTermType.Finance

        update_data = AcademyGlossaryTermUpdate(
            definition="Updated definition."
        )
        assert update_data.definition == "Updated definition."
        assert update_data.name is None

        with pytest.raises(ValidationError):
            AcademyGlossaryTermCreate(
                name="Invalid",
                term_type="InvalidEnum",
                definition="Bad enum",
            )

        now = datetime.now()
        res = AcademyGlossaryTermResponse(
            id=5,
            name="Cost of Living",
            term_type=AcademyGlossaryTermType.Finance,
            definition="The amount of money needed to cover basic expenses.",
            created_at=now,
            updated_at=now,
        )
        assert res.id == 5
        assert res.term_type == AcademyGlossaryTermType.Finance


# ============================================================
# 4. ACADEMY MODULE TESTS
# ============================================================
class TestAcademyModuleModel:
    def test_table_name_and_columns(self):
        assert AcademyModule.__tablename__ == "academy_module"

        id_col = AcademyModule.__table__.c.id
        assert isinstance(id_col.type, Integer)
        assert id_col.primary_key is True

        order_col = AcademyModule.__table__.c.order_index
        assert isinstance(order_col.type, Integer)
        assert order_col.nullable is False
        assert order_col.unique is True

        title_col = AcademyModule.__table__.c.title
        assert isinstance(title_col.type, String)
        assert title_col.type.length == 255
        assert title_col.nullable is False

        desc_col = AcademyModule.__table__.c.description
        assert isinstance(desc_col.type, Text)
        assert desc_col.nullable is True

        mins_col = AcademyModule.__table__.c.estimated_minutes
        assert isinstance(mins_col.type, Integer)
        assert mins_col.nullable is False

        icon_col = AcademyModule.__table__.c.icon_theme
        assert isinstance(icon_col.type, String)
        assert icon_col.type.length == 50
        assert icon_col.nullable is True

        assert isinstance(AcademyModule.__table__.c.created_at.type, DateTime)
        assert isinstance(AcademyModule.__table__.c.updated_at.type, DateTime)

    def test_instantiation_and_to_dict(self):
        module = AcademyModule(
            order_index=1,
            title="The concept of living income",
            description="Establish a solid foundation to act on living income.",
            estimated_minutes=16,
            icon_theme="blue",
        )
        assert module.order_index == 1
        assert module.title == "The concept of living income"
        assert module.description.startswith("Establish a solid foundation")
        assert module.estimated_minutes == 16
        assert module.icon_theme == "blue"

        d: AcademyModuleDict = module.to_dict()
        assert d["order_index"] == 1
        assert d["title"] == "The concept of living income"
        assert d["estimated_minutes"] == 16
        assert d["icon_theme"] == "blue"

    def test_pydantic_schemas(self):
        base = AcademyModuleBase(order_index=1, title="Base Module")
        assert base.estimated_minutes == 16
        assert base.description is None
        assert base.icon_theme is None

        create = AcademyModuleCreate(
            order_index=2,
            title="Measuring the income gap",
            description="Learn how to measure farmer household income.",
            estimated_minutes=20,
            icon_theme="green",
        )
        assert create.order_index == 2
        assert create.title == "Measuring the income gap"

        update = AcademyModuleUpdate(title="New Title", estimated_minutes=25)
        assert update.title == "New Title"
        assert update.estimated_minutes == 25
        assert update.order_index is None

        now = datetime.now()
        res = AcademyModuleResponse(
            id=1,
            order_index=1,
            title="Module 1",
            description="Summary",
            estimated_minutes=16,
            icon_theme="pink",
            created_at=now,
            updated_at=now,
        )
        assert res.id == 1
        assert res.icon_theme == "pink"

    def test_module_relationships(self):
        assert hasattr(AcademyModule, "chapters")
        assert hasattr(AcademyModule, "tag_relations")


# ============================================================
# 5. ACADEMY CHAPTER TESTS
# ============================================================
class TestAcademyChapterModel:
    def test_table_name_and_columns(self):
        assert AcademyChapter.__tablename__ == "academy_chapter"

        id_col = AcademyChapter.__table__.c.id
        assert isinstance(id_col.type, Integer)
        assert id_col.primary_key is True

        module_id_col = AcademyChapter.__table__.c.module_id
        assert isinstance(module_id_col.type, Integer)
        assert module_id_col.nullable is False
        fk_targets = [fk.target_fullname for fk in module_id_col.foreign_keys]
        assert "academy_module.id" in fk_targets

        num_col = AcademyChapter.__table__.c.chapter_number
        assert isinstance(num_col.type, Integer)
        assert num_col.nullable is False

        title_col = AcademyChapter.__table__.c.title
        assert isinstance(title_col.type, String)
        assert title_col.type.length == 255
        assert title_col.nullable is False

        content_col = AcademyChapter.__table__.c.content_html
        assert isinstance(content_col.type, Text)
        assert content_col.nullable is True

        mins_col = AcademyChapter.__table__.c.estimated_minutes
        assert isinstance(mins_col.type, Integer)
        assert mins_col.nullable is False

        assert isinstance(AcademyChapter.__table__.c.created_at.type, DateTime)
        assert isinstance(AcademyChapter.__table__.c.updated_at.type, DateTime)

    def test_unique_constraint(self):
        uq_constraints = [
            c
            for c in AcademyChapter.__table__.constraints
            if isinstance(c, UniqueConstraint)
        ]
        col_sets = [{col.name for col in c.columns} for c in uq_constraints]
        assert {"module_id", "chapter_number"} in col_sets

    def test_instantiation_and_to_dict(self):
        chapter = AcademyChapter(
            module_id=1,
            chapter_number=1,
            title="Introduction to Living Income",
            content_html="<h2>Living Income Benchmark</h2><p>Overview...</p>",
            estimated_minutes=5,
        )
        assert chapter.module_id == 1
        assert chapter.chapter_number == 1
        assert chapter.title == "Introduction to Living Income"
        assert "Living Income Benchmark" in chapter.content_html
        assert chapter.estimated_minutes == 5

        d: AcademyChapterDict = chapter.to_dict()
        assert d["module_id"] == 1
        assert d["chapter_number"] == 1
        assert d["title"] == "Introduction to Living Income"
        assert d["content_html"] == chapter.content_html
        assert d["estimated_minutes"] == 5

    def test_pydantic_schemas(self):
        base = AcademyChapterBase(
            module_id=1,
            chapter_number=1,
            title="Base Chapter",
        )
        assert base.estimated_minutes == 5
        assert base.content_html is None

        create = AcademyChapterCreate(
            module_id=1,
            chapter_number=2,
            title="What is a Living Income?",
            content_html="<p>Detailed explanation.</p>",
            estimated_minutes=7,
        )
        assert create.module_id == 1
        assert create.chapter_number == 2
        assert create.estimated_minutes == 7

        update = AcademyChapterUpdate(
            title="Updated Title",
            content_html="<p>New content</p>",
        )
        assert update.title == "Updated Title"
        assert update.content_html == "<p>New content</p>"
        assert update.chapter_number is None

        now = datetime.now()
        res = AcademyChapterResponse(
            id=10,
            module_id=1,
            chapter_number=2,
            title="What is a Living Income?",
            content_html="<p>Detailed explanation.</p>",
            estimated_minutes=7,
            created_at=now,
            updated_at=now,
        )
        assert res.id == 10
        assert res.title == "What is a Living Income?"

    def test_chapter_relationships(self):
        assert hasattr(AcademyChapter, "module")
        assert hasattr(AcademyChapter, "progress_records")
        assert hasattr(AcademyChapter, "tag_relations")


# ============================================================
# 6. ACADEMY TAG RELATION TESTS
# ============================================================
class TestAcademyTagRelationModel:
    def test_table_name_and_columns(self):
        assert AcademyTagRelation.__tablename__ == "academy_tag_relation"

        id_col = AcademyTagRelation.__table__.c.id
        assert isinstance(id_col.type, Integer)
        assert id_col.primary_key is True

        tag_col = AcademyTagRelation.__table__.c.tag_id
        assert isinstance(tag_col.type, Integer)
        assert tag_col.nullable is False
        assert "academy_tag.id" in [fk.target_fullname for fk in tag_col.foreign_keys]

        module_col = AcademyTagRelation.__table__.c.module_id
        assert isinstance(module_col.type, Integer)
        assert module_col.nullable is True
        assert "academy_module.id" in [
            fk.target_fullname for fk in module_col.foreign_keys
        ]

        chapter_col = AcademyTagRelation.__table__.c.chapter_id
        assert isinstance(chapter_col.type, Integer)
        assert chapter_col.nullable is True
        assert "academy_chapter.id" in [
            fk.target_fullname for fk in chapter_col.foreign_keys
        ]

        assert isinstance(
            AcademyTagRelation.__table__.c.created_at.type, DateTime
        )

    def test_constraints_and_xor_definition(self):
        ck_constraints = [
            c
            for c in AcademyTagRelation.__table__.constraints
            if isinstance(c, CheckConstraint)
        ]
        ck_names = [c.name for c in ck_constraints]
        assert "ck_academy_tag_relation_target_xor" in ck_names

        uq_constraints = [
            c
            for c in AcademyTagRelation.__table__.constraints
            if isinstance(c, UniqueConstraint)
        ]
        col_sets = [{col.name for col in c.columns} for c in uq_constraints]
        assert {"tag_id", "module_id"} in col_sets
        assert {"tag_id", "chapter_id"} in col_sets

    def test_instantiation_and_to_dict(self):
        # Module tag relation
        rel_mod = AcademyTagRelation(tag_id=1, module_id=2)
        assert rel_mod.tag_id == 1
        assert rel_mod.module_id == 2
        assert rel_mod.chapter_id is None

        d_mod: AcademyTagRelationDict = rel_mod.to_dict()
        assert d_mod["tag_id"] == 1
        assert d_mod["module_id"] == 2
        assert d_mod["chapter_id"] is None

        # Chapter tag relation
        rel_ch = AcademyTagRelation(tag_id=2, chapter_id=5)
        assert rel_ch.tag_id == 2
        assert rel_ch.module_id is None
        assert rel_ch.chapter_id == 5

        d_ch: AcademyTagRelationDict = rel_ch.to_dict()
        assert d_ch["tag_id"] == 2
        assert d_ch["chapter_id"] == 5

    def test_pydantic_schemas(self):
        base_mod = AcademyTagRelationBase(tag_id=1, module_id=3)
        assert base_mod.tag_id == 1
        assert base_mod.module_id == 3
        assert base_mod.chapter_id is None

        base_ch = AcademyTagRelationBase(tag_id=1, chapter_id=4)
        assert base_ch.chapter_id == 4

        create = AcademyTagRelationCreate(tag_id=2, chapter_id=6)
        assert create.tag_id == 2
        assert create.chapter_id == 6

        now = datetime.now()
        res = AcademyTagRelationResponse(
            id=100,
            tag_id=2,
            module_id=1,
            created_at=now,
        )
        assert res.id == 100
        assert res.module_id == 1


# ============================================================
# 7. ACADEMY USER CHAPTER PROGRESS TESTS
# ============================================================
class TestAcademyUserChapterProgressModel:
    def test_table_name_and_columns(self):
        assert (
            AcademyUserChapterProgress.__tablename__
            == "academy_user_chapter_progress"
        )

        id_col = AcademyUserChapterProgress.__table__.c.id
        assert isinstance(id_col.type, Integer)
        assert id_col.primary_key is True

        user_col = AcademyUserChapterProgress.__table__.c.user_id
        assert isinstance(user_col.type, Integer)
        assert user_col.nullable is False
        assert "user.id" in [fk.target_fullname for fk in user_col.foreign_keys]

        chapter_col = AcademyUserChapterProgress.__table__.c.chapter_id
        assert isinstance(chapter_col.type, Integer)
        assert chapter_col.nullable is False
        assert "academy_chapter.id" in [
            fk.target_fullname for fk in chapter_col.foreign_keys
        ]

        status_col = AcademyUserChapterProgress.__table__.c.status
        assert isinstance(status_col.type, Enum)
        assert status_col.type.name == "academy_chapter_progress_status"
        assert set(status_col.type.enums) == {
            "not_started",
            "in_progress",
            "completed",
        }
        assert status_col.nullable is False

        assert isinstance(
            AcademyUserChapterProgress.__table__.c.last_opened_at.type, DateTime
        )
        assert isinstance(
            AcademyUserChapterProgress.__table__.c.completed_at.type, DateTime
        )
        assert isinstance(
            AcademyUserChapterProgress.__table__.c.created_at.type, DateTime
        )
        assert isinstance(
            AcademyUserChapterProgress.__table__.c.updated_at.type, DateTime
        )

    def test_unique_constraint(self):
        uq_constraints = [
            c
            for c in AcademyUserChapterProgress.__table__.constraints
            if isinstance(c, UniqueConstraint)
        ]
        col_sets = [{col.name for col in c.columns} for c in uq_constraints]
        assert {"user_id", "chapter_id"} in col_sets

    def test_instantiation_and_to_dict(self):
        # Default status
        prog = AcademyUserChapterProgress(user_id=10, chapter_id=2)
        assert prog.user_id == 10
        assert prog.chapter_id == 2
        assert prog.status == AcademyChapterProgressStatus.not_started
        assert prog.last_opened_at is None
        assert prog.completed_at is None

        d: AcademyUserChapterProgressDict = prog.to_dict()
        assert d["user_id"] == 10
        assert d["chapter_id"] == 2
        assert d["status"] == "not_started"

        # Explicit in_progress
        now = datetime.now()
        prog2 = AcademyUserChapterProgress(
            user_id=10,
            chapter_id=3,
            status=AcademyChapterProgressStatus.in_progress,
            last_opened_at=now,
        )
        assert prog2.status == AcademyChapterProgressStatus.in_progress
        assert prog2.last_opened_at == now
        assert prog2.to_dict()["status"] == "in_progress"

        # Explicit completed
        prog3 = AcademyUserChapterProgress(
            user_id=10,
            chapter_id=4,
            status=AcademyChapterProgressStatus.completed,
            last_opened_at=now,
            completed_at=now,
        )
        assert prog3.status == AcademyChapterProgressStatus.completed
        assert prog3.to_dict()["status"] == "completed"

    def test_pydantic_schemas(self):
        base = AcademyUserChapterProgressBase(user_id=10, chapter_id=1)
        assert base.status == AcademyChapterProgressStatus.not_started
        assert base.last_opened_at is None
        assert base.completed_at is None

        create = AcademyUserChapterProgressCreate(
            user_id=10,
            chapter_id=2,
            status=AcademyChapterProgressStatus.in_progress,
        )
        assert create.status == AcademyChapterProgressStatus.in_progress

        update = AcademyUserChapterProgressUpdate(
            status=AcademyChapterProgressStatus.completed,
            completed_at=datetime.now(),
        )
        assert update.status == AcademyChapterProgressStatus.completed
        assert update.last_opened_at is None

        # Invalid enum fails validation
        with pytest.raises(ValidationError):
            AcademyUserChapterProgressCreate(
                user_id=10,
                chapter_id=2,
                status="invalid_status",
            )

        now = datetime.now()
        res = AcademyUserChapterProgressResponse(
            id=50,
            user_id=10,
            chapter_id=2,
            status=AcademyChapterProgressStatus.completed,
            last_opened_at=now,
            completed_at=now,
            created_at=now,
            updated_at=now,
        )
        assert res.id == 50
        assert res.status == AcademyChapterProgressStatus.completed


# ============================================================
# 8. MURAT'S 5-POINT CHECKLIST & DOMAIN INVARIANTS
# ============================================================
class TestAcademyDomainInvariantsAndChecklist:
    def test_module_has_no_content_html(self):
        """Modules must contain plain text summary (description) only, no content_html."""
        assert hasattr(AcademyModule, "content_html") is False
        assert hasattr(AcademyModule, "description") is True
        assert hasattr(AcademyChapter, "content_html") is True
        assert isinstance(AcademyModule.__table__.c.description.type, Text)
        assert isinstance(AcademyChapter.__table__.c.content_html.type, Text)

    def test_tag_relation_xor_check_constraint_sql(self):
        """CheckConstraint enforces exactly one of module_id or chapter_id is set."""
        ck_constraints = [
            c
            for c in AcademyTagRelation.__table__.constraints
            if isinstance(c, CheckConstraint)
        ]
        target_ck = next(
            (c for c in ck_constraints if c.name == "ck_academy_tag_relation_target_xor"),
            None,
        )
        assert target_ck is not None
        sql_text = str(target_ck.sqltext)
        assert "module_id IS NOT NULL" in sql_text
        assert "chapter_id IS NULL" in sql_text
        assert "module_id IS NULL" in sql_text
        assert "chapter_id IS NOT NULL" in sql_text

    def test_progress_status_enum_values_and_roundtrip(self):
        """AcademyChapterProgressStatus must contain exactly not_started, in_progress, completed."""
        enum_values = set(e.value for e in AcademyChapterProgressStatus)
        assert enum_values == {"not_started", "in_progress", "completed"}

    def test_all_unique_constraints_presence(self):
        """Verify all critical composite unique constraints exist in table schemas."""
        # Chapter module+number
        chapter_uqs = [
            c.name
            for c in AcademyChapter.__table__.constraints
            if isinstance(c, UniqueConstraint)
        ]
        assert "uq_academy_chapter_module_number" in chapter_uqs

        # Tag relation tag+module and tag+chapter
        tag_rel_uqs = [
            c.name
            for c in AcademyTagRelation.__table__.constraints
            if isinstance(c, UniqueConstraint)
        ]
        assert "uq_academy_tag_relation_tag_module" in tag_rel_uqs
        assert "uq_academy_tag_relation_tag_chapter" in tag_rel_uqs

        # User chapter progress user+chapter
        prog_uqs = [
            c.name
            for c in AcademyUserChapterProgress.__table__.constraints
            if isinstance(c, UniqueConstraint)
        ]
        assert "uq_academy_user_chapter_progress_user_chapter" in prog_uqs

from datetime import datetime
import pytest
from pydantic import ValidationError
from sqlalchemy import Integer, String, Text, DateTime, Enum

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

        update_data = AcademyGlossaryTermUpdate(definition="Updated definition.")
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

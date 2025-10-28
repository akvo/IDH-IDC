import pytest
import sys
import subprocess
from fastapi import FastAPI
from sqlalchemy.orm import Session

from models.procurement_library_v2.pl_models import (
    PLCategory,
    PLAttribute,
    PLIndicator,
    PLPracticeIntervention,
    PLPracticeInterventionTag,
    PLPracticeInterventionIndicatorScore,
)

sys.path.append("..")


@pytest.fixture(scope="module", autouse=True)
def setup_module():
    # Run the seeder before executing tests
    subprocess.run(["python", "-m", "seeder.procurement_library_v2"], check=True)


class TestProcurementLibraryV2Models:
    # ============================================================
    # CATEGORY & ATTRIBUTE
    # ============================================================
    def test_total_categories(self, app: FastAPI, session: Session):
        total_categories = session.query(PLCategory).count()
        assert total_categories > 0, "No PLCategory records found"

    def test_total_attributes(self, app: FastAPI, session: Session):
        total_attributes = session.query(PLAttribute).count()
        assert total_attributes > 0, "No PLAttribute records found"

    def test_category_attribute_relationship(self, app: FastAPI, session: Session):
        category = session.query(PLCategory).first()
        assert category is not None, "No category found"
        assert len(category.attributes) > 0, "Category has no related attributes"

    # ============================================================
    # INDICATORS & SCORES
    # ============================================================
    def test_total_indicators(self, app: FastAPI, session: Session):
        total_indicators = session.query(PLIndicator).count()
        assert total_indicators > 0, "No PLIndicator records found"

    def test_total_indicator_scores(self, app: FastAPI, session: Session):
        total_scores = session.query(PLPracticeInterventionIndicatorScore).count()
        assert total_scores > 0, "No PLPracticeInterventionIndicatorScore records found"

    def test_indicator_score_relationship(self, app: FastAPI, session: Session):
        score = session.query(PLPracticeInterventionIndicatorScore).first()
        assert score.indicator is not None, "Indicator relationship not loaded"
        assert score.practice_intervention is not None, "PracticeIntervention relationship not loaded"

    # ============================================================
    # PRACTICES & TAGS
    # ============================================================
    def test_total_practices(self, app: FastAPI, session: Session):
        total_practices = session.query(PLPracticeIntervention).count()
        assert total_practices > 0, "No PLPracticeIntervention records found"

    def test_total_tags(self, app: FastAPI, session: Session):
        total_tags = session.query(PLPracticeInterventionTag).count()
        assert total_tags > 0, "No PLPracticeInterventionTag records found"

    def test_practice_tag_relationship(self, app: FastAPI, session: Session):
        practice = session.query(PLPracticeIntervention).first()
        assert practice is not None, "No practice found"
        assert len(practice.tags) > 0, "Practice has no related tags"

    # ============================================================
    # COMPUTED PROPERTIES
    # ============================================================
    def test_is_environmental_and_is_income_flags(self, app: FastAPI, session: Session):
        practice = session.query(PLPracticeIntervention).first()
        assert isinstance(practice.is_environmental, bool)
        assert isinstance(practice.is_income, bool)

    def test_procurement_processes_property(self, app: FastAPI, session: Session):
        practice = session.query(PLPracticeIntervention).first()
        processes = practice.procurement_processes
        assert isinstance(processes, list), "procurement_processes must return a list"

    def test_serialize_structure(self, app: FastAPI, session: Session):
        practice = session.query(PLPracticeIntervention).first()
        data = practice.serialize
        expected_keys = {
            "id",
            "label",
            "procurement_processes",
            "is_environmental",
            "is_income",
            "scores",
            "created_at",
            "updated_at",
        }
        assert expected_keys.issubset(set(data.keys())), "serialize() missing required fields"

    # ============================================================
    # ATTRIBUTE SERIALIZE TEST
    # ============================================================
    def test_attribute_serialize_output(self, app: FastAPI, session: Session):
        attr = session.query(PLAttribute).first()
        data = attr.serialize
        assert "id" in data and "label" in data, "Attribute serialize missing fields"
        if attr.category:
            assert isinstance(data["category"], dict), "Expected dict for category in serialize"

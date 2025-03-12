import pytest
import sys
import subprocess
from fastapi import FastAPI
from sqlalchemy.orm import Session
from models.procurement_library.practice_indicator_score import PracticeIndicatorScore
from models.procurement_library.procurement_process import ProcurementProcess
from models.procurement_library.practice import Practice
from models.procurement_library.practice_indicator import PracticeIndicator
from models.procurement_library.assessment_question import AssessmentQuestion
from models.procurement_library.assessment_question_option import (
    AssessmentQuestionOption,
)

sys.path.append("..")


@pytest.fixture(scope="module", autouse=True)
def setup_module():
    # Run the seeder script before executing the tests
    subprocess.run(["python", "-m", "seeder.procurement_library"], check=True)


class TestProcurementLibraryModels:
    def test_total_procurement_processes(self, app: FastAPI, session: Session) -> None:
        total_processes = session.query(ProcurementProcess).count()
        assert total_processes == 20, "Total ProcurementProcesses do not match"

    def test_total_practices(self, app: FastAPI, session: Session) -> None:
        total_practices = session.query(Practice).count()
        assert total_practices == 47, "Total Practices do not match"

    def test_total_practice_indicators(self, app: FastAPI, session: Session) -> None:
        total_practice_indicators = session.query(PracticeIndicator).count()
        assert total_practice_indicators == 23, "Total PracticeIndicators do not match"

    def test_total_assessment_questions(self, app: FastAPI, session: Session) -> None:
        total_assessment_questions = session.query(AssessmentQuestion).count()
        assert total_assessment_questions == 5, "Total AssessmentQuestions do not match"

    def test_total_assessment_options(self, app: FastAPI, session: Session) -> None:
        total_assessment_options = session.query(AssessmentQuestionOption).count()
        assert total_assessment_options == 20, "Total AssessmentOptions do not match"

    def test_total_practice_indicator_scores(
        self, app: FastAPI, session: Session
    ) -> None:
        total_practice_indicator_scores = session.query(PracticeIndicatorScore).count()
        assert (
            total_practice_indicator_scores == 23 * 47
        ), "Total PracticeIndicatorScores do not match"

    def test_practice_procurement_process_relationship(
        self, app: FastAPI, session: Session
    ) -> None:
        practice = session.query(Practice).first()
        assert practice is not None, "No Practice found"
        assert (
            len(practice.procurement_processes) > 0
        ), "No ProcurementProcesses associated with Practice"

    def test_procurement_process_practice_relationship(
        self, app: FastAPI, session: Session
    ) -> None:
        procurement_process = session.query(ProcurementProcess).first()
        assert procurement_process is not None, "No ProcurementProcess found"
        assert (
            len(procurement_process.practices) > 0
        ), "No Practices associated with ProcurementProcess"

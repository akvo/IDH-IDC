import pytest
from sqlalchemy.orm import Session
from models.procurement_library.procurement_process import ProcurementProcess
from models.procurement_library.practice import Practice
from models.procurement_library.practice_indicator import PracticeIndicator
from models.procurement_library.practice_indicator_score import (
    PracticeIndicatorScore
)
from models.procurement_library.assessment_question import AssessmentQuestion
from models.procurement_library.assessment_question_option import (
    AssessmentQuestionOption,
)
from tests.conftest import session # noqa


class TestProcurementLibraryModels:
    @pytest.fixture(autouse=True)
    def setUp(self, session: Session):  # noqa
        # Truncate all existing data for each model
        session.query(PracticeIndicatorScore).delete()
        session.query(AssessmentQuestionOption).delete()
        session.query(AssessmentQuestion).delete()
        session.query(PracticeIndicator).delete()
        session.query(Practice).delete()
        session.query(ProcurementProcess).delete()
        session.commit()

        # Seed the data
        data = [
            {
                "label": "Contract Management",
                "practices": [
                    {
                        "label": "Simple Contract Terminology",
                        "intervention_definition": "<p>intervention_definition Test #1</p>",
                        "enabling_conditions": "<p>enabling_conditions Test #1</p>",
                        "business_rationale": "<p>business_rationale Test #1</p>",
                        "farmer_rationale": "<p>farmer_rationale Test #1</p>",
                        "risks_n_trade_offs": "<p>risks_n_trade_offs Test definition #1</p>",
                        "intervention_impact_income": "<p>intervention_impact_income Test definition #1</p>",
                        "intervention_impact_env": "<p>intervention_impact_env Test definition #1</p>",
                        "source_or_evidence": "<p>source_or_evidence Test definition #1</p>",
                        "indicators": [
                            {
                                "name": "income_impact",
                                "label": "Farmer income",
                                "is_option": True,
                                "indicator_group": "relative_potential_impact",
                                "description": "Trader: is something test",
                                "score": 3,
                                "autofield": None,
                            },
                            {
                                "name": "environmental_impact",
                                "label": "Environment",
                                "is_option": True,
                                "indicator_group": "relative_potential_impact",
                                "description": "Trader: is something test",
                                "score": 1,
                                "autofield": None,
                            },
                            {
                                "name": "combined_impact",
                                "label": "Both",
                                "is_option": True,
                                "indicator_group": "relative_potential_impact",
                                "description": "Trader: is something test",
                                "score": 2,
                                "autofield": (
                                    "#income_impact + #environmental_impact/2"
                                )
                            },
                        ],
                    }
                ],
            }
        ]

        questions = [
            {
                "id": 1,
                "label": "In which area do you seek to have impact?",
                "options": [
                    "income_impact",
                    "environmental_impact",
                    "combined_impact"
                ],
            }
        ]

        for process_data in data:
            procurement_process = ProcurementProcess(label=process_data["label"])
            session.add(procurement_process)
            session.flush()  # Ensure procurement_process.id is available

            for practice_data in process_data["practices"]:
                practice = Practice(
                    label=practice_data["label"],
                    intervention_definition=practice_data["intervention_definition"],
                    enabling_conditions=practice_data["enabling_conditions"],
                    business_rationale=practice_data["business_rationale"],
                    farmer_rationale=practice_data["farmer_rationale"],
                    risks_n_trade_offs=practice_data["risks_n_trade_offs"],
                    intervention_impact_income=practice_data[
                        "intervention_impact_income"
                    ],
                    intervention_impact_env=practice_data["intervention_impact_env"],
                    source_or_evidence=practice_data["source_or_evidence"],
                    procurement_process_id=procurement_process.id,
                )
                session.add(practice)
            session.flush()  # Ensure practice.id is available

            for indicator_data in practice_data["indicators"]:
                indicator = PracticeIndicator(
                    name=indicator_data["name"],
                    label=indicator_data["label"],
                    description=indicator_data["description"],
                )
                session.add(indicator)
                practice_score = PracticeIndicatorScore(
                    indicator_id=indicator.id,
                    practice_id=practice.id,
                    score=indicator_data["score"],
                )
                session.add(practice_score)

        for q in questions:
            question = AssessmentQuestion(id=q["id"], label=q["label"])
            session.add(question)

            for option_name in q["options"]:
                indicator = (
                    session.query(PracticeIndicator).filter_by(
                        name=option_name
                    ).first()
                )
                if indicator:
                    question_option = AssessmentQuestionOption(
                        question_id=question.id, indicator_id=indicator.id
                    )
                    session.add(question_option)
        session.commit()

    def test_read_procurement_process(
        self, session: Session   # noqa
    ):
        retrieved_process = (
            session.query(ProcurementProcess)
            .filter_by(label="Contract Management")
            .first()
        )
        assert retrieved_process is not None, "ProcurementProcess was not read"
        assert (
            retrieved_process.label == "Contract Management"
        ), "ProcurementProcess label does not match"

    def test_read_practice(
        self, session: Session  # noqa
    ):
        practice = (
            session.query(Practice)
            .filter_by(label="Simple Contract Terminology")
            .first()
        )
        assert practice is not None, "Practice was not read"

    def test_read_practice_indicator(
        self,
        session: Session  # noqa
    ):
        indicator = (
            session.query(PracticeIndicator).filter_by(name="income_impact").first()
        )
        assert indicator is not None, "PracticeIndicator was not read"
        assert (
            indicator.label == "Farmer income"
        ), "PracticeIndicator label does not match"

    def test_read_practice_indicator_score(
        self, session: Session  # noqa
    ):
        practice = (
            session.query(Practice)
            .filter_by(label="Simple Contract Terminology")
            .first()
        )
        assert practice is not None, "Practice was not read"

        practice_scores = (
            session.query(PracticeIndicatorScore)
            .filter_by(practice_id=practice.id)
            .all()
        )
        assert practice_scores is not None, "PracticeIndicatorScores were not read"
        assert (
            len(practice_scores) == 3
        ), "Number of PracticeIndicatorScores does not match"

        expected_scores = [3.0, 1.0, 2.0]
        actual_scores = [score.score for score in practice_scores]
        assert sorted(actual_scores) == sorted(
            expected_scores
        ), "PracticeIndicatorScores do not match"

import pytest
import sys
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy.orm import Session
from db.procurement_library import crud_assessment_question

sys.path.append("..")


class TestAssessmentQuestionsRoute:
    @pytest.mark.asyncio
    async def test_get_all_questions(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        res = await client.get(
            app.url_path_for("pl:get_all_questions"),
        )
        assert res.status_code == 200
        res = res.json()
        assert len(res) == 5
        assert list(res[0].keys()) == [
            "id",
            "label",
            "created_at",
            "updated_at",
            "options",
        ]
        assert list(res[0]["options"][0].keys()) == [
            "id",
            "question_id",
            "indicator_id",
            "label",
            "name",
            "description",
            "created_at",
        ]

    @pytest.mark.asyncio
    async def test_submit_answer(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        selected_answers = [
            "Environment",
            "Aggregator",
            "Informal–small Markets",
            "Intermediate Enhancement",
            "Small-scale Enterprise",
        ]
        questions = crud_assessment_question.get_all_questions(
            session=session,
        )
        answers = []
        for index, question in enumerate(questions):
            for option in question["options"]:
                if option["label"] == selected_answers[index]:
                    answers.append(
                        {
                            "question_id": question["id"],
                            "indicator_id": option["indicator_id"],
                        }
                    )
        res = await client.post(
            app.url_path_for("pl:submit_answers"),
            json=answers,
        )
        assert res.status_code == 200
        res = res.json()
        assert len(res) == 10
        assert list(res[0].keys()) == [
            "id",
            "procurement_process_label",
            "procurement_process_id",
            "label",
            "is_environmental",
            "is_income",
            "total_score",
            "scores",
            "created_at",
        ]
        expected_practice_labels = [
            "Supporting regenerative agriculture",
            "Long-Term / Multi-seasonal Contracts",
            "Supplier Capacity Building",
            "Procurement-Driven Sustainability Investments",
            "Buyer Sustainability Targets",
            "Simple Contract Terminology",
            "Pricing Methods",
            "Payment Management & Procurement Risk Mangement",
            "Partial Payments and Milestone Payments",
            "Shorter Payment Periods\n",
        ]
        assert [practice["label"] for practice in res] == expected_practice_labels
        expected_scores = [
            25,
            24,
            23,
            22,
            22,
            21,
            21,
            21,
            21,
            21,
        ]
        assert [practice["total_score"] for practice in res] == expected_scores

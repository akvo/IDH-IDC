from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy.orm import Session
import pytest
import sys

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
            "created_at",
        ]

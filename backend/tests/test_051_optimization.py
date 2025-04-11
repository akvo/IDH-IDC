import sys
import pytest

from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy.orm import Session
from tests.test_000_main import Acc

from models.segment_answer import SegmentAnswer

sys.path.append("..")

non_admin_account = Acc(email="editor@akvo.org", token=None)
admin_account = Acc(email="super_admin@akvo.org", token=None)


class TestOptimizationRoute:
    @pytest.mark.asyncio
    async def test_optimize(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        segment_answer = session.query(SegmentAnswer).first()
        case_id = segment_answer.case_commodity_detail.case
        segment_id = segment_answer.segment
        payload = {
            "percentages": [0.5, 0.75, 1],
            "editable_indices": [
                f"{segment_answer.case_commodity}-2",
                f"{segment_answer.case_commodity}-3",
            ],
        }
        res = await client.post(
            app.url_path_for(
                "optimization:run_model",
                case_id=case_id,
                segment_id=segment_id,
            ),
            headers={"Authorization": f"Bearer {admin_account.token}"},
            json=payload,
        )
        assert res.status_code == 200
        res = res.json()
        assert res == {
            "target_income": 3000.0,
            "current_income": 10000.2,
            "feasible_income": 0.2,
            "optimization_result": [
                {
                    "key": 1,
                    "name": "percentage_1",
                    "value": {},
                    "percentage": 0.5,
                    "increase_error": True,
                    "max_percentage": 0.9999800000000001,
                },
                {
                    "key": 2,
                    "name": "percentage_2",
                    "value": {},
                    "percentage": 0.75,
                    "increase_error": True,
                    "max_percentage": 0.9999800000000001,
                },
                {
                    "key": 3,
                    "name": "percentage_3",
                    "value": {
                        "target_p": 0.2000000000007276,
                        "achieved_income": 0.4,
                        "optimization": {
                            "1-2": [
                                {"name": "current", "value": 0},
                                {"name": "feasible", "value": 0},
                                {"name": "optimized", "value": 0},
                            ],
                            "1-3": [
                                {"name": "current", "value": 0},
                                {"name": "feasible", "value": 500.0},
                                {"name": "optimized", "value": 0},
                            ],
                        },
                    },
                    "percentage": 1.0,
                    "increase_error": False,
                    "max_percentage": None,
                },
            ],
        }

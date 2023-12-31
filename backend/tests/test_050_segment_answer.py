import sys
import pytest
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy.orm import Session
from tests.test_000_main import Acc


sys.path.append("..")

non_admin_account = Acc(email="support@akvo.org", token=None)
admin_account = Acc(email="super_admin@akvo.org", token=None)


class TestSegmentAnswerRoute():
    # test_get_all_segment_answer_return_404
    @pytest.mark.asyncio
    async def test_add_segment_answer(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        payload = [{
            "case_commodity": 1,
            "segment": 100,
            "question": 1,
            "current_value": 10000,
            "feasible_value": None,
        }]
        # without cred
        res = await client.post(
            app.url_path_for("segment_answer:add_answer", segment_id=100),
            json=payload,
        )
        assert res.status_code == 403
        # wrong segment id
        res = await client.post(
            app.url_path_for("segment_answer:add_answer", segment_id=100),
            headers={"Authorization": f"Bearer {non_admin_account.token}"},
            json=payload,
        )
        assert res.status_code == 404
        # with normal user cred
        payload = [{
            "case_commodity": 1,
            "segment": 1,
            "question": 1,
            "current_value": 10000,
            "feasible_value": 5000,
        }, {
            "case_commodity": 1,
            "segment": 1,
            "question": 2,
            "current_value": 20000,
            "feasible_value": 10000,
        }]
        res = await client.post(
            app.url_path_for("segment_answer:add_answer", segment_id=1),
            headers={"Authorization": f"Bearer {non_admin_account.token}"},
            json=payload,
        )
        assert res.status_code == 200
        res = res.json()
        assert res == [{
            'id': 6,
            'case_commodity': 1,
            'segment': 1,
            'question': 1,
            'current_value': 10000.0,
            'feasible_value': 5000.0
        }, {
            'id': 7,
            'case_commodity': 1,
            'segment': 1,
            'question': 2,
            'current_value': 20000.0,
            'feasible_value': 10000.0
        }]
        # with admin user cred
        payload = [{
            "case_commodity": 1,
            "segment": 1,
            "question": 3,
            "current_value": 30000,
            "feasible_value": 20000,
        }]
        res = await client.post(
            app.url_path_for("segment_answer:add_answer", segment_id=1),
            headers={"Authorization": f"Bearer {admin_account.token}"},
            json=payload,
        )
        assert res.status_code == 200
        res = res.json()
        assert res == [{
            'id': 8,
            'case_commodity': 1,
            'segment': 1,
            'question': 3,
            'current_value': 30000.0,
            'feasible_value': 20000.0
        }]

    # test_get_all_segment_answer
    # test_get_segment_answer_by_id

    @pytest.mark.asyncio
    async def test_update_segment_answer(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        payload = [{
            "case_commodity": 1,
            "segment": 100,
            "question": 1,
            "current_value": 100,
            "feasible_value": None,
        }]
        # without cred
        res = await client.put(
            app.url_path_for("segment_answer:update_answer", segment_id=100),
            json=payload,
        )
        assert res.status_code == 403
        # wrong segment id
        res = await client.put(
            app.url_path_for("segment_answer:update_answer", segment_id=100),
            headers={"Authorization": f"Bearer {non_admin_account.token}"},
            json=payload,
        )
        assert res.status_code == 404
        # with normal user cred
        payload = [{
            "case_commodity": 1,
            "segment": 1,
            "question": 1,
            "current_value": 5,
            "feasible_value": 5,
        }]
        res = await client.put(
            app.url_path_for("segment_answer:update_answer", segment_id=1),
            headers={"Authorization": f"Bearer {non_admin_account.token}"},
            json=payload,
        )
        assert res.status_code == 200
        res = res.json()
        assert res == [{
            'id': 9,
            'case_commodity': 1,
            'segment': 1,
            'question': 1,
            'current_value': 5.0,
            'feasible_value': 5.0
        }]
        # with admin user cred
        payload = [{
            "case_commodity": 1,
            "segment": 1,
            "question": 1,
            "current_value": 100,
            "feasible_value": 100,
        }, {
            "case_commodity": 1,
            "segment": 1,
            "question": 2,
            "current_value": 200,
            "feasible_value": 200,
        }, {
            "case_commodity": 1,
            "segment": 1,
            "question": 3,
            "current_value": 300,
            "feasible_value": 300,
        }]
        res = await client.put(
            app.url_path_for("segment_answer:update_answer", segment_id=1),
            headers={"Authorization": f"Bearer {admin_account.token}"},
            json=payload,
        )
        assert res.status_code == 200
        res = res.json()
        assert res == [{
            'id': 10,
            'case_commodity': 1,
            'segment': 1,
            'question': 1,
            'current_value': 100.0,
            'feasible_value': 100.0
        }, {
            'id': 11,
            'case_commodity': 1,
            'segment': 1,
            'question': 2,
            'current_value': 200.0,
            'feasible_value': 200.0
        }, {
            'id': 12,
            'case_commodity': 1,
            'segment': 1,
            'question': 3,
            'current_value': 300.0,
            'feasible_value': 300.0
        }]

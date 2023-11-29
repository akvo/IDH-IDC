import sys
import pytest
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy.orm import Session
from tests.test_000_main import Acc

from models.segment import Segment
from models.segment_answer import SegmentAnswer
from models.case_commodity import CaseCommodityType

sys.path.append("..")

non_admin_account = Acc(email="support@akvo.org", token=None)
admin_account = Acc(email="super_admin@akvo.org", token=None)


class TestSegmentAnswerRouteContinued:
    @pytest.mark.asyncio
    async def test_get_segments_by_case_id(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # without cred
        res = await client.get(app.url_path_for("segment:get_by_case_id", case_id=1))
        assert res.status_code == 403
        # return 404
        res = await client.get(
            app.url_path_for("segment:get_by_case_id", case_id=100),
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code == 404
        # with normal user cred
        res = await client.get(
            app.url_path_for("segment:get_by_case_id", case_id=1),
            headers={"Authorization": f"Bearer {non_admin_account.token}"},
        )
        assert res.status_code == 200
        # with admin user cred
        res = await client.get(
            app.url_path_for("segment:get_by_case_id", case_id=1),
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code == 200
        res = res.json()
        assert res == [
            {
                "id": 2,
                "case": 1,
                "region": 2,
                "name": "Segment 2",
                "target": 2000.0,
                "adult": 6.0,
                "child": 0.0,
                "answers": {},
                "benchmark": None,
            },
            {
                "id": 3,
                "case": 1,
                "region": 1,
                "name": "Segment 3",
                "target": 3000.0,
                "adult": 4.0,
                "child": 2.0,
                "answers": {
                    "current-1-1": 10000.0,
                    "current-1-2": None,
                    "current-1-3": None,
                    "feasible-1-1": None,
                    "feasible-1-2": None,
                    "feasible-1-3": 500.0,
                },
                "benchmark": None,
            },
            {
                "id": 1,
                "case": 1,
                "region": 1,
                "name": "Segment 1",
                "target": 2000.0,
                "adult": 5.0,
                "child": 0.0,
                "answers": {
                    "current-1-1": 100.0,
                    "feasible-1-1": 100.0,
                    "current-1-2": 200.0,
                    "feasible-1-2": 200.0,
                    "current-1-3": 300.0,
                    "feasible-1-3": 300.0,
                },
                "benchmark": None,
            },
        ]

    @pytest.mark.asyncio
    async def test_get_case_by_id_with_segments(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # without cred
        res = await client.get(app.url_path_for("case:get_by_id", case_id=1))
        assert res.status_code == 403
        # return 404
        res = await client.get(
            app.url_path_for("case:get_by_id", case_id=100),
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code == 404
        # with normal user cred (but have view access)
        res = await client.get(
            app.url_path_for("case:get_by_id", case_id=1),
            headers={"Authorization": f"Bearer {non_admin_account.token}"},
        )
        assert res.status_code == 200
        # with admin user cred
        res = await client.get(
            app.url_path_for("case:get_by_id", case_id=1),
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code == 200
        res = res.json()
        assert res == {
            "id": 1,
            "name": "Bali Rice and Corn Production",
            "description": "This is a description",
            "date": "2023-10-03",
            "year": 2023,
            "country": 2,
            "focus_commodity": 2,
            "currency": "USD",
            "area_size_unit": "acre",
            "volume_measurement_unit": "kilograms",
            "cost_of_production_unit": "Per-acre",
            "reporting_period": "Per-year",
            "segmentation": False,
            "living_income_study": "living_income",
            "multiple_commodities": False,
            "created_by": "super_admin@akvo.org",
            "created_at": res["created_at"],
            "updated_at": res["updated_at"],
            "segments": [
                {
                    "id": 2,
                    "case": 1,
                    "region": 2,
                    "name": "Segment 2",
                    "target": 2000.0,
                    "adult": 6.0,
                    "child": 0.0,
                    "answers": {},
                    "benchmark": None,
                },
                {
                    "id": 3,
                    "case": 1,
                    "region": 1,
                    "name": "Segment 3",
                    "target": 3000.0,
                    "adult": 4.0,
                    "child": 2.0,
                    "answers": {
                        "current-1-1": 10000.0,
                        "current-1-2": None,
                        "current-1-3": None,
                        "feasible-1-1": None,
                        "feasible-1-2": None,
                        "feasible-1-3": 500.0,
                    },
                    "benchmark": None,
                },
                {
                    "id": 1,
                    "case": 1,
                    "region": 1,
                    "name": "Segment 1",
                    "target": 2000.0,
                    "adult": 5.0,
                    "child": 0.0,
                    "answers": {
                        "current-1-1": 100.0,
                        "current-1-2": 200.0,
                        "current-1-3": 300.0,
                        "feasible-1-1": 100.0,
                        "feasible-1-2": 200.0,
                        "feasible-1-3": 300.0,
                    },
                    "benchmark": None,
                },
            ],
            "case_commodities": [
                {
                    "id": 1,
                    "commodity": 2,
                    "breakdown": True,
                    "commodity_type": CaseCommodityType.focus.value,
                    "area_size_unit": "acre",
                    "volume_measurement_unit": "kilograms",
                },
                {
                    "id": 2,
                    "commodity": 3,
                    "breakdown": False,
                    "commodity_type": CaseCommodityType.secondary.value,
                    "area_size_unit": "hectare",
                    "volume_measurement_unit": "liters",
                },
                {
                    "id": 3,
                    "commodity": None,
                    "breakdown": True,
                    "commodity_type": CaseCommodityType.diversified.value,
                    "volume_measurement_unit": "liters",
                    "area_size_unit": "hectare",
                },
            ],
            "private": False,
            "tags": [2, 1],
        }

    @pytest.mark.asyncio
    async def test_delete_segment_by_id_with_segment_answers(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # delete without cred
        res = await client.delete(app.url_path_for("segment:delete", segment_id=1))
        assert res.status_code == 403
        # delete with cred
        res = await client.delete(
            app.url_path_for("segment:delete", segment_id=1),
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code == 204
        segment = session.query(Segment).filter(Segment.id == 1).first()
        assert segment is None
        segment_answers = (
            session.query(SegmentAnswer).filter(SegmentAnswer.segment == 1).count()
        )
        assert segment_answers == 0

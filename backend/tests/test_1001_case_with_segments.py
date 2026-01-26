import sys
import pytest

from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy.orm import Session
from tests.test_000_main import Acc

from models.case import LivingIncomeStudyEnum, CaseStatusEnum
from models.case_commodity import CaseCommodityType

sys.path.append("..")

non_admin_account = Acc(email="editor@akvo.org", token=None)
admin_account = Acc(email="super_admin@akvo.org", token=None)


class TestCaseWithSegmentRoute:
    @pytest.mark.asyncio
    async def test_create_case_with_segment(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        payload = {
            "name": "Bali Rice and Corn with Segment",
            "description": "This is a description",
            "date": "2024-10-03",
            "year": 2024,
            "country": 2,
            "focus_commodity": 2,
            "currency": "USD",
            "area_size_unit": "hectare",
            "volume_measurement_unit": "liters",
            "cost_of_production_unit": "Per-area",
            "reporting_period": "Per-season",
            "segmentation": False,
            "living_income_study": LivingIncomeStudyEnum.better_income.value,
            "multiple_commodities": False,
            "other_commodities": [
                {
                    "commodity": 3,
                    "breakdown": True,
                    "commodity_type": CaseCommodityType.secondary.value,
                    "volume_measurement_unit": "liters",
                    "area_size_unit": "hectare",
                }
            ],
            "tags": [1],
            "company": 1,
            "segments": [
                {
                    "name": "Segment 1 Name",
                    "number_of_farmers": 10,
                },
                {
                    "name": "Segment 2 Name",
                    "number_of_farmers": 8,
                },
            ],
        }
        # with admin user cred
        res = await client.post(
            app.url_path_for("case:create"),
            headers={"Authorization": f"Bearer {admin_account.token}"},
            json=payload,
        )
        assert res.status_code == 200
        res = res.json()
        assert res == {
            "id": 12,
            "name": "Bali Rice and Corn with Segment",
            "description": "This is a description",
            "date": "2024-10-03",
            "year": 2024,
            "country": 2,
            "focus_commodity": 2,
            "currency": "USD",
            "area_size_unit": "hectare",
            "volume_measurement_unit": "liters",
            "cost_of_production_unit": "Per-area",
            "reporting_period": "Per-season",
            "segmentation": False,
            "living_income_study": "better_income",
            "multiple_commodities": False,
            "logo": None,
            "created_by": 1,
            "status": 0,
            "segments": [
                {
                    "id": 4,
                    "case": 12,
                    "name": "Segment 1 Name",
                    "region": None,
                    "target": None,
                    "adult": None,
                    "child": None,
                    "number_of_farmers": 10,
                },
                {
                    "id": 5,
                    "case": 12,
                    "name": "Segment 2 Name",
                    "region": None,
                    "target": None,
                    "adult": None,
                    "child": None,
                    "number_of_farmers": 8,
                },
            ],
            "case_commodities": [
                {
                    "id": 13,
                    "commodity": 2,
                    "breakdown": True,
                    "commodity_type": "focus",
                    "area_size_unit": "hectare",
                    "volume_measurement_unit": "liters",
                },
                {
                    "id": 14,
                    "commodity": 3,
                    "breakdown": True,
                    "commodity_type": "secondary",
                    "area_size_unit": "hectare",
                    "volume_measurement_unit": "liters",
                },
                {
                    "id": 15,
                    "commodity": None,
                    "breakdown": True,
                    "commodity_type": "diversified",
                    "area_size_unit": "hectare",
                    "volume_measurement_unit": "liters",
                },
            ],
            "private": False,
            "tags": [1],
            "company": 1,
        }

    @pytest.mark.asyncio
    async def test_update_case_with_segment(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        payload = {
            "name": "Bali Rice and Corn with Segment",
            "description": "This is a description",
            "date": "2024-10-03",
            "year": 2024,
            "country": 2,
            "focus_commodity": 2,
            "currency": "USD",
            "area_size_unit": "hectare",
            "volume_measurement_unit": "liters",
            "cost_of_production_unit": "Per-area",
            "reporting_period": "Per-season",
            "segmentation": False,
            "living_income_study": LivingIncomeStudyEnum.better_income.value,
            "multiple_commodities": False,
            "other_commodities": [
                {
                    "commodity": 3,
                    "breakdown": True,
                    "commodity_type": CaseCommodityType.secondary.value,
                    "volume_measurement_unit": "liters",
                    "area_size_unit": "hectare",
                }
            ],
            "tags": [1],
            "company": 1,
            "segments": [
                {
                    "id": 4,
                    "name": "Segment 1 Name Updated",
                    "number_of_farmers": 11,
                },
                {
                    "id": 5,
                    "name": "Segment 2 Name",
                    "number_of_farmers": 8,
                },
                {
                    "name": "Segment 3 Name",
                    "number_of_farmers": 9,
                },
            ],
        }
        # with admin user cred
        res = await client.put(
            app.url_path_for("case:update", case_id=12),
            params={"updated": True},
            headers={"Authorization": f"Bearer {admin_account.token}"},
            json=payload,
        )
        assert res.status_code == 200
        res = res.json()
        assert res == {
            "id": 12,
            "name": "Bali Rice and Corn with Segment",
            "description": "This is a description",
            "date": "2024-10-03",
            "year": 2024,
            "country": 2,
            "focus_commodity": 2,
            "currency": "USD",
            "area_size_unit": "hectare",
            "volume_measurement_unit": "liters",
            "cost_of_production_unit": "Per-area",
            "reporting_period": "Per-season",
            "segmentation": False,
            "living_income_study": "better_income",
            "multiple_commodities": False,
            "created_by": "super_admin@akvo.org",
            "created_at": res["created_at"],
            "updated_by": "John Doe",
            "updated_at": res["updated_at"],
            "status": 0,
            "segments": [
                {
                    "id": 5,
                    "case": 12,
                    "name": "Segment 2 Name",
                    "region": None,
                    "target": None,
                    "adult": None,
                    "child": None,
                    "number_of_farmers": 8,
                    "answers": {},
                    "benchmark": None,
                },
                {
                    "id": 4,
                    "case": 12,
                    "name": "Segment 1 Name Updated",
                    "region": None,
                    "target": None,
                    "adult": None,
                    "child": None,
                    "number_of_farmers": 11,
                    "answers": {},
                    "benchmark": None,
                },
                {
                    "id": 6,
                    "case": 12,
                    "name": "Segment 3 Name",
                    "region": None,
                    "target": None,
                    "adult": None,
                    "child": None,
                    "number_of_farmers": 9,
                    "answers": {},
                    "benchmark": None,
                },
            ],
            "case_commodities": [
                {
                    "id": 13,
                    "commodity": 2,
                    "breakdown": True,
                    "commodity_type": "focus",
                    "area_size_unit": "hectare",
                    "volume_measurement_unit": "liters",
                },
                {
                    "id": 14,
                    "commodity": 3,
                    "breakdown": True,
                    "commodity_type": "secondary",
                    "area_size_unit": "hectare",
                    "volume_measurement_unit": "liters",
                },
                {
                    "id": 15,
                    "commodity": None,
                    "breakdown": True,
                    "commodity_type": "diversified",
                    "area_size_unit": "hectare",
                    "volume_measurement_unit": "liters",
                },
            ],
            "private": False,
            "tags": [1],
            "company": 1,
            "import_id": None,
        }

    @pytest.mark.asyncio
    async def test_update_case_status(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # with admin user cred
        res = await client.put(
            app.url_path_for("case:update_status", case_id=12),
            params={"status": CaseStatusEnum.COMPLETED.value},
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code == 200
        res = res.json()
        assert res["id"] == 12
        assert res["status"] == CaseStatusEnum.COMPLETED.value

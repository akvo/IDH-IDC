import sys
import pytest

from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy.orm import Session
from tests.test_000_main import Acc

from models.case import LivingIncomeStudyEnum
from models.case_commodity import CaseCommodityType

sys.path.append("..")

non_admin_account = Acc(email="editor@akvo.org", token=None)
admin_account = Acc(email="super_admin@akvo.org", token=None)


class TestCaseDropdownRoute:
    @pytest.mark.asyncio
    async def test_case_options_dropdown_by_super_admin(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # without cred
        res = await client.get(app.url_path_for("case:get_options"))
        assert res.status_code == 403
        res = await client.get(
            app.url_path_for("case:get_options"),
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code == 200
        res = res.json()
        assert res == [
            {"label": "Bali Coffee Production (Private)", "value": 2},
            {"label": "Bali Rice and Corn Production", "value": 1},
        ]

    @pytest.mark.asyncio
    async def test_case_options_dropdown_by_admin(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        admin_account = Acc(email="admin@akvo.org", token=None)
        res = await client.get(
            app.url_path_for("case:get_options"),
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code == 404

    @pytest.mark.asyncio
    async def test_create_non_private_case_by_admin(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        admin_account = Acc(email="admin@akvo.org", token=None)
        payload = {
            "name": "Bali Coffee",
            "description": "This is a description",
            "date": "2023-10-03",
            "year": 2023,
            "country": 2,
            "focus_commodity": 2,
            "currency": "USD",
            "area_size_unit": "hectare",
            "volume_measurement_unit": "liters",
            "cost_of_production_unit": "Per-area",
            "reporting_period": "Per-season",
            "segmentation": False,
            "living_income_study": LivingIncomeStudyEnum.better_income.value,
            "multiple_commodities": True,
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
        }
        # without cred
        res = await client.post(
            app.url_path_for("case:create"),
            json=payload,
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code == 200
        # get case options
        res = await client.get(
            app.url_path_for("case:get_options"),
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code == 200
        res = res.json()
        assert res == [{"label": "Bali Coffee", "value": 3}]

    @pytest.mark.asyncio
    async def test_create_non_private_case_by_admin_with_company(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        admin_account = Acc(email="admin@akvo.org", token=None)
        payload = {
            "name": "Banyuatis Coffe",
            "description": "This is a description",
            "date": "2023-10-03",
            "year": 2023,
            "country": 2,
            "company": 1,
            "focus_commodity": 2,
            "currency": "USD",
            "area_size_unit": "hectare",
            "volume_measurement_unit": "liters",
            "cost_of_production_unit": "Per-area",
            "reporting_period": "Per-season",
            "segmentation": False,
            "living_income_study": LivingIncomeStudyEnum.better_income.value,
            "multiple_commodities": False,
            "tags": [1],
        }
        # without cred
        res = await client.post(
            app.url_path_for("case:create"),
            json=payload,
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code == 200
        res = res.json()
        assert res == {
            "id": 4,
            "name": "Banyuatis Coffe",
            "description": "This is a description",
            "date": "2023-10-03",
            "year": 2023,
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
            "created_by": 3,
            "segments": [],
            "status": 0,
            "case_commodities": [
                {
                    "id": 9,
                    "commodity": 2,
                    "breakdown": True,
                    "commodity_type": "focus",
                    "area_size_unit": "hectare",
                    "volume_measurement_unit": "liters",
                },
                {
                    "id": 10,
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
    async def test_get_available_case_countries(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # without cred
        res = await client.get(app.url_path_for("case:get_case_countries"))
        assert res.status_code == 403
        res = await client.get(
            app.url_path_for("case:get_case_countries"),
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code == 200
        res = res.json()
        assert res == [2]

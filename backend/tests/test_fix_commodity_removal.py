import pytest
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy.orm import Session
from tests.test_000_main import Acc
from models.case import LivingIncomeStudyEnum, CaseCommodityType

admin_account = Acc(email="super_admin@akvo.org", token=None)


class TestCaseCommodityRemoval:
    @pytest.mark.asyncio
    async def test_update_case_remove_commodity(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # 1. Create a case with Focus and Secondary commodities
        create_payload = {
            "name": "Bali Rice and Corn Production",
            "date": "2023-10-03",
            "year": 2023,
            "country": 2,
            "focus_commodity": 1,
            "currency": "USD",
            "area_size_unit": "acre",
            "volume_measurement_unit": "kilograms",
            "cost_of_production_unit": "Per-acre",
            "reporting_period": "Per-year",
            "segmentation": False,
            "living_income_study": LivingIncomeStudyEnum.living_income.value,
            "multiple_commodities": False,
            "other_commodities": [
                {
                    "commodity": 2,
                    "breakdown": True,
                    "commodity_type": CaseCommodityType.secondary.value,
                    "volume_measurement_unit": "kilograms",
                    "area_size_unit": "acre",
                }
            ],
            "tags": [],
            "company": None,
        }

        res = await client.post(
            app.url_path_for("case:create"),
            headers={"Authorization": f"Bearer {admin_account.token}"},
            json=create_payload,
        )
        assert res.status_code == 200
        case_data = res.json()
        case_id = case_data["id"]

        # Verify creation: Focus (1) + Secondary (2) + Default Diversified (3)
        case_commodity_ids = [
            cc["commodity"] for cc in case_data["case_commodities"]
        ]
        assert 1 in case_commodity_ids
        assert 2 in case_commodity_ids

        # 2. Update the case to REMOVE Secondary commodity
        # AND ADD Tertiary commodity
        update_payload = create_payload.copy()
        update_payload["other_commodities"] = [
            {
                "commodity": 4,
                "breakdown": True,
                "commodity_type": CaseCommodityType.tertiary.value,
                "volume_measurement_unit": "kilograms",
                "area_size_unit": "acre",
            }
        ]  # Remove secondary, add tertiary

        # Update case with admin credentials
        res = await client.put(
            app.url_path_for("case:update", case_id=case_id),
            params={"updated": True},
            headers={"Authorization": f"Bearer {admin_account.token}"},
            json=update_payload,
        )
        assert res.status_code == 200
        res = res.json()

        # 3. Verify Removal and Addition
        case_commodity_ids = [
            cc["commodity"] for cc in res["case_commodities"]
        ]

        # Focus commodity (id 1) should remain
        assert 1 in case_commodity_ids

        # Secondary commodity (id 2) should be DELETED
        assert 2 not in case_commodity_ids

        # Tertiary commodity (id 4) should be ADDED
        assert 4 in case_commodity_ids

        # Check that all returned commodities have a valid ID (PK)
        # This confirms that newly added commodities
        # get their IDs back immediately
        for cc in res["case_commodities"]:
            assert cc["id"] is not None
            assert isinstance(cc["id"], int)

        # If Diversified was there, it should remain.
        if 3 in [
            cc["id"] for cc in case_data["case_commodities"]
        ]:  # Check if it was in original
            assert 3 in case_commodity_ids

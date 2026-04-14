import sys
import pytest
from pydantic import ValidationError
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy.orm import Session
from tests.test_000_main import Acc

from models.case import CaseBase, LivingIncomeStudyEnum
from models.segment import CaseSettingSegmentPayload

sys.path.append("..")

admin_account = Acc(email="super_admin@akvo.org", token=None)


def test_case_base_segment_limit():
    # Valid case with 5 segments
    valid_data = {
        "name": "Limit Case",
        "country": 2,
        "focus_commodity": 2,
        "currency": "USD",
        "area_size_unit": "hectare",
        "volume_measurement_unit": "liters",
        "cost_of_production_unit": "Per-area",
        "segmentation": True,
        "multiple_commodities": False,
        "segments": [
            CaseSettingSegmentPayload(
                name=f"Segment {i}", number_of_farmers=10
            )
            for i in range(5)
        ],
    }
    case = CaseBase(**valid_data)
    assert len(case.segments) == 5

    # Invalid case with 6 segments
    invalid_data = valid_data.copy()
    invalid_data["segments"] = [
        CaseSettingSegmentPayload(name=f"Segment {i}", number_of_farmers=10)
        for i in range(6)
    ]

    with pytest.raises(ValidationError) as excinfo:
        CaseBase(**invalid_data)

    errors = excinfo.value.errors()
    assert any(e["loc"] == ("segments",) for e in errors)


class TestCaseSegmentLimit:
    @pytest.mark.asyncio
    async def test_create_case_segment_limit(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        payload = {
            "name": "Too Many Segments Case",
            "country": 2,
            "focus_commodity": 2,
            "currency": "USD",
            "area_size_unit": "hectare",
            "volume_measurement_unit": "liters",
            "cost_of_production_unit": "Per-area",
            "segmentation": True,
            "multiple_commodities": False,
            "living_income_study": LivingIncomeStudyEnum.better_income.value,
            "segments": [
                {"name": f"Segment {i}", "number_of_farmers": 10}
                for i in range(6)
            ],
        }
        res = await client.post(
            app.url_path_for("case:create"),
            headers={"Authorization": f"Bearer {admin_account.token}"},
            json=payload,
        )
        # Should return 422 Unprocessable Entity due to pydantic validation
        assert res.status_code == 422
        errors = res.json()["detail"]
        assert any("segments" in str(e["loc"]) for e in errors)

    @pytest.mark.asyncio
    async def test_update_case_segment_limit(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        payload = {
            "name": "Update Limit Case",
            "country": 2,
            "focus_commodity": 2,
            "currency": "USD",
            "area_size_unit": "hectare",
            "volume_measurement_unit": "liters",
            "cost_of_production_unit": "Per-area",
            "segmentation": True,
            "multiple_commodities": False,
            "living_income_study": LivingIncomeStudyEnum.better_income.value,
            "segments": [
                {"name": f"Segment {i}", "number_of_farmers": 10}
                for i in range(6)
            ],
        }
        # Attempting to update Case ID 1 (standard test case)
        res = await client.put(
            app.url_path_for("case:update", case_id=1),
            headers={"Authorization": f"Bearer {admin_account.token}"},
            json=payload,
        )
        assert res.status_code == 422
        errors = res.json()["detail"]
        assert any("segments" in str(e["loc"]) for e in errors)

    @pytest.mark.asyncio
    async def test_import_generate_values_limit(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        payload = {
            "import_id": "some-import-id",
            "variable_type": "categorical",
            "segmentation_variable": "Gender",
            "segments": [
                {"name": f"Segment {i}", "number_of_farmers": 10}
                for i in range(6)
            ],
        }
        res = await client.post(
            app.url_path_for("case_import:generate_segment_values"),
            headers={"Authorization": f"Bearer {admin_account.token}"},
            json=payload,
        )
        assert res.status_code == 422

    @pytest.mark.asyncio
    async def test_import_recalculate_limit(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        payload = {
            "import_id": "some-import-id",
            "variable_type": "categorical",
            "segmentation_variable": "Gender",
            "segments": [
                {"name": f"Segment {i}", "number_of_farmers": 10}
                for i in range(6)
            ],
        }
        res = await client.post(
            app.url_path_for("case_import:recalculate_segmentation"),
            headers={"Authorization": f"Bearer {admin_account.token}"},
            json=payload,
        )
        assert res.status_code == 422

import pytest
import sys
import subprocess

from pathlib import Path
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy.orm import Session

from tests.test_000_main import Acc
from models.case import LivingIncomeStudyEnum

sys.path.append("..")

# ------------------------------------------------------------------
# Accounts
# ------------------------------------------------------------------

non_admin_account = Acc(email="viewer@akvo.org", token=None)
admin_account = Acc(email="super_admin@akvo.org", token=None)

# ------------------------------------------------------------------
# Test assets
# ------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parents[1]
TEST_DIR = BASE_DIR / "assets" / "tests"

VALID_FILE = TEST_DIR / "valid.xlsm"
INVALID_FILE = TEST_DIR / "invalid.xlsm"
MACRO_VALIDATION_ERROR_FILE = TEST_DIR / "macro_validation_error.xlsm"
EMPTY_FILE = TEST_DIR / "empty.txt"


# ------------------------------------------------------------------
# Seeder
# ------------------------------------------------------------------


def run_seeder():
    try:
        command1 = ["python", "-m", "seeder.commodity"]
        with subprocess.Popen(command1, stdout=subprocess.PIPE) as p1:
            output1 = p1.communicate()[0].decode()

        command2 = ["python", "-m", "seeder.question"]
        with subprocess.Popen(
            command2, stdin=subprocess.PIPE, stdout=subprocess.PIPE
        ) as p2:
            input_data = output1.encode()
            result2, _ = p2.communicate(input_data)

        print("Output from first command:", output1)
        print("Output from second command:", result2.decode())
    except subprocess.CalledProcessError as e:
        print(f"Command failed with exit code {e.returncode}:")
        print(e.output.decode())


# ------------------------------------------------------------------
# Fixtures
# ------------------------------------------------------------------


@pytest.fixture
def admin_headers():
    return {"Authorization": f"Bearer {admin_account.token}"}


@pytest.fixture
def non_admin_headers():
    return {"Authorization": f"Bearer {non_admin_account.token}"}


@pytest.fixture
def upload_file_factory(client: AsyncClient, app: FastAPI):
    async def _upload(file_path: Path, headers=None):
        with open(file_path, "rb") as f:
            files = {
                "file": (
                    file_path.name,
                    f.read(),
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",  # noqa
                )
            }

        return await client.post(
            app.url_path_for("case_import:upload_file"),
            headers=headers,
            files=files,
        )

    return _upload


# ------------------------------------------------------------------
# Tests
# ------------------------------------------------------------------


class TestCaseImport:

    @pytest.mark.asyncio
    async def test_case_import_valid_file(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        upload_file_factory,
        admin_headers,
        non_admin_headers,
    ):
        res = await upload_file_factory(VALID_FILE)
        assert res.status_code == 403

        res = await upload_file_factory(VALID_FILE, non_admin_headers)
        assert res.status_code == 403

        res = await upload_file_factory(VALID_FILE, admin_headers)
        assert res.status_code == 200
        assert "import_id" in res.json()
        assert "columns" in res.json()

    @pytest.mark.asyncio
    async def test_case_import_invalid_file(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        upload_file_factory,
        admin_headers,
        non_admin_headers,
    ):
        res = await upload_file_factory(INVALID_FILE)
        assert res.status_code == 403

        res = await upload_file_factory(INVALID_FILE, non_admin_headers)
        assert res.status_code == 403

        res = await upload_file_factory(INVALID_FILE, admin_headers)
        assert res.status_code == 400
        assert res.json() == {"detail": "Data or Mapping sheet is empty"}

    @pytest.mark.asyncio
    async def test_case_import_macro_validation_error(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        upload_file_factory,
        admin_headers,
        non_admin_headers,
    ):
        res = await upload_file_factory(MACRO_VALIDATION_ERROR_FILE)
        assert res.status_code == 403

        res = await upload_file_factory(
            MACRO_VALIDATION_ERROR_FILE, non_admin_headers
        )
        assert res.status_code == 403

        res = await upload_file_factory(
            MACRO_VALIDATION_ERROR_FILE, admin_headers
        )
        assert res.status_code == 400
        assert res.json() == {
            "detail": "Excel file is not ready for upload. Fix issues in Mapping sheet."  # noqa
        }

    @pytest.mark.asyncio
    async def test_case_import_empty_invalid_file_type(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        admin_headers,
    ):
        with open(EMPTY_FILE, "rb") as f:
            files = {"file": ("empty.txt", f.read(), "text/plain")}

        res = await client.post(
            app.url_path_for("case_import:upload_file"),
            headers=admin_headers,
            files=files,
        )

        assert res.status_code == 400
        assert res.json() == {
            "detail": "Only .xlsx and .xlsm files are supported"
        }

    @pytest.mark.asyncio
    async def test_case_import_segmentation_preview_valid_file(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        upload_file_factory,
        admin_headers,
    ):
        res = await upload_file_factory(VALID_FILE, admin_headers)
        import_id = res.json()["import_id"]

        res = await client.post(
            app.url_path_for("case_import:segmentation_preview"),
            json={
                "import_id": import_id,
                "segmentation_variable": "hh_farmer_gender",
                "variable_type": "categorical",
            },
        )
        assert res.status_code == 403

        res = await client.post(
            app.url_path_for("case_import:segmentation_preview"),
            headers=admin_headers,
            json={
                "import_id": import_id,
                "segmentation_variable": "hh_farmer_gender",
                "variable_type": "categorical",
            },
        )

        assert res.status_code == 200

    @pytest.mark.asyncio
    async def test_case_import_process_confirmed_segmentation_valid_file(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        upload_file_factory,
        admin_headers,
    ):
        run_seeder()

        res = await upload_file_factory(VALID_FILE, admin_headers)
        import_id = res.json()["import_id"]

        preview = await client.post(
            app.url_path_for("case_import:segmentation_preview"),
            headers=admin_headers,
            json={
                "import_id": import_id,
                "segmentation_variable": "hh_farmer_gender",
                "variable_type": "categorical",
            },
        )

        segments = []
        for seg in preview.json()["segments"]:
            seg["name"] = seg["value"]
            segments.append(seg)

        payload = {
            "name": "Case from spreadsheet import",
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
            "other_commodities": [],
            "tags": [],
            "company": None,
            "segments": segments,
        }

        case_res = await client.post(
            app.url_path_for("case:create"),
            headers=admin_headers,
            json=payload,
        )

        case_id = case_res.json()["id"]

        segments_with_ids = []
        for idx, seg in enumerate(case_res.json()["segments"]):
            seg["index"] = idx + 1
            seg["value"] = seg["name"]
            segments_with_ids.append(seg)

        res = await client.post(
            app.url_path_for("case_import:generate_segment_values"),
            headers=admin_headers,
            json={
                "case_id": case_id,
                "import_id": import_id,
                "segmentation_variable": "hh_farmer_gender",
                "segments": segments_with_ids,
            },
        )

        assert res.status_code == 200

    @pytest.mark.asyncio
    async def test_case_import_recalculate_segmentation_categorical(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        upload_file_factory,
        admin_headers,
    ):
        res = await upload_file_factory(VALID_FILE, admin_headers)
        import_id = res.json()["import_id"]

        payload = {
            "import_id": import_id,
            "segmentation_variable": "hh_farmer_gender",
            "variable_type": "categorical",
            "segments": [
                {"index": 1, "value": "Male"},
                {"index": 2, "value": "Female"},
            ],
        }

        res = await client.post(
            app.url_path_for("case_import:recalculate_segmentation"),
            headers=admin_headers,
            json=payload,
        )

        assert res.status_code == 200

    @pytest.mark.asyncio
    async def test_case_import_recalculate_segmentation_numerical(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        upload_file_factory,
        admin_headers,
    ):
        res = await upload_file_factory(VALID_FILE, admin_headers)
        import_id = res.json()["import_id"]

        res = await client.post(
            app.url_path_for("case_import:recalculate_segmentation"),
            headers=admin_headers,
            json={
                "import_id": import_id,
                "segmentation_variable": "hh_farmer_age",
                "variable_type": "numerical",
                "segments": [
                    {"index": 1, "value": 30},
                    {"index": 2, "value": 45},
                    {"index": 3, "value": 60},
                ],
            },
        )

        assert res.status_code == 200

    @pytest.mark.asyncio
    async def test_recalculate_segmentation_numerical_missing_segments(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        upload_file_factory,
        admin_headers,
    ):
        res = await upload_file_factory(VALID_FILE, admin_headers)
        import_id = res.json()["import_id"]

        res = await client.post(
            app.url_path_for("case_import:recalculate_segmentation"),
            headers=admin_headers,
            json={
                "import_id": import_id,
                "segmentation_variable": "hh_farmer_age",
                "variable_type": "numerical",
                "segments": [],
            },
        )

        assert res.status_code == 400

    @pytest.mark.asyncio
    async def test_case_import_segmentation_preview_vs_recalculate_numerical(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        upload_file_factory,
        admin_headers,
    ):
        res = await upload_file_factory(VALID_FILE, admin_headers)
        import_id = res.json()["import_id"]

        preview = await client.post(
            app.url_path_for("case_import:segmentation_preview"),
            headers=admin_headers,
            json={
                "import_id": import_id,
                "segmentation_variable": "hh_farmer_age",
                "variable_type": "numerical",
                "number_of_segments": 2,
            },
        )

        original_values = [s["value"] for s in preview.json()["segments"]]
        original_counts = [
            s["number_of_farmers"] for s in preview.json()["segments"]
        ]

        edited_segments = [
            {"index": i + 1, "value": s["value"] + 5}
            for i, s in enumerate(preview.json()["segments"])
        ]

        recalc = await client.post(
            app.url_path_for("case_import:recalculate_segmentation"),
            headers=admin_headers,
            json={
                "import_id": import_id,
                "segmentation_variable": "hh_farmer_age",
                "variable_type": "numerical",
                "segments": edited_segments,
            },
        )

        new_values = [s["value"] for s in recalc.json()["segments"]]
        new_counts = [
            s["number_of_farmers"] for s in recalc.json()["segments"]
        ]

        assert new_values != original_values
        assert new_counts != original_counts

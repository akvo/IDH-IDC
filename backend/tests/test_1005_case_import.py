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

non_admin_account = Acc(email="viewer@akvo.org", token=None)
admin_account = Acc(email="super_admin@akvo.org", token=None)

BASE_DIR = Path(__file__).resolve().parents[1]
TEST_DIR = BASE_DIR / "assets" / "tests"
VALID_FILE = f"{TEST_DIR}/valid.xlsm"
INVALID_FILE = f"{TEST_DIR}/invalid.xlsm"
MACRO_VALIDATION_ERROR_FILE = f"{TEST_DIR}/macro_validation_error.xlsm"
EMPTY_FILE = f"{TEST_DIR}/empty.txt"


def run_seeder():
    try:
        # Run first command
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


class TestCaseImport:
    @pytest.mark.asyncio
    async def test_case_import_valid_file(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        # Prepare the file to upload
        with open(VALID_FILE, "rb") as f:
            files = {
                "file": (
                    "valid.xlsm",
                    f.read(),
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",  # noqa
                )
            }

        # without cred
        response = await client.post(
            app.url_path_for("case_import:upload_file"), files=files
        )
        assert response.status_code == 403

        # non admin cred
        response = await client.post(
            app.url_path_for("case_import:upload_file"),
            headers={"Authorization": f"Bearer {non_admin_account.token}"},
            files=files,
        )
        assert response.status_code == 403

        # admin cred
        response = await client.post(
            app.url_path_for("case_import:upload_file"),
            headers={"Authorization": f"Bearer {admin_account.token}"},
            files=files,
        )
        assert response.status_code == 200
        assert "import_id" in response.json()
        assert "columns" in response.json()

    @pytest.mark.asyncio
    async def test_case_import_invalid_file(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        # Prepare the file to upload
        with open(INVALID_FILE, "rb") as f:
            files = {
                "file": (
                    "invalid.xlsm",
                    f.read(),
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",  # noqa
                )
            }

        # without cred
        response = await client.post(
            app.url_path_for("case_import:upload_file"), files=files
        )
        assert response.status_code == 403

        # non admin cred
        response = await client.post(
            app.url_path_for("case_import:upload_file"),
            headers={"Authorization": f"Bearer {non_admin_account.token}"},
            files=files,
        )
        assert response.status_code == 403

        # admin cred
        response = await client.post(
            app.url_path_for("case_import:upload_file"),
            headers={"Authorization": f"Bearer {admin_account.token}"},
            files=files,
        )
        assert response.status_code == 400
        assert response.json() == {"detail": "Data or Mapping sheet is empty"}

    @pytest.mark.asyncio
    async def test_case_import_macro_validation_error(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        # Prepare the file to upload
        with open(MACRO_VALIDATION_ERROR_FILE, "rb") as f:
            files = {
                "file": (
                    "macro_validation_error.xlsm",
                    f.read(),
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",  # noqa
                )
            }

        # without cred
        response = await client.post(
            app.url_path_for("case_import:upload_file"), files=files
        )
        assert response.status_code == 403

        # non admin cred
        response = await client.post(
            app.url_path_for("case_import:upload_file"),
            headers={"Authorization": f"Bearer {non_admin_account.token}"},
            files=files,
        )
        assert response.status_code == 403

        # admin cred
        response = await client.post(
            app.url_path_for("case_import:upload_file"),
            headers={"Authorization": f"Bearer {admin_account.token}"},
            files=files,
        )
        assert response.status_code == 400
        assert response.json() == {
            "detail": "Excel file is not ready for upload. Fix issues in Mapping sheet."  # noqa
        }

    @pytest.mark.asyncio
    async def test_case_import_empty_invalid_file_type(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        # Prepare an empty file to upload (i.e., no file attached)
        with open(EMPTY_FILE, "rb") as f:
            files = {"file": ("empty.txt", f.read(), "text/plain")}

        # admin cred
        response = await client.post(
            app.url_path_for("case_import:upload_file"),
            headers={"Authorization": f"Bearer {admin_account.token}"},
            files=files,
        )
        assert response.status_code == 400
        print(response.json(), "SELL")
        assert response.json() == {
            "detail": "Only .xlsx and .xlsm files are supported"
        }

    @pytest.mark.asyncio
    async def test_case_import_segmentation_preview_valid_file(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        # Prepare the file to upload
        with open(VALID_FILE, "rb") as f:
            files = {
                "file": (
                    "valid.xlsm",
                    f.read(),
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",  # noqa
                )
            }

        # upload the file admin cred
        response = await client.post(
            app.url_path_for("case_import:upload_file"),
            headers={"Authorization": f"Bearer {admin_account.token}"},
            files=files,
        )
        assert response.status_code == 200
        assert "import_id" in response.json()
        import_id = response.json()["import_id"]

        # segementation preview with no cred
        response = await client.post(
            app.url_path_for("case_import:segmentation_preview"),
            json={
                "import_id": import_id,
                "segmentation_variable": "hh_farmer_gender",
                "variable_type": "categorical",
            },
        )
        assert response.status_code == 403

        # segementation preview with valid cred
        response = await client.post(
            app.url_path_for("case_import:segmentation_preview"),
            headers={"Authorization": f"Bearer {admin_account.token}"},
            json={
                "import_id": import_id,
                "segmentation_variable": "hh_farmer_gender",
                "variable_type": "categorical",
            },
        )

        assert response.status_code == 200
        assert response.json() == {
            "import_id": import_id,
            "segmentation_variable": "hh_farmer_gender",
            "variable_type": "categorical",
            "segments": [
                {
                    "index": 1,
                    "name": "hh_farmer_gender",
                    "operator": "is",
                    "value": "Male",
                    "number_of_farmers": 345,
                },
                {
                    "index": 2,
                    "name": "hh_farmer_gender",
                    "operator": "is",
                    "value": "Female",
                    "number_of_farmers": 63,
                },
            ],
        }

    @pytest.mark.asyncio
    async def test_case_import_process_confirmed_segmentation_valid_file(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        # Run the seeder before running any tests
        run_seeder()

        # Prepare the file to upload
        with open(VALID_FILE, "rb") as f:
            files = {
                "file": (
                    "valid.xlsm",
                    f.read(),
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",  # noqa
                )
            }

        # upload the file admin cred
        response = await client.post(
            app.url_path_for("case_import:upload_file"),
            headers={"Authorization": f"Bearer {admin_account.token}"},
            files=files,
        )
        assert response.status_code == 200
        assert "import_id" in response.json()
        import_id = response.json()["import_id"]

        # segementation preview with valid cred
        response = await client.post(
            app.url_path_for("case_import:segmentation_preview"),
            headers={"Authorization": f"Bearer {admin_account.token}"},
            json={
                "import_id": import_id,
                "segmentation_variable": "hh_farmer_gender",
                "variable_type": "categorical",
            },
        )
        assert response.status_code == 200
        assert "segments" in response.json()

        # rename the segments name
        segments = []
        for segment in response.json()["segments"]:
            segment["name"] = segment["value"]
            segments.append(segment)

        # create a case with validated segments
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
        # with admin user cred
        res = await client.post(
            app.url_path_for("case:create"),
            headers={"Authorization": f"Bearer {admin_account.token}"},
            json=payload,
        )
        assert res.status_code == 200
        assert "id" in res.json()
        assert "segments" in res.json()
        assert len(res.json()["segments"]) == len(segments)
        case_id = res.json()["id"]

        # populate segments with id
        segments_with_ids = []
        for idx, segment in enumerate(res.json()["segments"]):
            segment["index"] = idx + 1
            segment["value"] = segment["name"]
            segments_with_ids.append(segment)

        # process-confirmed-segmentation with no cred
        response = await client.post(
            app.url_path_for("case_import:generate_segment_values"),
            json={
                "case_id": case_id,
                "import_id": import_id,
                "segmentation_variable": "hh_farmer_gender",
                "segments": segments_with_ids,
            },
        )
        assert response.status_code == 403

        # process-confirmed-segmentation with cred
        response = await client.post(
            app.url_path_for("case_import:generate_segment_values"),
            headers={"Authorization": f"Bearer {admin_account.token}"},
            json={
                "case_id": case_id,
                "import_id": import_id,
                "segmentation_variable": "hh_farmer_gender",
                "segments": segments_with_ids,
            },
        )

        # Assert that the response is successful and contains the expected data
        assert response.status_code == 200
        assert response.json() == {
            "id": 13,
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
            "segmentation": 0,
            "living_income_study": "better_income",
            "multiple_commodities": 0,
            "logo": None,
            "created_by": "super_admin@akvo.org",
            "created_at": response.json()["created_at"],
            "updated_by": "John Doe",
            "updated_at": response.json()["updated_at"],
            "segments": [
                {
                    "id": 7,
                    "case": 13,
                    "region": None,
                    "name": "Male",
                    "target": None,
                    "adult": None,
                    "child": None,
                    "answers": {
                        "current-16-2": 2.1,
                        "feasible-16-2": 4.9,
                        "current-16-3": 1150.0,
                        "feasible-16-3": 2300.0,
                        "current-16-4": 2.81003463367686,
                        "feasible-16-4": 3.42472970979367,
                        "current-16-5": 1214.7127391916536,
                        "feasible-16-5": 4967.626895644348,
                        "current-17-35": 0.0,
                        "feasible-17-35": 0.0,
                        "current-17-36": 0.0,
                        "feasible-17-36": 43200.00000000028,
                        "current-17-38": 0.0,
                        "feasible-17-38": 14960.000000000036,
                    },
                    "benchmark": None,
                    "number_of_farmers": 345,
                },
                {
                    "id": 8,
                    "case": 13,
                    "region": None,
                    "name": "Female",
                    "target": None,
                    "adult": None,
                    "child": None,
                    "answers": {
                        "current-16-2": 0.7,
                        "feasible-16-2": 3.5,
                        "current-16-3": 801.7142731802805,
                        "feasible-16-3": 1747.999999999998,
                        "current-16-4": 2.63440746907206,
                        "feasible-16-4": 3.16128896288647,
                        "current-16-5": 934.8383075964261,
                        "feasible-16-5": 3066.8851803122257,
                        "current-17-35": 0.0,
                        "feasible-17-35": 0.0,
                        "current-17-36": 0.0,
                        "feasible-17-36": 120000.0,
                        "current-17-38": 0.0,
                        "feasible-17-38": 0.0,
                    },
                    "benchmark": None,
                    "number_of_farmers": 63,
                },
            ],
            "case_commodities": [
                {
                    "id": 16,
                    "commodity": 2,
                    "breakdown": 1,
                    "commodity_type": "focus",
                    "area_size_unit": "hectare",
                    "volume_measurement_unit": "liters",
                },
                {
                    "id": 17,
                    "commodity": None,
                    "breakdown": 1,
                    "commodity_type": "diversified",
                    "area_size_unit": "hectare",
                    "volume_measurement_unit": "liters",
                },
            ],
            "private": 0,
            "tags": [],
            "company": None,
            "status": 0,
            "import_id": import_id,
        }

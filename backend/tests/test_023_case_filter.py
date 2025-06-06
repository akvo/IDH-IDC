import sys
import pytest

from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy.orm import Session
from tests.test_000_main import Acc

from models.case import CaseStatusEnum

sys.path.append("..")

non_admin_account = Acc(email="support@akvo.org", token=None)
admin_account = Acc(email="super_admin@akvo.org", token=None)


class TestCaseWithFilterRoute:
    @pytest.mark.asyncio
    async def test_get_case_filter_by_search(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # test invalid search
        res = await client.get(
            app.url_path_for("case:get_all"),
            params={"search": "Lombok"},
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code == 404
        # test valid search
        res = await client.get(
            app.url_path_for("case:get_all"),
            params={"search": "Bali Rice"},
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code == 200
        res = res.json()
        assert res == {
            "current": 1,
            "data": [
                {
                    "id": 1,
                    "name": "Bali Rice and Corn Production",
                    "country": "Bali",
                    "company": None,
                    "focus_commodity": 2,
                    "year": 2023,
                    "diversified_commodities_count": 2,
                    "created_at": res["data"][0]["created_at"],
                    "created_by": "super_admin@akvo.org",
                    "tags": [2, 1],
                    "status": 0,
                    "has_scenario_data": False,
                    "scenario_outcome_data_source": [],
                    "scenario_data": [],
                    "has_segment_with_answers": False,
                }
            ],
            "total": 1,
            "total_page": 1,
        }

    @pytest.mark.asyncio
    async def test_get_case_filter_by_tags(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # test invalid search
        res = await client.get(
            app.url_path_for("case:get_all"),
            params={"tags": [100, 200]},
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code == 404
        # test valid search
        res = await client.get(
            app.url_path_for("case:get_all"),
            params={"tags": [1, 2]},
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code == 200
        res = res.json()
        assert res == {
            "current": 1,
            "data": [
                {
                    "id": 1,
                    "name": "Bali Rice and Corn Production",
                    "country": "Bali",
                    "company": None,
                    "focus_commodity": 2,
                    "year": 2023,
                    "diversified_commodities_count": 2,
                    "created_at": res["data"][0]["created_at"],
                    "created_by": "super_admin@akvo.org",
                    "tags": [2, 1],
                    "status": 0,
                    "has_scenario_data": False,
                    "scenario_outcome_data_source": [],
                    "scenario_data": [],
                    "has_segment_with_answers": False,
                }
            ],
            "total": 1,
            "total_page": 1,
        }

    @pytest.mark.asyncio
    async def test_get_case_filter_by_focus_Commodity(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # test invalid search
        res = await client.get(
            app.url_path_for("case:get_all"),
            params={"focus_commodity": [100]},
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code == 404
        # test valid search
        res = await client.get(
            app.url_path_for("case:get_all"),
            params={"focus_commodity": [2]},
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code == 200
        res = res.json()
        assert res == {
            "current": 1,
            "data": [
                {
                    "id": 1,
                    "name": "Bali Rice and Corn Production",
                    "country": "Bali",
                    "company": None,
                    "focus_commodity": 2,
                    "year": 2023,
                    "diversified_commodities_count": 2,
                    "created_at": res["data"][0]["created_at"],
                    "created_by": "super_admin@akvo.org",
                    "tags": [2, 1],
                    "status": 0,
                    "has_scenario_data": False,
                    "scenario_outcome_data_source": [],
                    "scenario_data": [],
                    "has_segment_with_answers": False,
                }
            ],
            "total": 1,
            "total_page": 1,
        }

    @pytest.mark.asyncio
    async def test_get_case_combined_filter(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # test invalid search
        res = await client.get(
            app.url_path_for("case:get_all"),
            params={"search": "Rice", "tags": [1], "focus_commodity": [100]},
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code == 404
        # test valid search
        res = await client.get(
            app.url_path_for("case:get_all"),
            params={"search": "Rice", "tags": [1], "focus_commodity": [2]},
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code == 200
        res = res.json()
        assert res == {
            "current": 1,
            "data": [
                {
                    "id": 1,
                    "name": "Bali Rice and Corn Production",
                    "country": "Bali",
                    "company": None,
                    "focus_commodity": 2,
                    "year": 2023,
                    "diversified_commodities_count": 2,
                    "created_at": res["data"][0]["created_at"],
                    "created_by": "super_admin@akvo.org",
                    "tags": [2, 1],
                    "status": 0,
                    "has_scenario_data": False,
                    "scenario_outcome_data_source": [],
                    "scenario_data": [],
                    "has_segment_with_answers": False,
                }
            ],
            "total": 1,
            "total_page": 1,
        }

    @pytest.mark.asyncio
    async def test_get_case_filtered_by_country(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        res = await client.get(
            app.url_path_for("case:get_all"),
            params={"country": 100},
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code == 404
        res = await client.get(
            app.url_path_for("case:get_all"),
            params={"country": 2},
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code == 200
        res = res.json()
        assert res == {
            "current": 1,
            "data": [
                {
                    "id": 2,
                    "name": "Bali Coffee Production (Private)",
                    "country": "Bali",
                    "company": None,
                    "focus_commodity": 1,
                    "diversified_commodities_count": 1,
                    "year": 2023,
                    "created_at": res["data"][0]["created_at"],
                    "created_by": "super_admin@akvo.org",
                    "tags": [],
                    "status": 0,
                    "has_scenario_data": False,
                    "scenario_outcome_data_source": [],
                    "scenario_data": [],
                    "has_segment_with_answers": False,
                },
                {
                    "id": 1,
                    "name": "Bali Rice and Corn Production",
                    "country": "Bali",
                    "company": None,
                    "focus_commodity": 2,
                    "diversified_commodities_count": 2,
                    "year": 2023,
                    "created_at": res["data"][1]["created_at"],
                    "created_by": "super_admin@akvo.org",
                    "tags": [2, 1],
                    "status": 0,
                    "has_scenario_data": False,
                    "scenario_outcome_data_source": [],
                    "scenario_data": [],
                    "has_segment_with_answers": False,
                },
            ],
            "total": 2,
            "total_page": 1,
        }

    @pytest.mark.asyncio
    async def test_get_case_filtered_by_email(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        res = await client.get(
            app.url_path_for("case:get_all"),
            params={"email": "not_found@mail.com"},
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code == 404
        res = await client.get(
            app.url_path_for("case:get_all"),
            params={"email": "admin"},
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code == 200
        res = res.json()
        assert res == {
            "current": 1,
            "data": [
                {
                    "id": 2,
                    "name": "Bali Coffee Production (Private)",
                    "country": "Bali",
                    "company": None,
                    "focus_commodity": 1,
                    "diversified_commodities_count": 1,
                    "year": 2023,
                    "created_at": res["data"][0]["created_at"],
                    "created_by": "super_admin@akvo.org",
                    "tags": [],
                    "status": 0,
                    "has_scenario_data": False,
                    "scenario_outcome_data_source": [],
                    "scenario_data": [],
                    "has_segment_with_answers": False,
                },
                {
                    "id": 1,
                    "name": "Bali Rice and Corn Production",
                    "country": "Bali",
                    "company": None,
                    "focus_commodity": 2,
                    "diversified_commodities_count": 2,
                    "year": 2023,
                    "created_at": res["data"][1]["created_at"],
                    "created_by": "super_admin@akvo.org",
                    "tags": [2, 1],
                    "status": 0,
                    "has_scenario_data": False,
                    "scenario_outcome_data_source": [],
                    "scenario_data": [],
                    "has_segment_with_answers": False,
                },
            ],
            "total": 2,
            "total_page": 1,
        }

    @pytest.mark.asyncio
    async def test_get_case_filtered_by_year(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        res = await client.get(
            app.url_path_for("case:get_all"),
            params={"year": "1992"},
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code == 404
        res = await client.get(
            app.url_path_for("case:get_all"),
            params={"year": "2023"},
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code == 200
        res = res.json()
        assert res == {
            "current": 1,
            "data": [
                {
                    "id": 2,
                    "name": "Bali Coffee Production (Private)",
                    "country": "Bali",
                    "company": None,
                    "focus_commodity": 1,
                    "diversified_commodities_count": 1,
                    "year": 2023,
                    "created_at": res["data"][0]["created_at"],
                    "created_by": "super_admin@akvo.org",
                    "tags": [],
                    "status": 0,
                    "has_scenario_data": False,
                    "scenario_outcome_data_source": [],
                    "scenario_data": [],
                    "has_segment_with_answers": False,
                },
                {
                    "id": 1,
                    "name": "Bali Rice and Corn Production",
                    "country": "Bali",
                    "company": None,
                    "focus_commodity": 2,
                    "diversified_commodities_count": 2,
                    "year": 2023,
                    "created_at": res["data"][1]["created_at"],
                    "created_by": "super_admin@akvo.org",
                    "tags": [2, 1],
                    "status": 0,
                    "has_scenario_data": False,
                    "scenario_outcome_data_source": [],
                    "scenario_data": [],
                    "has_segment_with_answers": False,
                },
            ],
            "total": 2,
            "total_page": 1,
        }

    @pytest.mark.asyncio
    async def test_get_case_filtered_by_company(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        res = await client.get(
            app.url_path_for("case:get_all"),
            params={"company": 10000},
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code == 404
        res = await client.get(
            app.url_path_for("case:get_all"),
            params={"company": 1},
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code == 404

    @pytest.mark.asyncio
    async def test_get_case_filtered_by_shared_with_me(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        res = await client.get(
            app.url_path_for("case:get_all"),
            params={"shared_with_me": True},
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code == 404

    @pytest.mark.asyncio
    async def test_get_case_filtered_by_status(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        res = await client.get(
            app.url_path_for("case:get_all"),
            params={"status": CaseStatusEnum.COMPLETED.value},
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code == 404

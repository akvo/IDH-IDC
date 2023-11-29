import sys
import pytest
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy.orm import Session
from tests.test_000_main import Acc
from models.visualization import VisualizationTab

sys.path.append("..")

non_admin_account = Acc(email="support@akvo.org", token=None)
admin_account = Acc(email="super_admin@akvo.org", token=None)


class TestVisualizationRoute:
    @pytest.mark.asyncio
    async def test_create_visualization(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        payload = [
            {
                "case": 1,
                "tab": VisualizationTab.sensitivity_analysis.value,
                "config": {
                    "key": "value 1",
                    "another_key": "value 2",
                },
            }
        ]
        # with admin user cred
        res = await client.post(
            app.url_path_for("visualization:create_or_update"),
            headers={"Authorization": f"Bearer {admin_account.token}"},
            json=payload,
        )
        assert res.status_code == 200
        res = res.json()
        assert res == [
            {
                "id": 1,
                "case": 1,
                "tab": VisualizationTab.sensitivity_analysis.value,
                "config": {"key": "value 1", "another_key": "value 2"},
            }
        ]

    @pytest.mark.asyncio
    async def test_create_second_visualization(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        payload = [
            {
                "case": 1,
                "tab": VisualizationTab.scenario_modeling.value,
                "config": {
                    "key": "value",
                },
            }
        ]
        # with admin user cred
        res = await client.post(
            app.url_path_for("visualization:create_or_update"),
            headers={"Authorization": f"Bearer {admin_account.token}"},
            json=payload,
        )
        assert res.status_code == 200
        res = res.json()
        assert res == [
            {
                "id": 2,
                "case": 1,
                "tab": VisualizationTab.scenario_modeling.value,
                "config": {"key": "value"},
            }
        ]

    @pytest.mark.asyncio
    async def test_update_visualization(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        payload = [
            {
                "case": 1,
                "tab": VisualizationTab.sensitivity_analysis.value,
                "config": {
                    "key": "value 1",
                    "second_key": "value 2",
                    "another_key": "another value",
                },
            }
        ]
        # with admin user cred
        res = await client.post(
            app.url_path_for("visualization:create_or_update"),
            headers={"Authorization": f"Bearer {admin_account.token}"},
            json=payload,
        )
        assert res.status_code == 200
        res = res.json()
        assert res == [
            {
                "id": 1,
                "case": 1,
                "tab": VisualizationTab.sensitivity_analysis.value,
                "config": {
                    "key": "value 1",
                    "second_key": "value 2",
                    "another_key": "another value",
                },
            }
        ]

    @pytest.mark.asyncio
    async def test_get_visualization_by_case_id(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # with admin user cred
        res = await client.get(
            app.url_path_for("visualization:get_by_case_id", case_id=1),
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code == 200
        res = res.json()
        assert res == [
            {
                "id": 2,
                "case": 1,
                "tab": VisualizationTab.scenario_modeling.value,
                "config": {"key": "value"},
            },
            {
                "id": 1,
                "case": 1,
                "tab": VisualizationTab.sensitivity_analysis.value,
                "config": {
                    "key": "value 1",
                    "second_key": "value 2",
                    "another_key": "another value",
                },
            },
        ]

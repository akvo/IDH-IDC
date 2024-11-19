import sys
import pytest

from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy.orm import Session
from tests.test_000_main import Acc


sys.path.append("..")

non_admin_account = Acc(email="editor@akvo.org", token=None)
admin_account = Acc(email="super_admin@akvo.org", token=None)


class TestCompanyRoute:
    @pytest.mark.asyncio
    async def test_get_all_company_return_404(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # without cred
        res = await client.get(app.url_path_for("company:get_all"))
        assert res.status_code == 403

        # with cred but not super admin
        res = await client.get(
            app.url_path_for("company:get_all"),
            headers={"Authorization": f"Bearer {non_admin_account.token}"},
        )
        assert res.status_code == 403

        # with cred super admin
        res = await client.get(
            app.url_path_for("company:get_all"),
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code == 404

    @pytest.mark.asyncio
    async def test_get_company_by_id_return_404(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # without cred
        res = await client.get(
            app.url_path_for("company:get_by_id", company_id=1000),
        )
        assert res.status_code == 403

        # with cred super admin
        res = await client.get(
            app.url_path_for("company:get_by_id", company_id=1000),
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code == 404

    @pytest.mark.asyncio
    async def test_create_company(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        payload = {
            "name": "Company Test",
        }
        # without cred
        res = await client.post(
            app.url_path_for("company:create"),
            json=payload,
        )
        assert res.status_code == 403
        # with normal user cred
        res = await client.post(
            app.url_path_for("company:create"),
            headers={"Authorization": f"Bearer {non_admin_account.token}"},
            json=payload,
        )
        assert res.status_code == 403
        # with admin user cred
        res = await client.post(
            app.url_path_for("company:create"),
            headers={"Authorization": f"Bearer {admin_account.token}"},
            json=payload,
        )
        assert res.status_code == 200
        res = res.json()
        assert res == {"id": 1, "name": "Company Test"}

    @pytest.mark.asyncio
    async def test_get_all_company(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # with cred super admin
        res = await client.get(
            app.url_path_for("company:get_all"),
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code == 200
        res = res.json()
        assert res == {
            "current": 1,
            "data": [{"id": 1, "name": "Company Test"}],
            "total": 1,
            "total_page": 1,
        }

    @pytest.mark.asyncio
    async def test_get_company_by_id(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # with cred super admin
        res = await client.get(
            app.url_path_for("company:get_by_id", company_id=1),
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code == 200
        res = res.json()
        assert res == {"id": 1, "name": "Company Test"}

    @pytest.mark.asyncio
    async def test_get_company_options(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # without cred
        res = await client.get(
            app.url_path_for("company:get_options"),
        )
        assert res.status_code == 200
        res = res.json()
        assert res == [{"label": "Company Test", "value": 1}]

    @pytest.mark.asyncio
    async def test_update_company(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        payload = {
            "name": "Company Updated",
        }
        # without cred
        res = await client.put(
            app.url_path_for("company:update", company_id=1),
            json=payload,
        )
        assert res.status_code == 403
        # with normal user cred
        res = await client.put(
            app.url_path_for("company:update", company_id=1),
            headers={"Authorization": f"Bearer {non_admin_account.token}"},
            json=payload,
        )
        assert res.status_code == 403
        # with admin user cred
        res = await client.put(
            app.url_path_for("company:update", company_id=1),
            headers={"Authorization": f"Bearer {admin_account.token}"},
            json=payload,
        )
        assert res.status_code == 200
        res = res.json()
        assert res == {
            "id": 1,
            "name": "Company Updated",
        }

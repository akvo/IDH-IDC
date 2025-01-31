import sys
import pytest

from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy.orm import Session
from tests.test_000_main import Acc


sys.path.append("..")

non_admin_account = Acc(email="editor@akvo.org", token=None)
admin_account = Acc(email="super_admin@akvo.org", token=None)


class TestMapRoute:
    @pytest.mark.asyncio
    async def test_get_map_case_by_country(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # without cred
        res = await client.get(app.url_path_for("map:get_case_by_country"))
        assert res.status_code == 403

        # with cred but not super admin
        res = await client.get(
            app.url_path_for("map:get_case_by_country"),
            headers={"Authorization": f"Bearer {non_admin_account.token}"},
        )
        assert res.status_code == 200

        # with cred super admin
        res = await client.get(
            app.url_path_for("map:get_case_by_country"),
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code == 200
        res = res.json()
        assert res == [
            {
                "case_count": 3,
                "COUNTRY": "Bali",
                "country_id": 2,
                "total_farmers": 28,
            }
        ]

    @pytest.mark.asyncio
    async def test_get_map_case_by_country_and_company(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # without cred
        res = await client.get(
            app.url_path_for("map:get_case_by_country_and_company")
        )
        assert res.status_code == 403

        # with cred but not super admin
        res = await client.get(
            app.url_path_for("map:get_case_by_country_and_company"),
            headers={"Authorization": f"Bearer {non_admin_account.token}"},
        )
        assert res.status_code == 200

        # with cred super admin
        res = await client.get(
            app.url_path_for("map:get_case_by_country_and_company"),
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code == 200
        res = res.json()
        assert res == [
            {
                "COUNTRY": "Bali",
                "case_count": 3,
                "company": "Company Updated",
                "company_id": 1,
                "country_id": 2,
                "total_farmers": 28,
            },
        ]

import sys
import pytest

from sqlalchemy.orm import Session
from fastapi import FastAPI
from httpx import AsyncClient

from tests.test_000_main import Acc
from models.case import Case
from models.user import User

pytestmark = pytest.mark.asyncio
sys.path.append("..")


account = Acc(email="super_admin@akvo.org", token=None)
non_admin_account = Acc(email="support@akvo.org", token=None)


class TestCompanyDeletion:
    @pytest.mark.asyncio
    async def test_delete_company_not_authorized(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # delete with no cred
        res = await client.delete(
            app.url_path_for("company:delete", company_id=1),
        )
        assert res.status_code == 403
        # delete with non admin
        res = await client.delete(
            app.url_path_for("company:delete", company_id=1),
            headers={"Authorization": f"Bearer {non_admin_account.token}"},
        )
        assert res.status_code == 403

        # delete not found
        res = await client.delete(
            app.url_path_for("user:delete", user_id=1000),
            headers={"Authorization": f"Bearer {account.token}"},
        )
        assert res.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_company_linked_to_user_or_case(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        case = session.query(Case).filter(Case.company.is_not(None)).first()
        assert case is not None
        assert case.company == 1
        user = session.query(User).filter(User.company.is_not(None)).first()
        assert user is not None
        assert user.company == 1

        res = await client.delete(
            app.url_path_for("company:delete", company_id=1),
            headers={"Authorization": f"Bearer {account.token}"},
        )
        assert res.status_code == 409
        res = res.json()
        assert res == {
            "detail": "There're some users & cases linked into this company."
        }

    @pytest.mark.asyncio
    async def test_delete_company(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        payload = {
            "name": "Company to delete",
        }
        # create
        res = await client.post(
            app.url_path_for("company:create"),
            headers={"Authorization": f"Bearer {account.token}"},
            json=payload,
        )
        assert res.status_code == 200
        res = res.json()
        company_id = res["id"]

        # delete
        res = await client.delete(
            app.url_path_for("company:delete", company_id=company_id),
            headers={"Authorization": f"Bearer {account.token}"},
        )
        assert res.status_code == 204

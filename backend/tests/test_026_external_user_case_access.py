import sys
import pytest
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy.orm import Session
from tests.test_000_main import Acc
from middleware import create_access_token
from models.user import UserRole, UserType
from db.crud_user import get_user_by_email

sys.path.append("..")

admin_account = Acc(email="super_admin@akvo.org", token=None)


class TestExternalUserAccessIsolation:
    @pytest.mark.asyncio
    async def test_access_isolation_for_advanced_and_regular(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # 1. Create Advanced User
        advanced_user_payload = {
            "fullname": "Advanced User",
            "email": "advanced@akvo.org",
            "password": None,
            "organisation": 1,
            "role": UserRole.user.value,
            "user_type": UserType.external_advanced.value,
        }
        res = await client.post(
            app.url_path_for("user:register"),
            data=advanced_user_payload,
            headers={
                "Authorization": f"Bearer {admin_account.token}",
                "content-type": "application/x-www-form-urlencoded",
            },
        )
        assert res.status_code == 200

        # Activate the user programmatically
        adv_user = get_user_by_email(session, "advanced@akvo.org")
        adv_user.is_active = 1
        session.commit()
        adv_token = create_access_token(data={"email": "advanced@akvo.org"})

        # 2. Create Regular User
        regular_user_payload = {
            "fullname": "Regular User",
            "email": "regular@akvo.org",
            "password": None,
            "organisation": 1,
            "role": UserRole.user.value,
            "user_type": UserType.external_regular.value,
        }
        res = await client.post(
            app.url_path_for("user:register"),
            data=regular_user_payload,
            headers={
                "Authorization": f"Bearer {admin_account.token}",
                "content-type": "application/x-www-form-urlencoded",
            },
        )
        assert res.status_code == 200

        reg_user = get_user_by_email(session, "regular@akvo.org")
        reg_user.is_active = 1
        session.commit()
        reg_token = create_access_token(data={"email": "regular@akvo.org"})

        # 3. Test Advanced User can see Cases from same organisation
        res = await client.get(
            app.url_path_for("case:get_all"),
            headers={"Authorization": f"Bearer {adv_token}"},
        )
        assert res.status_code == 200
        data = res.json()["data"]
        assert len(data) > 0  # Should see cases created by super_admin

        # 4. Test Regular User cannot see those cases if not shared
        # and not same company
        res = await client.get(
            app.url_path_for("case:get_all"),
            headers={"Authorization": f"Bearer {reg_token}"},
        )
        assert res.status_code in [404, 200]
        if res.status_code == 200:
            assert len(res.json()["data"]) == 0

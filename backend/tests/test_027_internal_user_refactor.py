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


class TestInternalUserRefactor:
    @pytest.mark.asyncio
    async def test_internal_user_access_without_bu(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # Create Internal User without BU
        internal_user_payload = {
            "fullname": "Internal User Without BU",
            "email": "internal_no_bu@akvo.org",
            "password": "Password123",
            "organisation": 1,
            "role": UserRole.user.value,
            "user_type": UserType.internal.value,
        }
        res = await client.post(
            app.url_path_for("user:register"),
            data=internal_user_payload,
            headers={
                "Authorization": f"Bearer {admin_account.token}",
                "content-type": "application/x-www-form-urlencoded",
            },
        )
        assert res.status_code == 200

        # Activate
        user = get_user_by_email(session, "internal_no_bu@akvo.org")
        user.is_active = 1
        session.commit()
        token = create_access_token(data={"email": "internal_no_bu@akvo.org"})

        # Test visibility - should see public cases
        res = await client.get(
            app.url_path_for("case:get_all"),
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 200
        data = res.json()["data"]
        # Should see public cases (e.g. from seed or other tests)
        assert len(data) > 0

    @pytest.mark.asyncio
    async def test_external_regular_blocked_by_guard(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # Create Regular User without Company or Access
        reg_payload = {
            "fullname": "Pure Regular",
            "email": "pure_regular@akvo.org",
            "password": "Password123",
            "organisation": 1,
            "role": UserRole.user.value,
            "user_type": UserType.external_regular.value,
        }
        res = await client.post(
            app.url_path_for("user:register"),
            data=reg_payload,
            headers={
                "Authorization": f"Bearer {admin_account.token}",
                "content-type": "application/x-www-form-urlencoded",
            },
        )
        user = get_user_by_email(session, "pure_regular@akvo.org")
        user.is_active = 1
        session.commit()
        token = create_access_token(data={"email": "pure_regular@akvo.org"})

        # Get all cases - should return 404
        res = await client.get(
            app.url_path_for("case:get_all"),
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 404

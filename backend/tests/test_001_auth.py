import sys
import os
import pytest
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy.orm import Session
from db import crud_organisation
from middleware import verify_token
from tests.test_000_main import Acc
from models.user import UserRole

sys.path.append("..")

account = Acc(email=None, token=None)

CLIENT_ID = os.environ.get("CLIENT_ID", None)
CLIENT_SECRET = os.environ.get("CLIENT_SECRET", None)


class TestUserAuthentication:
    @pytest.mark.asyncio
    async def test_get_all_user_expect_401(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        res = await client.get(
            app.url_path_for("user:get_all"),
            headers={"Authorization": f"Bearer {account.token}"},
        )
        assert res.status_code == 401

    def test_token_verification(self):
        account = Acc(email="super_admin@akvo.org", token=None)
        assert account.token != ""
        assert account.decoded == account.data
        verify = verify_token(account.decoded)
        assert verify["exp"] > 0

    @pytest.mark.asyncio
    async def test_add_organisation(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        org = crud_organisation.add_organisation(session=session, name="Akvo")
        assert org.name == "Akvo"

    @pytest.mark.asyncio
    async def test_get_organisation_options(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # without cred
        res = await client.get(app.url_path_for("organisation:get_options"))
        assert res.status_code == 200
        res = res.json()
        for r in res:
            assert "label" in r
            assert "value" in r

    @pytest.mark.asyncio
    async def test_user_register(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        user_payload = {
            "fullname": "John Doe",
            "email": "super_admin@akvo.org",
            "password": "test",
            "organisation": 1,
        }
        res = await client.post(
            app.url_path_for("user:register"),
            data=user_payload,
            headers={
                "content-type": "application/x-www-form-urlencoded",
                "Authorization": f"Bearer {account.token}",
            },
        )
        assert res.status_code == 200
        res = res.json()
        assert res == {
            "id": 1,
            "email": "super_admin@akvo.org",
            "fullname": "John Doe",
            "organisation": 1,
            "active": False,
            "role": UserRole.user.value,
        }

    @pytest.mark.asyncio
    async def test_user_register_with_same_email(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        user_payload = {
            "fullname": "John Doe",
            "email": "super_admin@akvo.org",
            "password": "test",
            "organisation": 1,
        }
        res = await client.post(
            app.url_path_for("user:register"),
            data=user_payload,
            headers={
                "content-type": "application/x-www-form-urlencoded",
                "Authorization": f"Bearer {account.token}",
            },
        )
        assert res.status_code == 409

    @pytest.mark.asyncio
    async def test_invalid_user_login(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # test invalid login with wrong password
        res = await client.post(
            app.url_path_for("user:login"),
            headers={"content-type": "application/x-www-form-urlencoded"},
            data={
                "username": "super_admin@akvo.org",
                "password": "wrong_password",
                "grant_type": "password",
                "scopes": ["openid", "email"],
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
            },
        )
        assert res.status_code == 401
        res = res.json()
        assert res == {"detail": "Incorrect email or password."}
        # test invalid login with wrong email
        res = await client.post(
            app.url_path_for("user:login"),
            headers={"content-type": "application/x-www-form-urlencoded"},
            data={
                "username": "xxx@akvo.org",
                "password": "test",
                "grant_type": "password",
                "scopes": ["openid", "email"],
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
            },
        )
        assert res.status_code == 401
        res = res.json()
        assert res == {"detail": "Incorrect email or password."}
        # test invalid login grant type
        res = await client.post(
            app.url_path_for("user:login"),
            headers={"content-type": "application/x-www-form-urlencoded"},
            data={
                "username": "super_admin@akvo.org",
                "password": "test",
                "grant_type": "email",
                "scopes": ["openid", "email"],
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
            },
        )
        assert res.status_code == 422
        # test invalid login client_id
        res = await client.post(
            app.url_path_for("user:login"),
            headers={"content-type": "application/x-www-form-urlencoded"},
            data={
                "username": "super_admin@akvo.org",
                "password": "test",
                "grant_type": "password",
                "scopes": ["openid", "email"],
                "client_id": 123456789,
                "client_secret": 987654321,
            },
        )
        assert res.status_code == 404
        # test invalid login client_secret
        res = await client.post(
            app.url_path_for("user:login"),
            headers={"content-type": "application/x-www-form-urlencoded"},
            data={
                "username": "super_admin@akvo.org",
                "password": "test",
                "grant_type": "password",
                "scopes": ["openid", "email"],
                "client_id": CLIENT_ID,
                "client_secret": 987654321,
            },
        )
        assert res.status_code == 404

    @pytest.mark.asyncio
    async def test_valid_user_login_for_non_approved_user(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # valid login but the user not approved yet
        res = await client.post(
            app.url_path_for("user:login"),
            headers={"content-type": "application/x-www-form-urlencoded"},
            data={
                "username": "super_admin@akvo.org",
                "password": "test",
                "grant_type": "password",
                "scopes": ["openid", "email"],
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
            },
        )
        assert res.status_code == 401
        res = res.json()
        assert res == {
            "detail": "You can't login until your account is approved."
        }

    @pytest.mark.asyncio
    async def test_get_user_me(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        account = Acc(email="super_admin@akvo.org", token=None)
        res = await client.get(
            app.url_path_for("user:me"),
            headers={"Authorization": f"Bearer {account.token}"},
        )
        assert res.status_code == 200
        res = res.json()
        assert res == {
            "id": 1,
            "fullname": "John Doe",
            "email": "super_admin@akvo.org",
            "active": False,
            "role": UserRole.user.value,
            "all_cases": False,
            "business_unit_detail": None,
            "organisation_detail": {"id": 1, "name": "Akvo"},
            "tags_count": 0,
            "cases_count": 0,
            "case_access": [],
            "internal_user": False,
        }

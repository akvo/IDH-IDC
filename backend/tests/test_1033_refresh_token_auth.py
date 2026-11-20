import os
import sys
from datetime import datetime, timedelta
from typing import Generator

import pytest
from fastapi import FastAPI
from httpx import AsyncClient
from jose import jwt
from sqlalchemy import text
from sqlalchemy.orm import Session

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

from db import crud_refresh_token  # noqa: E402
from db.crud_organisation import default_organisation  # noqa: E402
from middleware import (  # noqa: E402
    ALGORITHM,
    REFRESH_COOKIE_NAME,
    SECRET_KEY,
    get_password_hash,
)
from models.refresh_token import RefreshToken  # noqa: E402
from models.reset_password import ResetPassword  # noqa: E402
from models.user import ToolType, User, UserRole  # noqa: E402

CLIENT_ID = os.environ.get("CLIENT_ID", "test")
CLIENT_SECRET = os.environ.get("CLIENT_SECRET", "test")


@pytest.fixture
def refresh_test_users(session: Session) -> Generator:
    created_user_ids = []

    def _create_user(
        email: str,
        password: str = "StrongPass123!",
        is_active: int = 1,
        tools=None,
    ) -> User:
        existing = session.query(User).filter(User.email == email).first()
        if existing:
            session.query(RefreshToken).filter(
                RefreshToken.user_id == existing.id
            ).delete()
            session.query(ResetPassword).filter(
                ResetPassword.user == existing.id
            ).delete()
            session.delete(existing)
            session.commit()

        org = default_organisation(session=session, name="IDH")
        user = User(
            fullname="Refresh Test User",
            email=email,
            password=get_password_hash(password),
            role=UserRole.viewer,
            organisation=org.id,
            is_active=is_active,
            tools=tools or [ToolType.idc.value, ToolType.academy.value],
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        created_user_ids.append(user.id)
        return user

    yield _create_user

    session.rollback()
    for uid in reversed(created_user_ids):
        session.query(RefreshToken).filter(RefreshToken.user_id == uid).delete()
        session.query(ResetPassword).filter(ResetPassword.user == uid).delete()
        u = session.query(User).filter(User.id == uid).first()
        if u:
            session.delete(u)
    session.commit()

    session.execute(
        text(
            "SELECT setval('user_id_seq', "
            "(SELECT COALESCE(MAX(id), 1) FROM \"user\"))"
        )
    )
    session.execute(
        text(
            "SELECT setval('refresh_tokens_id_seq', "
            "(SELECT COALESCE(MAX(id), 1) FROM refresh_tokens))"
        )
    )
    session.commit()


def _login_payload(email: str, password: str, remember_me: str = None) -> dict:
    data = {
        "username": email,
        "password": password,
        "grant_type": "password",
        "scopes": ["openid", "email"],
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
    }
    if remember_me is not None:
        data["remember_me"] = remember_me
    return data


def _find_refresh_set_cookie(res) -> str:
    headers = res.headers.get_list("set-cookie")
    for h in headers:
        if h.startswith(f"{REFRESH_COOKIE_NAME}="):
            return h
    return ""


class TestRefreshTokenCRUD:
    def test_hash_and_issue_rotation_unit(
        self, session: Session, refresh_test_users
    ) -> None:
        user = refresh_test_users("crud.refresh@example.com")
        raw_1, rec_1 = crud_refresh_token.issue_refresh_token(
            session=session, user_id=user.id, remember_me=False
        )
        assert len(raw_1) >= 40
        assert rec_1.token_hash == crud_refresh_token.hash_refresh_token(raw_1)
        assert rec_1.token_hash != raw_1
        assert rec_1.remember_me is False
        assert rec_1.revoked_at is None

        rotated = crud_refresh_token.rotate_refresh_token(
            session=session, raw_token=raw_1
        )
        assert rotated is not None
        raw_2, rec_2, rotated_user = rotated
        assert raw_2 != raw_1
        assert rec_2.family_id == rec_1.family_id
        assert rec_2.remember_me is False
        assert rotated_user.id == user.id

        session.refresh(rec_1)
        assert rec_1.revoked_at is not None

        # Replay of old token must revoke the whole family
        replay = crud_refresh_token.rotate_refresh_token(
            session=session, raw_token=raw_1
        )
        assert replay is None
        session.refresh(rec_2)
        assert rec_2.revoked_at is not None


class TestRefreshTokenAuthEndpoints:
    @pytest.mark.asyncio
    async def test_login_default_session_cookie_and_30m_jwt(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        refresh_test_users,
    ) -> None:
        user = refresh_test_users("login.default@example.com")
        before = datetime.utcnow()
        res = await client.post(
            app.url_path_for("user:login"),
            headers={"content-type": "application/x-www-form-urlencoded"},
            data=_login_payload(user.email, "StrongPass123!"),
        )
        assert res.status_code == 200
        body = res.json()
        assert body["token_type"] == "bearer"
        assert body["user"]["email"] == user.email

        claims = jwt.decode(body["access_token"], SECRET_KEY, algorithms=[ALGORITHM])
        exp_dt = datetime.utcfromtimestamp(claims["exp"])
        delta_seconds = (exp_dt - before).total_seconds()
        assert 1700 <= delta_seconds <= 1900

        set_cookie = _find_refresh_set_cookie(res)
        assert set_cookie != ""
        lower_cookie = set_cookie.lower()
        assert "httponly" in lower_cookie
        assert "samesite=lax" in lower_cookie
        assert "path=/" in lower_cookie
        assert "max-age" not in lower_cookie
        assert "secure" not in lower_cookie

        raw_cookie = res.cookies.get(REFRESH_COOKIE_NAME)
        assert raw_cookie is not None
        row = (
            session.query(RefreshToken)
            .filter(RefreshToken.user_id == user.id)
            .first()
        )
        assert row is not None
        assert row.token_hash != raw_cookie
        assert row.token_hash == crud_refresh_token.hash_refresh_token(raw_cookie)
        assert row.remember_me is False

    @pytest.mark.asyncio
    async def test_login_swagger_simplified_omitted_client_credentials(
        self,
        app: FastAPI,
        client: AsyncClient,
        refresh_test_users,
    ) -> None:
        user = refresh_test_users("login.swagger@example.com")
        # Simulates Swagger UI "Try it out": only username and password provided
        res = await client.post(
            app.url_path_for("user:login"),
            headers={"content-type": "application/x-www-form-urlencoded"},
            data={
                "username": user.email,
                "password": "StrongPass123!",
            },
        )
        assert res.status_code == 200
        body = res.json()
        assert body["token_type"] == "bearer"
        assert body["user"]["email"] == user.email
        assert body["access_token"] != ""

    @pytest.mark.asyncio
    async def test_login_remember_me_persistent_cookie_and_https_secure_flag(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        refresh_test_users,
    ) -> None:
        user = refresh_test_users("login.remember@example.com")
        res = await client.post(
            app.url_path_for("user:login"),
            headers={
                "content-type": "application/x-www-form-urlencoded",
                "x-forwarded-proto": "https",
            },
            data=_login_payload(user.email, "StrongPass123!", remember_me="true"),
        )
        assert res.status_code == 200

        set_cookie = _find_refresh_set_cookie(res)
        lower_cookie = set_cookie.lower()
        assert "httponly" in lower_cookie
        assert "samesite=lax" in lower_cookie
        assert "path=/" in lower_cookie
        assert "max-age=2592000" in lower_cookie
        assert "secure" in lower_cookie

        row = (
            session.query(RefreshToken)
            .filter(RefreshToken.user_id == user.id)
            .first()
        )
        assert row is not None
        assert row.remember_me is True
        assert (row.expires_at - datetime.utcnow()).days >= 29

    @pytest.mark.asyncio
    async def test_refresh_rotates_token_and_preserves_remember_me(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        refresh_test_users,
    ) -> None:
        user = refresh_test_users("refresh.rotate@example.com")
        login_res = await client.post(
            app.url_path_for("user:login"),
            headers={"content-type": "application/x-www-form-urlencoded"},
            data=_login_payload(user.email, "StrongPass123!", remember_me="true"),
        )
        assert login_res.status_code == 200
        token_1 = login_res.cookies.get(REFRESH_COOKIE_NAME)

        refresh_res = await client.post(app.url_path_for("user:refresh"))
        assert refresh_res.status_code == 200
        body = refresh_res.json()
        assert body["access_token"]
        assert body["user"]["email"] == user.email

        token_2 = refresh_res.cookies.get(REFRESH_COOKIE_NAME)
        assert token_2 is not None
        assert token_2 != token_1
        assert "max-age=2592000" in _find_refresh_set_cookie(refresh_res).lower()

        row_1 = (
            session.query(RefreshToken)
            .filter(
                RefreshToken.token_hash
                == crud_refresh_token.hash_refresh_token(token_1)
            )
            .first()
        )
        row_2 = (
            session.query(RefreshToken)
            .filter(
                RefreshToken.token_hash
                == crud_refresh_token.hash_refresh_token(token_2)
            )
            .first()
        )
        assert row_1.revoked_at is not None
        assert row_2.revoked_at is None
        assert row_2.family_id == row_1.family_id

    @pytest.mark.asyncio
    async def test_replay_detection_revokes_entire_family(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        refresh_test_users,
    ) -> None:
        user = refresh_test_users("refresh.replay@example.com")
        login_res = await client.post(
            app.url_path_for("user:login"),
            headers={"content-type": "application/x-www-form-urlencoded"},
            data=_login_payload(user.email, "StrongPass123!"),
        )
        token_1 = login_res.cookies.get(REFRESH_COOKIE_NAME)

        refresh_res = await client.post(app.url_path_for("user:refresh"))
        assert refresh_res.status_code == 200
        token_2 = refresh_res.cookies.get(REFRESH_COOKIE_NAME)

        # Replay token_1 (already rotated)
        client.cookies.clear()
        client.cookies.set(REFRESH_COOKIE_NAME, token_1)
        replay_res = await client.post(app.url_path_for("user:refresh"))
        assert replay_res.status_code == 401
        assert "max-age=0" in _find_refresh_set_cookie(replay_res).lower()

        # Newer token_2 in the same family must now also be revoked
        client.cookies.clear()
        client.cookies.set(REFRESH_COOKIE_NAME, token_2)
        followup_res = await client.post(app.url_path_for("user:refresh"))
        assert followup_res.status_code == 401

    @pytest.mark.asyncio
    async def test_refresh_rejects_missing_expired_and_inactive_user(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        refresh_test_users,
    ) -> None:
        # Missing cookie
        client.cookies.clear()
        res_missing = await client.post(app.url_path_for("user:refresh"))
        assert res_missing.status_code == 401

        # Expired token
        user = refresh_test_users("refresh.expired@example.com")
        login_res = await client.post(
            app.url_path_for("user:login"),
            headers={"content-type": "application/x-www-form-urlencoded"},
            data=_login_payload(user.email, "StrongPass123!"),
        )
        raw = login_res.cookies.get(REFRESH_COOKIE_NAME)
        row = (
            session.query(RefreshToken)
            .filter(
                RefreshToken.token_hash
                == crud_refresh_token.hash_refresh_token(raw)
            )
            .first()
        )
        row.expires_at = datetime.utcnow() - timedelta(minutes=5)
        session.commit()

        res_expired = await client.post(app.url_path_for("user:refresh"))
        assert res_expired.status_code == 401
        assert "max-age=0" in _find_refresh_set_cookie(res_expired).lower()

        # Inactive user
        inactive_user = refresh_test_users("refresh.inactive@example.com")
        client.cookies.clear()
        login_res_2 = await client.post(
            app.url_path_for("user:login"),
            headers={"content-type": "application/x-www-form-urlencoded"},
            data=_login_payload(inactive_user.email, "StrongPass123!"),
        )
        assert login_res_2.status_code == 200
        inactive_user.is_active = 0
        session.commit()

        res_inactive = await client.post(app.url_path_for("user:refresh"))
        assert res_inactive.status_code == 401

    @pytest.mark.asyncio
    async def test_logout_revokes_token_and_is_idempotent(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        refresh_test_users,
    ) -> None:
        user = refresh_test_users("logout.test@example.com")
        login_res = await client.post(
            app.url_path_for("user:login"),
            headers={"content-type": "application/x-www-form-urlencoded"},
            data=_login_payload(user.email, "StrongPass123!"),
        )
        raw = login_res.cookies.get(REFRESH_COOKIE_NAME)

        logout_res = await client.post(app.url_path_for("user:logout"))
        assert logout_res.status_code == 200
        assert "max-age=0" in _find_refresh_set_cookie(logout_res).lower()

        session.expire_all()
        row = (
            session.query(RefreshToken)
            .filter(
                RefreshToken.token_hash
                == crud_refresh_token.hash_refresh_token(raw)
            )
            .first()
        )
        assert row.revoked_at is not None

        # Subsequent refresh fails
        client.cookies.clear()
        client.cookies.set(REFRESH_COOKIE_NAME, raw)
        assert (await client.post(app.url_path_for("user:refresh"))).status_code == 401

        # Idempotent logout without cookie returns 200
        client.cookies.clear()
        assert (await client.post(app.url_path_for("user:logout"))).status_code == 200

    @pytest.mark.asyncio
    async def test_password_change_and_reset_revoke_all_refresh_tokens(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        refresh_test_users,
    ) -> None:
        user = refresh_test_users("pwd.revoke@example.com")
        login_res = await client.post(
            app.url_path_for("user:login"),
            headers={"content-type": "application/x-www-form-urlencoded"},
            data=_login_payload(user.email, "StrongPass123!"),
        )
        access_token = login_res.json()["access_token"]
        raw_1 = login_res.cookies.get(REFRESH_COOKIE_NAME)

        # Change password revokes active refresh tokens
        change_res = await client.post(
            app.url_path_for("academy:change_password"),
            headers={"Authorization": f"Bearer {access_token}"},
            json={
                "current_password": "StrongPass123!",
                "new_password": "NewStrongPass123!",
                "confirm_password": "NewStrongPass123!",
            },
        )
        assert change_res.status_code == 200

        client.cookies.clear()
        client.cookies.set(REFRESH_COOKIE_NAME, raw_1)
        assert (await client.post(app.url_path_for("user:refresh"))).status_code == 401

        # Login again with new password -> reset password revokes active tokens
        login_res_2 = await client.post(
            app.url_path_for("user:login"),
            headers={"content-type": "application/x-www-form-urlencoded"},
            data=_login_payload(user.email, "NewStrongPass123!"),
        )
        assert login_res_2.status_code == 200
        raw_2 = login_res_2.cookies.get(REFRESH_COOKIE_NAME)

        reset_row = ResetPassword(user=user.id)
        session.add(reset_row)
        session.commit()

        reset_res = await client.post(
            app.url_path_for("user:reset-password", url=reset_row.url),
            data={"password": "ResetStrongPass123!"},
        )
        assert reset_res.status_code == 200

        client.cookies.clear()
        client.cookies.set(REFRESH_COOKIE_NAME, raw_2)
        assert (await client.post(app.url_path_for("user:refresh"))).status_code == 401

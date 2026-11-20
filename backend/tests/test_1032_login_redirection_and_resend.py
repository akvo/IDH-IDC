import os
import sys
import pytest
from typing import Generator
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy import text
from sqlalchemy.orm import Session

from models.user import User, ToolType, UserRole
from middleware import get_password_hash
from db.crud_organisation import default_organisation
from utils.mailer import Email

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)


@pytest.fixture
def auth_test_users(session: Session) -> Generator:
    created_user_ids = []

    def _create_user(
        email: str,
        password: str = "StrongPass123!",
        is_active: int = 1,
        tools: list = None,
        invitation_id: str = None,
    ) -> User:
        existing = session.query(User).filter(User.email == email).first()
        if existing:
            session.delete(existing)
            session.commit()

        org = default_organisation(session=session, name="IDH")
        user = User(
            fullname="Login Test User",
            email=email,
            password=get_password_hash(password),
            role=UserRole.viewer,
            organisation=org.id,
            is_active=is_active,
            invitation_id=invitation_id,
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
    session.commit()


class TestLoginAndResendAPI:
    @pytest.mark.asyncio
    async def test_login_successful_idc_user(
        self,
        app: FastAPI,
        client: AsyncClient,
        auth_test_users,
    ) -> None:
        user = auth_test_users(
            email="idc.user@example.com",
            tools=[ToolType.idc.value, ToolType.academy.value],
        )
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
        assert ToolType.idc.value in body["user"]["tools"]
        assert ToolType.academy.value in body["user"]["tools"]

    @pytest.mark.asyncio
    async def test_login_successful_academy_user(
        self,
        app: FastAPI,
        client: AsyncClient,
        auth_test_users,
    ) -> None:
        user = auth_test_users(
            email="academy.user@example.com",
            tools=[ToolType.academy.value],
        )
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
        assert body["user"]["tools"] == [ToolType.academy.value]

    @pytest.mark.asyncio
    async def test_login_unverified_academy_user(
        self,
        app: FastAPI,
        client: AsyncClient,
        auth_test_users,
    ) -> None:
        user = auth_test_users(
            email="unverified.user@example.com",
            is_active=0,
            invitation_id="pending_token_hex_123",
            tools=[ToolType.academy.value],
        )
        res = await client.post(
            app.url_path_for("user:login"),
            headers={"content-type": "application/x-www-form-urlencoded"},
            data={
                "username": user.email,
                "password": "StrongPass123!",
            },
        )
        assert res.status_code == 401
        body = res.json()
        assert body["error_code"] == "ACCOUNT_NOT_VERIFIED"
        assert body["email"] == user.email
        assert "confirm your email" in body["detail"]

    @pytest.mark.asyncio
    async def test_login_invalid_password(
        self,
        app: FastAPI,
        client: AsyncClient,
        auth_test_users,
    ) -> None:
        user = auth_test_users(email="valid.email@example.com")
        res = await client.post(
            app.url_path_for("user:login"),
            headers={"content-type": "application/x-www-form-urlencoded"},
            data={
                "username": user.email,
                "password": "WrongPassword999!",
            },
        )
        assert res.status_code == 401
        body = res.json()
        assert body["detail"] == "Incorrect email or password."

    @pytest.mark.asyncio
    async def test_login_inactive_user_without_invitation_id(
        self,
        app: FastAPI,
        client: AsyncClient,
        auth_test_users,
    ) -> None:
        user = auth_test_users(
            email="inactive.noinvite@example.com",
            is_active=0,
            invitation_id=None,
        )
        res = await client.post(
            app.url_path_for("user:login"),
            headers={"content-type": "application/x-www-form-urlencoded"},
            data={
                "username": user.email,
                "password": "StrongPass123!",
            },
        )
        assert res.status_code == 401
        body = res.json()
        assert body["detail"] == "You can't login until your account is approved."

    @pytest.mark.asyncio
    async def test_resend_verification_email(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        auth_test_users,
        monkeypatch,
    ) -> None:
        sent_emails = []

        def mock_send(self):
            sent_emails.append(self)
            return True

        monkeypatch.setattr(Email, "send", property(mock_send))

        user = auth_test_users(
            email="resend.user@example.com",
            is_active=0,
            invitation_id="existing_verify_token",
            tools=[ToolType.academy.value],
        )

        res = await client.post(
            app.url_path_for("user:resend_academy_verification"),
            json={"email": user.email},
        )
        assert res.status_code == 200
        body = res.json()
        assert (
            body["message"]
            == "Verification link has been resent to your email address."
        )
        assert len(sent_emails) == 1
        assert "existing_verify_token" in sent_emails[0].url

    @pytest.mark.asyncio
    async def test_resend_verification_generates_token_if_missing(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        auth_test_users,
        monkeypatch,
    ) -> None:
        sent_emails = []

        def mock_send(self):
            sent_emails.append(self)
            return True

        monkeypatch.setattr(Email, "send", property(mock_send))

        user = auth_test_users(
            email="resend.notoken@example.com",
            is_active=0,
            invitation_id=None,
            tools=[ToolType.academy.value],
        )

        res = await client.post(
            app.url_path_for("user:resend_academy_verification"),
            json={"email": user.email},
        )
        assert res.status_code == 200
        session.refresh(user)
        assert user.invitation_id is not None
        assert len(user.invitation_id) >= 32
        assert len(sent_emails) == 1
        assert user.invitation_id in sent_emails[0].url

    @pytest.mark.asyncio
    async def test_resend_verification_nonexistent_email_safe_fallback(
        self,
        app: FastAPI,
        client: AsyncClient,
        monkeypatch,
    ) -> None:
        sent_emails = []

        def mock_send(self):
            sent_emails.append(self)
            return True

        monkeypatch.setattr(Email, "send", property(mock_send))

        res = await client.post(
            app.url_path_for("user:resend_academy_verification"),
            json={"email": "nonexistent.email@example.com"},
        )
        assert res.status_code == 200
        body = res.json()
        assert (
            body["message"]
            == "Verification link has been resent to your email address."
        )
        # Should not send any email to nonexistent users
        assert len(sent_emails) == 0

    @pytest.mark.asyncio
    async def test_resend_verification_already_active_user_safe_fallback(
        self,
        app: FastAPI,
        client: AsyncClient,
        auth_test_users,
        monkeypatch,
    ) -> None:
        sent_emails = []

        def mock_send(self):
            sent_emails.append(self)
            return True

        monkeypatch.setattr(Email, "send", property(mock_send))

        user = auth_test_users(
            email="already.active@example.com",
            is_active=1,
            tools=[ToolType.academy.value],
        )

        res = await client.post(
            app.url_path_for("user:resend_academy_verification"),
            json={"email": user.email},
        )
        assert res.status_code == 200
        assert len(sent_emails) == 0

import os
import sys
import pytest
from typing import Generator
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy import text
from sqlalchemy.orm import Session

from models.user import User, ToolType, UserType
from models.user_profile import UserProfile

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)


@pytest.fixture
def clean_academy_registration(session: Session) -> Generator:
    created_user_ids = []
    created_profile_ids = []

    def _track(user_id: int = None, profile_id: int = None):
        if user_id and user_id not in created_user_ids:
            created_user_ids.append(user_id)
        if profile_id and profile_id not in created_profile_ids:
            created_profile_ids.append(profile_id)

    yield _track

    # 1. Delete test profiles and users in reverse foreign key order
    for pid in reversed(created_profile_ids):
        p = session.query(UserProfile).filter(UserProfile.id == pid).first()
        if p:
            session.delete(p)
    for uid in reversed(created_user_ids):
        u = session.query(User).filter(User.id == uid).first()
        if u:
            # Also clean any profiles associated with this user
            profiles = (
                session.query(UserProfile)
                .filter(UserProfile.user_id == uid)
                .all()
            )
            for p in profiles:
                session.delete(p)
            session.delete(u)
    session.commit()

    # 2. Sequence Isolation: Reset PostgreSQL sequence counters
    session.execute(
        text(
            "SELECT setval('user_id_seq', "
            "(SELECT COALESCE(MAX(id), 1) FROM \"user\"))"
        )
    )
    session.execute(
        text(
            "SELECT setval('user_profile_id_seq', "
            "(SELECT COALESCE(MAX(id), 1) FROM user_profile))"
        )
    )
    session.commit()


class TestAcademyRegistration:
    @pytest.mark.asyncio
    async def test_register_academy_success(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        clean_academy_registration,
    ) -> None:
        payload = {
            "fullname": "Jane Doe",
            "email": "jane.doe.academy@example.com",
            "password": "StrongPassword123!",
            "company_name": "Sustainable Agriculture Co",
        }
        res = await client.post(
            app.url_path_for("user:register_academy"),
            json=payload,
        )
        assert res.status_code == 201
        data = res.json()
        assert "message" in data
        assert "Registration successful" in data["message"]

        # Verify database state
        user = (
            session.query(User)
            .filter(User.email == "jane.doe.academy@example.com")
            .first()
        )
        assert user is not None
        clean_academy_registration(user_id=user.id)
        assert user.fullname == "Jane Doe"
        assert user.is_active == 0
        assert user.tools == [ToolType.academy.value]
        assert user.user_type == UserType.external_regular
        assert user.invitation_id is not None
        assert len(user.invitation_id) == 64  # 32-byte hex string

        # Verify UserProfile
        profile = (
            session.query(UserProfile)
            .filter(UserProfile.user_id == user.id)
            .first()
        )
        assert profile is not None
        clean_academy_registration(profile_id=profile.id)
        assert profile.company_name == "Sustainable Agriculture Co"
        assert profile.first_name == "Jane"
        assert profile.last_name == "Doe"

    @pytest.mark.asyncio
    async def test_register_academy_duplicate_email(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        clean_academy_registration,
    ) -> None:
        payload = {
            "fullname": "Existing User",
            "email": "duplicate.academy@example.com",
            "password": "StrongPassword123!",
            "company_name": "Agri Tech",
        }
        # First registration
        res1 = await client.post(
            app.url_path_for("user:register_academy"),
            json=payload,
        )
        assert res1.status_code == 201
        user = (
            session.query(User)
            .filter(User.email == "duplicate.academy@example.com")
            .first()
        )
        clean_academy_registration(user_id=user.id)

        # Duplicate registration attempt with same email (case insensitive)
        payload["email"] = "DUPLICATE.ACADEMY@EXAMPLE.COM"
        res2 = await client.post(
            app.url_path_for("user:register_academy"),
            json=payload,
        )
        assert res2.status_code == 409
        assert "already exists" in res2.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_register_academy_password_complexity(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
    ) -> None:
        base_payload = {
            "fullname": "Weak Password User",
            "email": "weak.pwd@example.com",
            "company_name": "Weak Pwd Co",
        }

        # Case 1: Too short (< 8 chars)
        res = await client.post(
            app.url_path_for("user:register_academy"),
            json={**base_payload, "password": "Ab1!"},
        )
        assert res.status_code == 422
        assert "at least 8 characters" in str(res.json())

        # Case 2: Missing uppercase
        res = await client.post(
            app.url_path_for("user:register_academy"),
            json={**base_payload, "password": "password123!"},
        )
        assert res.status_code == 422
        assert "uppercase" in str(res.json())

        # Case 3: Missing lowercase
        res = await client.post(
            app.url_path_for("user:register_academy"),
            json={**base_payload, "password": "PASSWORD123!"},
        )
        assert res.status_code == 422
        assert "lowercase" in str(res.json())

        # Case 4: Missing digit
        res = await client.post(
            app.url_path_for("user:register_academy"),
            json={**base_payload, "password": "Password!!!!"},
        )
        assert res.status_code == 422
        assert "digit" in str(res.json())

        # Case 5: Missing special character
        res = await client.post(
            app.url_path_for("user:register_academy"),
            json={**base_payload, "password": "Password123"},
        )
        assert res.status_code == 422
        assert "special character" in str(res.json())

    @pytest.mark.asyncio
    async def test_register_academy_missing_required_fields(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
    ) -> None:
        # Missing fullname
        res = await client.post(
            app.url_path_for("user:register_academy"),
            json={
                "email": "test@example.com",
                "password": "Password123!",
                "company_name": "Test Co",
            },
        )
        assert res.status_code == 422

        # Empty fullname string
        res = await client.post(
            app.url_path_for("user:register_academy"),
            json={
                "fullname": "   ",
                "email": "test@example.com",
                "password": "Password123!",
                "company_name": "Test Co",
            },
        )
        assert res.status_code == 422

        # Missing company_name
        res = await client.post(
            app.url_path_for("user:register_academy"),
            json={
                "fullname": "Test User",
                "email": "test@example.com",
                "password": "Password123!",
            },
        )
        assert res.status_code == 422

        # Empty company_name string
        res = await client.post(
            app.url_path_for("user:register_academy"),
            json={
                "fullname": "Test User",
                "email": "test@example.com",
                "password": "Password123!",
                "company_name": "   ",
            },
        )
        assert res.status_code == 422

        # Company name exceeding 255 chars
        res = await client.post(
            app.url_path_for("user:register_academy"),
            json={
                "fullname": "Test User",
                "email": "test@example.com",
                "password": "Password123!",
                "company_name": "C" * 256,
            },
        )
        assert res.status_code == 422
        assert "cannot exceed 255 characters" in str(res.json())

    @pytest.mark.asyncio
    async def test_register_academy_email_sanitization(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        clean_academy_registration,
    ) -> None:
        payload = {
            "fullname": " Whitespace User ",
            "email": "  Whitespace.User@Example.COM  ",
            "password": "Password123!",
            "company_name": "  Sanitized Org  ",
        }
        res = await client.post(
            app.url_path_for("user:register_academy"),
            json=payload,
        )
        assert res.status_code == 201

        user = (
            session.query(User)
            .filter(User.email == "whitespace.user@example.com")
            .first()
        )
        assert user is not None
        clean_academy_registration(user_id=user.id)
        assert user.fullname == "Whitespace User"

        profile = (
            session.query(UserProfile)
            .filter(UserProfile.user_id == user.id)
            .first()
        )
        assert profile is not None
        clean_academy_registration(profile_id=profile.id)
        assert profile.company_name == "Sanitized Org"


class TestAcademyVerification:
    @pytest.mark.asyncio
    async def test_verify_academy_token_success_json(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        clean_academy_registration,
    ) -> None:
        # 1. Register a user
        payload = {
            "fullname": "Verify Test User",
            "email": "verify.test@example.com",
            "password": "Password123!",
            "company_name": "Verify Org",
        }
        reg_res = await client.post(
            app.url_path_for("user:register_academy"),
            json=payload,
        )
        assert reg_res.status_code == 201
        user = (
            session.query(User)
            .filter(User.email == "verify.test@example.com")
            .first()
        )
        clean_academy_registration(user_id=user.id)
        token = user.invitation_id
        assert user.is_active == 0

        # 2. Verify account via API (JSON response)
        ver_res = await client.get(
            app.url_path_for("user:verify_academy"),
            params={"token": token},
        )
        assert ver_res.status_code == 200
        ver_data = ver_res.json()
        assert ver_data["verified"] is True
        assert "verified successfully" in ver_data["message"]

        # 3. Assert DB state: is_active=1, invitation_id=None
        session.refresh(user)
        assert user.is_active == 1
        assert user.invitation_id is None

    @pytest.mark.asyncio
    async def test_verify_academy_token_success_redirect_html(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        clean_academy_registration,
    ) -> None:
        # 1. Register a user
        payload = {
            "fullname": "HTML Verify User",
            "email": "html.verify@example.com",
            "password": "Password123!",
            "company_name": "HTML Org",
        }
        reg_res = await client.post(
            app.url_path_for("user:register_academy"),
            json=payload,
        )
        assert reg_res.status_code == 201
        user = (
            session.query(User)
            .filter(User.email == "html.verify@example.com")
            .first()
        )
        clean_academy_registration(user_id=user.id)
        token = user.invitation_id

        # 2. Verify account with browser Accept: text/html header
        ver_res = await client.get(
            app.url_path_for("user:verify_academy"),
            params={"token": token},
            headers={"accept": "text/html,application/xhtml+xml"},
        )
        assert ver_res.status_code == 302
        assert "/login?verified=true" in ver_res.headers["location"]

        session.refresh(user)
        assert user.is_active == 1
        assert user.invitation_id is None

    @pytest.mark.asyncio
    async def test_verify_academy_replay_token_rejected(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        clean_academy_registration,
    ) -> None:
        payload = {
            "fullname": "Replay User",
            "email": "replay.token@example.com",
            "password": "Password123!",
            "company_name": "Replay Org",
        }
        await client.post(
            app.url_path_for("user:register_academy"),
            json=payload,
        )
        user = (
            session.query(User)
            .filter(User.email == "replay.token@example.com")
            .first()
        )
        clean_academy_registration(user_id=user.id)
        token = user.invitation_id

        # First verification succeeds
        res1 = await client.get(
            app.url_path_for("user:verify_academy"),
            params={"token": token},
        )
        assert res1.status_code == 200

        # Second verification (replay) must fail with 400 Bad Request
        res2 = await client.get(
            app.url_path_for("user:verify_academy"),
            params={"token": token},
        )
        assert res2.status_code == 400
        assert "Invalid or expired" in res2.json()["detail"]

    @pytest.mark.asyncio
    async def test_verify_academy_invalid_token(
        self,
        app: FastAPI,
        client: AsyncClient,
    ) -> None:
        res = await client.get(
            app.url_path_for("user:verify_academy"),
            params={"token": "nonexistent_token_1234567890"},
        )
        assert res.status_code == 400
        assert "Invalid or expired" in res.json()["detail"]

    @pytest.mark.asyncio
    async def test_verify_academy_missing_token_param(
        self,
        app: FastAPI,
        client: AsyncClient,
    ) -> None:
        res = await client.get(
            app.url_path_for("user:verify_academy"),
        )
        assert res.status_code == 422

    @pytest.mark.asyncio
    async def test_verify_academy_empty_or_whitespace_token(
        self,
        app: FastAPI,
        client: AsyncClient,
    ) -> None:
        # Empty string token
        res_empty = await client.get(
            app.url_path_for("user:verify_academy"),
            params={"token": ""},
        )
        assert res_empty.status_code == 400
        assert "Verification token is required" in res_empty.json()["detail"]

        # Whitespace only token
        res_spaces = await client.get(
            app.url_path_for("user:verify_academy"),
            params={"token": "   "},
        )
        assert res_spaces.status_code == 400
        assert "Verification token is required" in res_spaces.json()["detail"]

    @pytest.mark.asyncio
    async def test_verify_academy_trailing_whitespace_trimmed(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        clean_academy_registration,
    ) -> None:
        payload = {
            "fullname": "Trim Test User",
            "email": "trim.test@example.com",
            "password": "Password123!",
            "company_name": "Trim Org",
        }
        await client.post(
            app.url_path_for("user:register_academy"),
            json=payload,
        )
        user = (
            session.query(User)
            .filter(User.email == "trim.test@example.com")
            .first()
        )
        clean_academy_registration(user_id=user.id)
        raw_token = user.invitation_id

        # Verify token with surrounding whitespace
        res = await client.get(
            app.url_path_for("user:verify_academy"),
            params={"token": f"   {raw_token}   "},
        )
        assert res.status_code == 200
        session.refresh(user)
        assert user.is_active == 1
        assert user.invitation_id is None

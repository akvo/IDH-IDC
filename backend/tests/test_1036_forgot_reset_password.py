import pytest
from datetime import datetime, timedelta
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy import func
from sqlalchemy.orm import Session
from models.user import User, UserRole
from models.organisation import Organisation
from models.reset_password import ResetPassword, RESET_PASSWORD_EXPIRE_MINUTES
from utils.mailer import Email, EmailBody, MailTypeEnum
from middleware import get_password_hash, verify_password


def get_or_create_organisation(session: Session) -> Organisation:
    org = session.query(Organisation).first()
    if not org:
        org = Organisation(id=None, name="Test Organisation")
        session.add(org)
        session.commit()
        session.refresh(org)
    return org


class TestForgotResetPassword:
    @pytest.fixture(autouse=True)
    def setup_users(self, session: Session):
        org = get_or_create_organisation(session)
        active_email = "reset_test_user@idhtrade.org"
        user = session.query(User).filter(func.lower(User.email) == active_email).first()
        if not user:
            user = User(
                fullname="Reset Test User",
                email=active_email,
                password=get_password_hash("OldP@ssw0rd!"),
                role=UserRole.user,
                organisation=org.id,
                is_active=1,
                tools=["idc", "academy"],
            )
            session.add(user)
            session.commit()
            session.refresh(user)
        else:
            user.is_active = 1
            user.password = get_password_hash("OldP@ssw0rd!")
            session.commit()
        self.active_user = user

        inactive_email = "inactive_reset_user@idhtrade.org"
        in_user = session.query(User).filter(func.lower(User.email) == inactive_email).first()
        if not in_user:
            in_user = User(
                fullname="Inactive Reset User",
                email=inactive_email,
                password=get_password_hash("Inactive123!"),
                role=UserRole.user,
                organisation=org.id,
                is_active=0,
                tools=["academy"],
            )
            session.add(in_user)
            session.commit()
            session.refresh(in_user)
        else:
            in_user.is_active = 0
            session.commit()
        self.inactive_user = in_user

        yield

        # Teardown
        session.query(ResetPassword).filter(
            ResetPassword.user.in_([self.active_user.id, self.inactive_user.id])
        ).delete(synchronize_session=False)
        session.query(User).filter(
            User.id.in_([self.active_user.id, self.inactive_user.id])
        ).delete(synchronize_session=False)
        session.commit()

    @pytest.mark.asyncio
    async def test_forgot_password_anti_enumeration_unknown_email(
        self, app: FastAPI, client: AsyncClient, monkeypatch: pytest.MonkeyPatch
    ):
        """Unknown email returns uniform 200 OK without dispatching email or creating token."""
        sent_emails = []
        monkeypatch.setattr(
            Email, "send", property(lambda s: sent_emails.append(s) or True)
        )

        response = await client.post(
            app.url_path_for("user:forgot-password"),
            data={"email": "nonexistent_person_12345@example.com"},
        )
        assert response.status_code == 200
        data = response.json()
        assert (
            "sent" in data.get("message", "").lower()
            or "registered" in data.get("message", "").lower()
        )
        assert len(sent_emails) == 0

    @pytest.mark.asyncio
    async def test_forgot_password_anti_enumeration_inactive_user(
        self, app: FastAPI, client: AsyncClient, monkeypatch: pytest.MonkeyPatch
    ):
        """Inactive user returns uniform 200 OK without dispatching email."""
        sent_emails = []
        monkeypatch.setattr(
            Email, "send", property(lambda s: sent_emails.append(s) or True)
        )

        response = await client.post(
            app.url_path_for("user:forgot-password"),
            data={"email": self.inactive_user.email},
        )
        assert response.status_code == 200
        assert len(sent_emails) == 0

    @pytest.mark.asyncio
    async def test_forgot_password_active_user_case_insensitive(
        self, app: FastAPI, session: Session, client: AsyncClient, monkeypatch: pytest.MonkeyPatch
    ):
        """Active user with mixed-case email returns 200 OK, creates token, and dispatches email."""
        sent_emails = []
        monkeypatch.setattr(
            Email, "send", property(lambda s: sent_emails.append(s) or True)
        )

        mixed_email = "ReSet_Test_User@IdhTrade.Org"
        response = await client.post(
            app.url_path_for("user:forgot-password"),
            data={"email": mixed_email},
        )
        assert response.status_code == 200
        assert len(sent_emails) == 1
        assert sent_emails[0].email == EmailBody.FORGOT_PASSWORD

        reset_row = (
            session.query(ResetPassword)
            .filter(ResetPassword.user == self.active_user.id)
            .first()
        )
        assert reset_row is not None
        assert len(reset_row.url) >= 32
        time_diff = reset_row.valid - datetime.utcnow()
        assert 28 <= time_diff.total_seconds() / 60 <= 31

    @pytest.mark.asyncio
    async def test_forgot_password_repeat_request_centralized_30m_ttl(
        self, app: FastAPI, session: Session, client: AsyncClient, monkeypatch: pytest.MonkeyPatch
    ):
        """Repeat forgot-password request maintains centralized 30-minute TTL."""
        monkeypatch.setattr(Email, "send", property(lambda s: True))

        await client.post(
            app.url_path_for("user:forgot-password"),
            data={"email": self.active_user.email},
        )
        first_row = (
            session.query(ResetPassword)
            .filter(ResetPassword.user == self.active_user.id)
            .first()
        )
        assert first_row is not None
        first_token = first_row.url

        # Repeat request
        await client.post(
            app.url_path_for("user:forgot-password"),
            data={"email": self.active_user.email},
        )
        session.refresh(first_row)
        second_token = first_row.url

        assert first_token != second_token
        time_diff = first_row.valid - datetime.utcnow()
        assert 28 <= time_diff.total_seconds() / 60 <= 31
        assert RESET_PASSWORD_EXPIRE_MINUTES == 30

    @pytest.mark.asyncio
    async def test_get_reset_password_status(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        """GET /user/reset-password/{token} returns 200 for valid token, 410 for expired, 404 for invalid."""
        valid_reset = ResetPassword(user=self.active_user.id)
        session.add(valid_reset)
        session.commit()
        session.refresh(valid_reset)

        resp_valid = await client.get(
            app.url_path_for("user:reset-password", url=valid_reset.url)
        )
        assert resp_valid.status_code == 200

        # Expired token
        valid_reset.valid = datetime.utcnow() - timedelta(minutes=5)
        session.commit()
        resp_expired = await client.get(
            app.url_path_for("user:reset-password", url=valid_reset.url)
        )
        assert resp_expired.status_code == 410

        # Invalid token
        resp_invalid = await client.get(
            app.url_path_for("user:reset-password", url="totally-nonexistent-token-1234")
        )
        assert resp_invalid.status_code == 404

    @pytest.mark.asyncio
    async def test_post_reset_password_rejects_weak_password(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        """POST /user/reset-password/{token} rejects password that does not satisfy 5 rules."""
        reset = ResetPassword(user=self.active_user.id)
        session.add(reset)
        session.commit()
        session.refresh(reset)

        resp = await client.post(
            app.url_path_for("user:reset-password", url=reset.url),
            data={"password": "weak"},
        )
        assert resp.status_code == 400
        assert "PASSWORD_RULES_NOT_MET" in str(resp.json())

    @pytest.mark.asyncio
    async def test_post_reset_password_success_and_replay_protection(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        """POST /user/reset-password/{token} updates password, deletes token atomically, and prevents replay."""
        reset = ResetPassword(user=self.active_user.id)
        session.add(reset)
        session.commit()
        session.refresh(reset)
        token = reset.url

        new_strong_pass = "Br@ndNewStro0ngP@ss2026!"
        resp = await client.post(
            app.url_path_for("user:reset-password", url=token),
            data={"password": new_strong_pass},
        )
        assert resp.status_code == 200

        session.refresh(self.active_user)
        assert verify_password(new_strong_pass, self.active_user.password)

        # Verify reset token was deleted
        deleted_token = (
            session.query(ResetPassword).filter(ResetPassword.url == token).first()
        )
        assert deleted_token is None

        # Replay attempt fails with 404
        resp_replay = await client.post(
            app.url_path_for("user:reset-password", url=token),
            data={"password": new_strong_pass},
        )
        assert resp_replay.status_code == 404

    def test_forgot_password_email_template_rendering(self):
        """Verify that FORGOT_PASSWORD email template renders the styled button and 30m disclaimer."""
        email_obj = Email(
            recipients=[{"Email": "test@example.com", "Name": "Test User"}],
            email=MailTypeEnum.FORGOT_PASSWORD,
            url="http://localhost:3000/reset-password/sample-token-123",
        )
        msg = email_obj.data
        html_content = ""
        for part in msg.iter_parts():
            if part.get_content_type() == "text/html":
                html_content = part.get_content()
                break
        assert "Reset your Better Income Toolkit password" in msg["Subject"]
        assert "Set a new password" in html_content
        assert "#61cf86" in html_content.lower() or "#01625f" in html_content.lower()
        assert "30 minutes" in html_content

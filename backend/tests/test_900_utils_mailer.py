import sys
import pytest
from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi import FastAPI
from httpx import AsyncClient

from tests.test_000_main import Acc
from db.crud_user import get_user_by_email
from db import crud_reset_password as crud_reset_pwd
from models.user import User, UserRole
from models.organisation import Organisation
from models.reset_password import ResetPassword
from middleware import get_password_hash
from utils.mailer import (
    Email,
    MailTypeEnum,
    env_flag,
)

pytestmark = pytest.mark.asyncio
sys.path.append("..")

account = Acc(email="super_admin@akvo.org", token=None)


def get_or_create_organisation(session: Session) -> Organisation:
    org = session.query(Organisation).first()
    if not org:
        org = Organisation(id=1, name="Akvo")
        session.add(org)
        session.commit()
        session.refresh(org)
    return org


def get_or_create_test_user(session: Session) -> User:
    org = get_or_create_organisation(session=session)
    user = get_user_by_email(session=session, email=account.data["email"])
    if not user:
        user = User(
            organisation=org.id,
            fullname="John Doe",
            email=account.data["email"],
            role=UserRole.super_admin,
            is_active=1,
        )
        session.add(user)
        session.commit()
        session.refresh(user)
    return user


class TestMailer:
    @pytest.mark.asyncio
    async def test_email_recipient(self, session: Session) -> None:
        user = get_or_create_test_user(session=session)
        user_recipient = user.recipient
        assert user_recipient == {
            "Email": "super_admin@akvo.org",
            "Name": "John Doe",
        }

    @pytest.mark.asyncio
    async def test_email_data(
        self, session: Session, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setattr("utils.mailer.EMAIL_FROM", "")
        monkeypatch.setattr("utils.mailer.EMAIL_HOST_USER", "")
        user = get_or_create_test_user(session=session)
        email = Email(
            recipients=[user.recipient],
            email=MailTypeEnum.REG_NEW,
        )
        data = email.data
        assert data["To"] == "John Doe <super_admin@akvo.org>"
        assert data["From"] == "noreply@akvo.org"
        assert data["Subject"] == "Registration"
        # The message carries a plain-text body with the rendered template
        # attached as an HTML alternative.
        subtypes = [part.get_content_subtype() for part in data.iter_parts()]
        assert subtypes == ["plain", "html"]

    @pytest.mark.asyncio
    async def test_email_invitation(
        self, session: Session, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setattr("utils.mailer.EMAIL_FROM", "")
        monkeypatch.setattr("utils.mailer.EMAIL_HOST_USER", "")
        user = get_or_create_test_user(session=session)
        email = Email(
            recipients=[user.recipient],
            email=MailTypeEnum.INVITATION,
            url="url",
        )
        data = email.data
        assert data["To"] == "John Doe <super_admin@akvo.org>"
        assert data["From"] == "noreply@akvo.org"
        assert data["Subject"] == "Invitation"

    @pytest.mark.asyncio
    async def test_email_forgot_password_toolkit_branding(
        self, session: Session, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setattr("utils.mailer.EMAIL_FROM", "")
        monkeypatch.setattr("utils.mailer.EMAIL_HOST_USER", "")
        user = get_or_create_test_user(session=session)
        email = Email(
            recipients=[user.recipient],
            email=MailTypeEnum.FORGOT_PASSWORD,
            url="https://example.com/reset-password/sample-uuid-token",
        )
        data = email.data
        assert data["Subject"] == "Better Income Toolkit: Reset Your Password"
        html_part = next(
            part.get_content()
            for part in data.iter_parts()
            if part.get_content_subtype() == "html"
        )
        assert "Better Income Toolkit" in html_part
        assert "Income Drive Calculator" not in html_part

    @pytest.mark.asyncio
    async def test_email_invitation_toolkit_branding(
        self, session: Session, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setattr("utils.mailer.EMAIL_FROM", "")
        monkeypatch.setattr("utils.mailer.EMAIL_HOST_USER", "")
        user = get_or_create_test_user(session=session)
        email = Email(
            recipients=[user.recipient],
            email=MailTypeEnum.INVITATION,
            url="https://example.com/invitation/sample-uuid-token",
        )
        data = email.data
        assert data["Subject"] == "Invitation"
        html_part = next(
            part.get_content()
            for part in data.iter_parts()
            if part.get_content_subtype() == "html"
        )
        plain_part = next(
            part.get_content()
            for part in data.iter_parts()
            if part.get_content_subtype() == "plain"
        )
        assert "Better Income Toolkit" in html_part
        assert "Living Income Academy" in html_part
        assert "Better Income Toolkit" in plain_part
        assert "Living Income Academy" in plain_part

    @pytest.mark.asyncio
    async def test_email_idc_access_granted_toolkit_branding(
        self, session: Session, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setattr("utils.mailer.EMAIL_FROM", "")
        monkeypatch.setattr("utils.mailer.EMAIL_HOST_USER", "")
        user = get_or_create_test_user(session=session)
        email = Email(
            recipients=[user.recipient],
            email=MailTypeEnum.IDC_ACCESS_GRANTED,
            body=(
                "An administrator has granted you access to the "
                "Income Driver Calculator under Acme Corp."
            ),
        )
        data = email.data
        assert data["Subject"] == "Income Driver Calculator Access Granted"
        html_part = next(
            part.get_content()
            for part in data.iter_parts()
            if part.get_content_subtype() == "html"
        )
        assert "Better Income Toolkit" in html_part

    async def test_smtp_tls_defaults(self) -> None:
        assert env_flag("TEST_NON_EXISTENT_TLS", "true") is True
        assert env_flag("TEST_NON_EXISTENT_SSL", "false") is False

    async def test_smtp_port_ssl_inference(self) -> None:
        port_465 = 465
        tls_465 = env_flag(
            "TEST_UNSET_VAR", "false" if port_465 == 465 else "true"
        )
        ssl_465 = env_flag(
            "TEST_UNSET_VAR", "true" if port_465 == 465 else "false"
        )
        assert tls_465 is False
        assert ssl_465 is True

        port_587 = 587
        tls_587 = env_flag(
            "TEST_UNSET_VAR", "false" if port_587 == 465 else "true"
        )
        ssl_587 = env_flag(
            "TEST_UNSET_VAR", "true" if port_587 == 465 else "false"
        )
        assert tls_587 is True
        assert ssl_587 is False


class TestPasswordResetGuards:
    @pytest.fixture(autouse=True)
    def clean_reset_guard_users(self, session: Session):
        test_emails = [
            "active_reset_guard@example.com",
            "inactive_reset_guard@example.com",
            "active_post_reset@example.com",
            "inactive_post_reset@example.com",
        ]

        def _cleanup():
            try:
                session.rollback()
                users = (
                    session.query(User)
                    .filter(User.email.in_(test_emails))
                    .all()
                )
                for u in users:
                    session.query(ResetPassword).filter(
                        ResetPassword.user == u.id
                    ).delete()
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
                        "SELECT setval('reset_password_id_seq', "
                        "(SELECT COALESCE(MAX(id), 1) FROM reset_password))"
                    )
                )
                session.commit()
            except Exception:
                session.rollback()

        _cleanup()
        yield
        _cleanup()

    @pytest.mark.asyncio
    async def test_forgot_password_active_user_uses_origin_header(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        org = get_or_create_organisation(session=session)
        email = "active_reset_guard@example.com"
        user = User(
            organisation=org.id,
            fullname="Active Guard User",
            email=email,
            role=UserRole.user,
            password=get_password_hash("StrongPass123!"),
            is_active=1,
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        captured_urls = []
        orig_init = Email.__init__

        def fake_init(self, *args, **kwargs):
            orig_init(self, *args, **kwargs)
            captured_urls.append(self.url)

        monkeypatch.setattr(Email, "__init__", fake_init)
        monkeypatch.setattr(Email, "send", property(lambda self: True))

        trusted_origin = "http://localhost:3000"
        res = await client.post(
            app.url_path_for("user:forgot-password"),
            data={"email": email},
            headers={"Origin": trusted_origin},
        )
        assert res.status_code == 201
        data = res.json()
        assert data.get("message") == "url is generated"
        assert len(captured_urls) == 1
        assert captured_urls[0] is not None
        assert captured_urls[0].startswith(
            f"{trusted_origin}/reset-password/"
        )

        # Untrusted origin should be rejected and fall back to webdomain
        captured_urls.clear()
        untrusted_origin = "https://evil.example.com"
        res_untrusted = await client.post(
            app.url_path_for("user:forgot-password"),
            data={"email": email},
            headers={"Origin": untrusted_origin},
        )
        assert res_untrusted.status_code == 201
        assert len(captured_urls) == 1
        assert not captured_urls[0].startswith(untrusted_origin)
        assert "/reset-password/" in captured_urls[0]

    @pytest.mark.asyncio
    async def test_forgot_password_inactive_user_returns_400(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
    ) -> None:
        org = get_or_create_organisation(session=session)
        email = "inactive_reset_guard@example.com"
        user = User(
            organisation=org.id,
            fullname="Inactive Guard User",
            email=email,
            role=UserRole.user,
            password=get_password_hash("StrongPass123!"),
            is_active=0,
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        res = await client.post(
            app.url_path_for("user:forgot-password"),
            data={"email": email},
        )
        assert res.status_code == 400
        detail = res.json().get("detail", "")
        assert "inactive or unverified" in detail.lower()

    @pytest.mark.asyncio
    async def test_reset_password_active_user_returns_200(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
    ) -> None:
        org = get_or_create_organisation(session=session)
        email = "active_post_reset@example.com"
        user = User(
            organisation=org.id,
            fullname="Active Post User",
            email=email,
            role=UserRole.user,
            password=get_password_hash("OldPassword123!"),
            is_active=1,
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        reset_record = crud_reset_pwd.new_reset_password(
            session=session, email=email
        )
        assert reset_record is not None
        reset_url = reset_record["url"]

        res = await client.post(
            app.url_path_for("user:reset-password", url=reset_url),
            data={"password": "NewStrongPassword1!"},
        )
        assert res.status_code == 200
        data = res.json()
        assert "access_token" in data
        assert data.get("token_type") == "bearer"
        assert data.get("user", {}).get("email") == email

        # Verify used token is purged
        assert crud_reset_pwd.get_reset_password(
            session=session, url=reset_url
        ) is None

    @pytest.mark.asyncio
    async def test_reset_password_inactive_user_returns_400(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
    ) -> None:
        org = get_or_create_organisation(session=session)
        email = "inactive_post_reset@example.com"
        user = User(
            organisation=org.id,
            fullname="Inactive Post User",
            email=email,
            role=UserRole.user,
            password=get_password_hash("OldPassword123!"),
            is_active=0,
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        # Directly provision a ResetPassword token for the inactive user
        rp = ResetPassword(user=user.id)
        session.add(rp)
        session.commit()
        session.refresh(rp)

        res = await client.post(
            app.url_path_for("user:reset-password", url=rp.url),
            data={"password": "NewStrongPassword1!"},
        )
        assert res.status_code == 400
        detail = res.json().get("detail", "")
        assert "inactive or unverified" in detail.lower()

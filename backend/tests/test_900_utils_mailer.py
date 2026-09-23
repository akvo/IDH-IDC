import sys
import pytest
from tests.test_000_main import Acc
from sqlalchemy.orm import Session
from db.crud_user import get_user_by_email
from models.user import User, UserRole
from utils.mailer import (
    Email,
    MailTypeEnum,
    env_flag,
)

pytestmark = pytest.mark.asyncio
sys.path.append("..")

account = Acc(email="super_admin@akvo.org", token=None)


def get_or_create_test_user(session: Session) -> User:
    user = get_user_by_email(session=session, email=account.data["email"])
    if not user:
        user = User(
            organisation=1,
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

    async def test_smtp_tls_defaults(self) -> None:
        assert env_flag("TEST_NON_EXISTENT_TLS", "true") is True
        assert env_flag("TEST_NON_EXISTENT_SSL", "false") is False

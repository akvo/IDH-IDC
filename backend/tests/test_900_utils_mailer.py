import sys
import pytest
from tests.test_000_main import Acc
from sqlalchemy.orm import Session
from db.crud_user import get_user_by_email
from utils.mailer import (
    Email,
    MailTypeEnum,
    EMAIL_USE_TLS,
    EMAIL_USE_SSL,
)

pytestmark = pytest.mark.asyncio
sys.path.append("..")

account = Acc(email="super_admin@akvo.org", token=None)


class TestMailer:
    @pytest.mark.asyncio
    async def test_email_recipient(self, session: Session) -> None:
        user = get_user_by_email(session=session, email=account.data["email"])
        user = user.recipient
        assert user == {"Email": "super_admin@akvo.org", "Name": "John Doe"}

    @pytest.mark.asyncio
    async def test_email_data(self, session: Session) -> None:
        user = get_user_by_email(session=session, email=account.data["email"])
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
    async def test_email_invitation(self, session: Session) -> None:
        user = get_user_by_email(session=session, email=account.data["email"])
        email = Email(
            recipients=[user.recipient],
            email=MailTypeEnum.INVITATION,
            url="url"
        )
        data = email.data
        assert data["To"] == "John Doe <super_admin@akvo.org>"
        assert data["From"] == "noreply@akvo.org"
        assert data["Subject"] == "Invitation"

    async def test_smtp_tls_defaults(self) -> None:
        assert EMAIL_USE_TLS is True
        assert EMAIL_USE_SSL is False

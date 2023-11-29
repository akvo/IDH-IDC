import sys
import pytest
from tests.test_000_main import Acc
from sqlalchemy.orm import Session
from db.crud_user import get_user_by_email
from utils.mailer import Email, MailTypeEnum

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
        assert data["Recipients"] == [
            {"Email": "super_admin@akvo.org", "Name": "John Doe"}
        ]
        assert data["FromEmail"] == "noreply@akvo.org"
        assert data["Subject"] == "Registration"
        # assert email.send is True

    @pytest.mark.asyncio
    async def test_email_invitation(self, session: Session) -> None:
        user = get_user_by_email(session=session, email=account.data["email"])
        email = Email(
            recipients=[user.recipient],
            email=MailTypeEnum.INVITATION,
            url="url"
        )
        data = email.data
        assert data["Recipients"] == [
            {"Email": "super_admin@akvo.org", "Name": "John Doe"}
        ]
        assert data["FromEmail"] == "noreply@akvo.org"
        assert data["Subject"] == "Invitation"

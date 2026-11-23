import sys
import pytest
from utils.mailer import Email, MailTypeEnum, html_to_text
from models.user import EmailRecipient

pytestmark = pytest.mark.asyncio
sys.path.append("..")


class TestEmailTemplates:
    @pytest.fixture
    def sample_recipient(self) -> EmailRecipient:
        return {"Name": "Amelia Earhart", "Email": "amelia@example.com"}

    def test_invitation_template_rendering(
        self, sample_recipient: EmailRecipient
    ) -> None:
        url = "https://toolkit.idhtrade.org/invitation/abc-123"
        email = Email(
            recipients=[sample_recipient],
            email=MailTypeEnum.INVITATION,
            url=url,
            name="Amelia",
        )
        msg = email.data
        assert msg["Subject"] == "Invitation to the Income Driver Calculator" or "Invitation" in msg["Subject"]
        assert msg["To"] == "Amelia Earhart <amelia@example.com>"

        html_part = next(
            part.get_content()
            for part in msg.iter_parts()
            if part.get_content_subtype() == "html"
        )
        plain_part = next(
            part.get_content()
            for part in msg.iter_parts()
            if part.get_content_subtype() == "plain"
        )

        # Header check
        assert "email-logo.png" in html_part
        assert "Toolkit Towards Better Incomes" in html_part

        # Hero illustration
        assert "email-invitation-screen.png" in html_part

        # Content check
        assert "Invitation" in html_part
        assert "Income Driver Calculator" in html_part
        assert url in html_part
        assert url in plain_part

        # CTA Button
        assert "Log in" in html_part or "Set your password" in html_part or "Income Driver Calculator" in html_part

        # Footer check
        assert "IDH" in html_part
        assert "social-facebook" in html_part
        assert "social-linkedin" in html_part

    def test_forgot_password_template_rendering(
        self, sample_recipient: EmailRecipient
    ) -> None:
        url = "https://toolkit.idhtrade.org/reset-password/token-xyz"
        email = Email(
            recipients=[sample_recipient],
            email=MailTypeEnum.FORGOT_PASSWORD,
            url=url,
            name="Amelia",
            period="30 minutes",
        )
        msg = email.data
        assert msg["Subject"] == "Reset your Better Income Toolkit password"

        html_part = next(
            part.get_content()
            for part in msg.iter_parts()
            if part.get_content_subtype() == "html"
        )
        plain_part = next(
            part.get_content()
            for part in msg.iter_parts()
            if part.get_content_subtype() == "plain"
        )

        # Hero illustration
        assert "email-password-reset.png" in html_part

        # Content check
        assert "Password reset" in html_part
        assert "Set a new password" in html_part
        assert "30 minutes" in html_part
        assert url in html_part
        assert "Set a new password" in plain_part

    def test_idc_access_granted_template_rendering(
        self, sample_recipient: EmailRecipient
    ) -> None:
        url = "https://toolkit.idhtrade.org/income-driver-calculator"
        email = Email(
            recipients=[sample_recipient],
            email=MailTypeEnum.IDC_ACCESS_GRANTED,
            url=url,
            name="Amelia",
            company_name="Fair Trade Cocoa Ltd",
        )
        msg = email.data
        assert "Access" in msg["Subject"]

        html_part = next(
            part.get_content()
            for part in msg.iter_parts()
            if part.get_content_subtype() == "html"
        )
        plain_part = next(
            part.get_content()
            for part in msg.iter_parts()
            if part.get_content_subtype() == "plain"
        )

        # Hero illustration
        assert "email-invitation-screen.png" in html_part or "email-idc-access-granted.png" in html_part

        # Content check
        assert "Fair Trade Cocoa Ltd" in html_part
        assert "Amelia" in html_part
        assert "Explore the Income Driver Calculator" in html_part
        assert "Fair Trade Cocoa Ltd" in plain_part

    def test_academy_verify_template_rendering(
        self, sample_recipient: EmailRecipient
    ) -> None:
        url = "https://toolkit.idhtrade.org/verify-academy?token=acad-456"
        email = Email(
            recipients=[sample_recipient],
            email=MailTypeEnum.ACADEMY_VERIFY,
            url=url,
            name="Amelia",
        )
        msg = email.data
        assert "Verify" in msg["Subject"] or "Confirm" in msg["Subject"]

        html_part = next(
            part.get_content()
            for part in msg.iter_parts()
            if part.get_content_subtype() == "html"
        )
        plain_part = next(
            part.get_content()
            for part in msg.iter_parts()
            if part.get_content_subtype() == "plain"
        )

        # Hero illustration
        assert "email-verified-shield.png" in html_part

        # Content check
        assert "Confirm" in html_part or "Verify" in html_part
        assert "Living Income Academy" in html_part
        assert "Didn’t sign up? You can ignore this email." in html_part
        assert url in html_part
        assert url in plain_part

    def test_plain_text_conversion(self) -> None:
        sample_html = """
        <html>
            <body>
                <h1>Hello Amelia</h1>
                <p>Welcome to Better Income Toolkit</p>
                <a href="https://example.com/test">Click Here</a>
            </body>
        </html>
        """
        text = html_to_text(sample_html)
        assert "Hello Amelia" in text
        assert "Welcome to Better Income Toolkit" in text

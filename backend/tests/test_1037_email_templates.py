import sys
import pytest
from httpx import AsyncClient
from utils.mailer import Email, MailTypeEnum, html_to_text, get_asset_src, image_url
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

    def test_asset_src_returns_public_url(self) -> None:
        src = get_asset_src("email-logo.png")
        assert src == f"{image_url}/email-logo.png"
        assert not src.startswith("data:")
        assert src.startswith("http://") or src.startswith("https://")

    def test_asset_src_maps_svg_to_png(self) -> None:
        src = get_asset_src("social-facebook.svg")
        assert src == f"{image_url}/social-facebook.png"
        assert ".svg" not in src
        assert not src.startswith("data:")

    def test_templates_use_only_png_and_no_data_uris(
        self, sample_recipient: EmailRecipient
    ) -> None:
        templates = [
            (MailTypeEnum.INVITATION, {"url": "https://example.com/invite"}),
            (MailTypeEnum.FORGOT_PASSWORD, {"url": "https://example.com/reset"}),
            (MailTypeEnum.ACADEMY_VERIFY, {"url": "https://example.com/verify"}),
            (MailTypeEnum.IDC_ACCESS_GRANTED, {"url": "https://example.com/idc"}),
        ]
        for mail_type, kwargs in templates:
            email = Email(recipients=[sample_recipient], email=mail_type, **kwargs)
            msg = email.data
            html_part = next(
                part.get_content()
                for part in msg.iter_parts()
                if part.get_content_subtype() == "html"
            )
            # Universal deliverability assertions:
            # 1. Zero data: URIs (Gmail proxy blocks base64 embedded images)
            assert "data:image" not in html_part, f"Found data:image in {mail_type.value}"
            # 2. Zero .svg images (Webmail clients block SVG for security)
            assert ".svg" not in html_part, f"Found .svg in {mail_type.value}"
            # 3. Social icons rendered as .png
            assert "social-facebook.png" in html_part
            assert "social-linkedin.png" in html_part
            assert "social-instagram.png" in html_part
            assert "social-x.png" in html_part
            # 4. Logo rendered as hosted URL
            assert f"{image_url}/email-logo.png" in html_part

    @pytest.mark.asyncio
    async def test_email_icons_static_endpoint(self, client: AsyncClient) -> None:
        response = await client.get("/email-icons/email-logo.png")
        assert response.status_code == 200
        assert "image/png" in response.headers["content-type"]
        assert len(response.content) > 0

        # Also test social icon png
        social_res = await client.get("/email-icons/social-facebook.png")
        assert social_res.status_code == 200
        assert "image/png" in social_res.headers["content-type"]

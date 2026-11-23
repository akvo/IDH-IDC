import os
import enum
import base64
import smtplib
from email.message import EmailMessage
from email.utils import formataddr
from typing import List, Optional
from bs4 import BeautifulSoup
from models.user import EmailRecipient
from jinja2 import Environment, FileSystemLoader

webdomain = os.environ.get("WEBDOMAIN", "localhost:3000")
if webdomain == "idc.akvo.org":
    webdomain = "incomedrivercalculator.idhtrade.org"
if "https://" not in webdomain and "http://" not in webdomain:
    webdomain = f"https://{webdomain}"

loader = FileSystemLoader(".")
env = Environment(loader=loader)
html_template = env.get_template("./templates/email.html")
image_url = f"{webdomain}/email-icons"


# =========================================================
# SMTP Relay Configuration
# =========================================================

def env_flag(name: str, default: str) -> bool:
    value = os.environ.get(name, default)
    return value.strip().lower() in ("1", "true", "yes")


EMAIL_HOST = os.environ.get("EMAIL_HOST", "localhost")
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", "587"))
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = env_flag(
    "EMAIL_USE_TLS", "false" if EMAIL_PORT in (465, 1025) else "true"
)
EMAIL_USE_SSL = env_flag(
    "EMAIL_USE_SSL", "true" if EMAIL_PORT == 465 else "false"
)
EMAIL_FROM = os.environ.get("EMAIL_FROM", "")
EMAIL_TIMEOUT = 10


def get_asset_src(filename: str) -> str:
    """
    Returns an embedded base64 data URI if the local icon exists,
    otherwise falls back to the hosted URL under image_url.
    """
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    candidates = [
        os.path.join(base_dir, "assets", "email-icons", filename),
        os.path.join("assets", "email-icons", filename),
        os.path.join("..", "frontend", "public", "email-icons", filename),
    ]
    for path in candidates:
        if os.path.isfile(path):
            try:
                with open(path, "rb") as f:
                    encoded = base64.b64encode(f.read()).decode("ascii")
                ext = filename.split(".")[-1].lower()
                mime = "image/svg+xml" if ext == "svg" else f"image/{ext}"
                return f"data:{mime};base64,{encoded}"
            except Exception:
                pass
    return f"{image_url}/{filename}"


class EmailBody(enum.Enum):
    USER_REGISTRATION_NEW = {
        "title": "New Account Registration",
        "subject": "Action Required: New User Registration Pending Approval",
        "subtitle": "A new user account is awaiting your approval.",
        "body": (
            "A new user has submitted a registration request for the "
            "Better Income Toolkit. Please sign in to the administration portal "
            "to review their details and grant access."
        ),
        "message": None,
        "image": "email-invitation-screen.png",
        "button_text": "Review in Admin Portal",
        "button_color": "#3f98f7",
        "show_plain_url": False,
        "disclaimer": (
            "You are receiving this notification because you have administrative "
            "privileges for the Better Income Toolkit."
        ),
    }
    USER_REGISTRATION_APPROVED = {
        "title": "Account Approved",
        "subject": "Your Better Income Toolkit Account Has Been Approved",
        "subtitle": "Welcome! Your account has been reviewed and activated.",
        "body": (
            "You now have full access to the Better Income Toolkit. "
            "Click below to sign in and start exploring."
        ),
        "message": None,
        "image": "email-verified-shield.png",
        "button_text": "Log in to Better Income Toolkit",
        "button_color": "#3f98f7",
        "show_plain_url": False,
        "disclaimer": None,
    }
    USER_PASSWORD_CREATED = {
        "title": "Access Changed",
        "subject": "User Access",
        "subtitle": None,
        "body": "Your access have been updated.",
        "message": None,
        "image": "email-password-reset.png",
        "button_text": None,
        "button_color": "#61cf86",
        "show_plain_url": False,
        "disclaimer": None,
    }
    FORGOT_PASSWORD = {
        "title": "Password reset",
        "subject": "Reset your Better Income Toolkit password",
        "subtitle": (
            "We received a request to reset the password of your Better Income "
            "Toolkit account. Click the button to set a new password."
        ),
        "body": None,
        "message": None,
        "image": "email-password-reset.png",
        "button_text": "Set a new password",
        "button_color": "#61cf86",
        "show_plain_url": False,
        "disclaimer": (
            "The link is valid for {period}. Didn’t ask for this? "
            "You can ignore this email; your password stays the same."
        ),
    }
    INVITATION = {
        "title": "Invitation",
        "subject": "Invitation",
        "subtitle": "You have been invited to the Income Driver Calculator",
        "body": (
            "You have been invited to the Better Income Toolkit "
            "(with access to the Income Driver Calculator and "
            "Living Income Academy). Please click here or the link below to set your password."
        ),
        "message": None,
        "image": "email-invitation-screen.png",
        "button_text": "Income Drive Calculator",
        "button_color": "#3f98f7",
        "show_plain_url": True,
        "disclaimer": None,
    }
    ACADEMY_REGISTRATION_VERIFY = {
        "title": "Confirm your email",
        "subject": "Confirm your email for the Living Income Academy",
        "subtitle": (
            "Hi {name}, welcome to the Living Income Academy. "
            "Please confirm your email address to activate your account."
        ),
        "body": None,
        "message": None,
        "image": "email-verified-shield.png",
        "button_text": "Confirm email",
        "button_color": "#3f98f7",
        "show_plain_url": True,
        "disclaimer": "Didn’t sign up? You can ignore this email.",
    }
    IDC_ACCESS_GRANTED = {
        "title": "Invitation",
        "subject": "Income Driver Calculator Access Granted",
        "subtitle": (
            "Hi {name}, IDH gave you access to the Income Driver Calculator "
            "for {company_name}"
        ),
        "body": (
            "You don’t need a new account: log in with your current email "
            "address and password."
        ),
        "message": None,
        "image": "email-invitation-screen.png",
        "button_text": "Explore the Income Driver Calculator",
        "button_color": "#3f98f7",
        "show_plain_url": False,
        "disclaimer": None,
    }


def format_recipients(recipients: List[EmailRecipient]) -> str:
    return ", ".join(formataddr((r["Name"], r["Email"])) for r in recipients)


def generate_icon(icon: str, color: Optional[str] = None):
    svg_path = f"./templates/icons/{icon}.svg"
    try:
        with open(svg_path, "r", encoding="utf-8") as svg_icon:
            soup = BeautifulSoup(svg_icon, "lxml")
        if color:
            for spath in soup.findAll("path"):
                spath["style"] = f"fill: {color};"
        return soup
    except (OSError, IOError):
        return None


def html_to_text(html: str) -> str:
    soup = BeautifulSoup(html, "lxml")
    body = soup.find("body")
    if not body:
        return ""
    return "".join(body.get_text())


class MailTypeEnum(enum.Enum):
    REG_NEW = "USER_REGISTRATION_NEW"
    REG_APPROVED = "USER_REGISTRATION_APPROVED"
    REG_PASSWORD_CREATED = "USER_PASSWORD_CREATED"
    FORGOT_PASSWORD = "FORGOT_PASSWORD"
    INVITATION = "INVITATION"
    ACADEMY_VERIFY = "ACADEMY_REGISTRATION_VERIFY"
    IDC_ACCESS_GRANTED = "IDC_ACCESS_GRANTED"


class Email:
    def __init__(
        self,
        recipients: List[EmailRecipient],
        email: MailTypeEnum,
        bcc: Optional[List[EmailRecipient]] = None,
        context: Optional[str] = None,
        body: Optional[str] = None,
        url: Optional[str] = None,
        name: Optional[str] = None,
        company_name: Optional[str] = None,
        period: Optional[str] = None,
        button_text: Optional[str] = None,
        button_url: Optional[str] = None,
    ):
        self.email = EmailBody[email.value]
        self.recipients = recipients
        self.bcc = bcc
        self.context = context
        self.body = body
        self.url = url
        self.name = name
        self.company_name = company_name
        self.period = period
        self.button_text = button_text
        self.button_url = button_url

    @property
    def data(self) -> EmailMessage:
        from_email = EMAIL_FROM or EMAIL_HOST_USER
        if not from_email:
            from_email = "noreply@incomedrivercalculator.idhtrade.org"
            TESTING = os.environ.get("TESTING")
            CLIENT_ID = os.environ.get("CLIENT_ID")
            if TESTING or CLIENT_ID == "test":
                from_email = "noreply@akvo.org"

        email = self.email.value

        # Resolve dynamic variables
        recipient_name = self.name
        if not recipient_name and self.recipients:
            recipient_name = self.recipients[0].get("Name")
        if not recipient_name:
            recipient_name = "there"

        period_val = self.period
        if not period_val:
            if self.email == EmailBody.FORGOT_PASSWORD:
                period_val = "30 minutes"
            else:
                period_val = "a limited time"

        company_val = self.company_name or ""
        action_url = self.button_url or self.url or ""
        if not action_url:
            if self.email == EmailBody.USER_REGISTRATION_NEW:
                action_url = f"{webdomain}/admin/users"
            elif self.email == EmailBody.USER_REGISTRATION_APPROVED:
                action_url = f"{webdomain}/login"

        def interpolate(text_val: Optional[str]) -> Optional[str]:
            if not text_val:
                return text_val
            return (
                text_val.replace("{name}", recipient_name)
                .replace("{company_name}", company_val)
                .replace("{period}", period_val)
                .replace("#url#", action_url)
                .replace("{url}", action_url)
            )

        title = email.get("title", "")
        subtitle = interpolate(email.get("subtitle"))
        body = interpolate(self.body or email.get("body"))
        disclaimer = interpolate(email.get("disclaimer"))
        button_text = self.button_text or email.get("button_text")
        button_color = email.get("button_color", "#3f98f7")
        show_plain_url = email.get("show_plain_url", False)
        image_filename = email.get("image")
        image_src = get_asset_src(image_filename) if image_filename else None
        message = interpolate(email.get("message"))

        html = html_template.render(
            logo=get_asset_src("email-logo.png"),
            instance_name="Better Income Toolkit",
            webdomain=webdomain,
            image_url=image_url,
            title=title,
            subtitle=subtitle,
            body=body,
            image=image_src,
            image_filename=image_filename,
            button_text=button_text,
            button_color=button_color,
            url=action_url,
            show_plain_url=show_plain_url,
            disclaimer=disclaimer,
            message=message,
            context=self.context,
            social_facebook=get_asset_src("social-facebook.svg"),
            social_linkedin=get_asset_src("social-linkedin.svg"),
            social_instagram=get_asset_src("social-instagram.svg"),
            social_x=get_asset_src("social-x.svg"),
        )

        msg = EmailMessage()
        msg["From"] = from_email
        msg["Subject"] = email["subject"]
        msg["To"] = format_recipients(self.recipients)
        if self.bcc:
            msg["Bcc"] = format_recipients(self.bcc)

        # The plain-text rendering is the message body and the HTML is
        # registered as an alternative, so a client that refuses HTML still
        # receives something readable.
        msg.set_content(html_to_text(html))
        msg.add_alternative(html, subtype="html")
        return msg

    @property
    def send(self) -> bool:
        try:
            cls = smtplib.SMTP_SSL if EMAIL_USE_SSL else smtplib.SMTP
            with cls(EMAIL_HOST, EMAIL_PORT, timeout=EMAIL_TIMEOUT) as relay:
                if EMAIL_USE_TLS and not EMAIL_USE_SSL:
                    relay.starttls()
                if EMAIL_HOST_USER:
                    relay.login(EMAIL_HOST_USER, EMAIL_HOST_PASSWORD)
                relay.send_message(self.data)
            return True
        except Exception as e:
            print(f"[ERROR], Failed to send email: {e}")
            return False

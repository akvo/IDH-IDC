import os
import enum
import smtplib
from email.message import EmailMessage
from email.utils import formataddr
from typing import List, Optional
from bs4 import BeautifulSoup
from models.user import EmailRecipient
from jinja2 import Environment, FileSystemLoader

webdomain = os.environ["WEBDOMAIN"]
if webdomain == "idc.akvo.org":
    webdomain = "incomedrivercalculator.idhtrade.org"
if "https://" not in webdomain:
    webdomain = f"https://{webdomain}"

loader = FileSystemLoader(".")
env = Environment(loader=loader)
html_template = env.get_template("./templates/email.html")
image_url = f"{webdomain}/email-icons"


# =========================================================
# SMTP Relay Configuration
# =========================================================

# Every setting has a default so development and test environments boot
# without a relay configured; only a deployment that actually sends mail
# has to supply them.
#
# The defaults describe the common correct relay: port 587 with STARTTLS.
# Implicit SSL is what port 465 wants instead, and neither mode can be
# inferred from the port number -- pick the wrong one and smtplib opens a
# plaintext socket against a TLS-only port and blocks until EMAIL_TIMEOUT.


def env_flag(name: str, default: str) -> bool:
    value = os.environ.get(name, default)
    return value.strip().lower() in ("1", "true", "yes")


EMAIL_HOST = os.environ.get("EMAIL_HOST", "localhost")
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", "587"))
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = env_flag(
    "EMAIL_USE_TLS", "false" if EMAIL_PORT == 465 else "true"
)
EMAIL_USE_SSL = env_flag(
    "EMAIL_USE_SSL", "true" if EMAIL_PORT == 465 else "false"
)
EMAIL_FROM = os.environ.get("EMAIL_FROM", "")
EMAIL_TIMEOUT = 10


class EmailBody(enum.Enum):
    USER_REGISTRATION_NEW = {
        "title": "New Account Registration",
        "subject": "Registration",
        "body": "User waiting for approval",
        "message": None,
        "image": f"{image_url}/user.png",
    }
    USER_REGISTRATION_APPROVED = {
        "title": "Registration Approved",
        "subject": "Registration",
        "body": """
                Congratulations!! You are now a verified user, with great
                power comes great responsibility.
                """,
        "message": None,
        "image": f"{image_url}/check-circle.png",
    }
    USER_PASSWORD_CREATED = {
        "title": "Access Changed",
        "subject": "User Access",
        "body": "Your access have been updated.",
        "message": None,
        "image": f"{image_url}/user-switch.png",
    }
    FORGOT_PASSWORD = {
        "title": "Forgot Password",
        "subject": "Forgot Password",
        "body": "You have requested to reset your password.",
        "message": """
            Please click
            <a href="#url#" target="_blank" rel="noreferrer">
                here
            </a> or the link below to reset your password.
            <br/>
            <br/>
            <a href="#url#" target="_blank" rel="noreferrer">
                #url#
            </a>
        """,
        "image": f"{image_url}/info-circle.png",
    }
    INVITATION = {
        "title": "Invitation",
        "subject": "Invitation",
        "body": "You have been invited to the Income Driver Calculator.",
        "message": """
            Please click
            <a href="#url#" target="_blank" rel="noreferrer">
                here
            </a> or the link below to set your password.
            <br/>
            <br/>
            <a href="#url#" target="_blank" rel="noreferrer">
                #url#
            </a>
        """,
        "image": f"{image_url}/user.png",
    }


# Recipients arrive as {"Email", "Name"} dicts -- the shape
# models.user.User.recipient produces and every call site passes along. Here
# they only have to be rendered into an RFC 5322 address list.
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


def html_to_text(html):
    soup = BeautifulSoup(html, "lxml")
    body = soup.find("body")
    return "".join(body.get_text())


class MailTypeEnum(enum.Enum):
    REG_NEW = "USER_REGISTRATION_NEW"
    REG_APPROVED = "USER_REGISTRATION_APPROVED"
    REG_PASSWORD_CREATED = "USER_PASSWORD_CREATED"
    FORGOT_PASSWORD = "FORGOT_PASSWORD"
    INVITATION = "INVITATION"


class Email:
    def __init__(
        self,
        recipients: List[EmailRecipient],
        email: MailTypeEnum,
        bcc: Optional[List[EmailRecipient]] = None,
        context: Optional[str] = None,
        body: Optional[str] = None,
        url: Optional[str] = None,
    ):
        self.email = EmailBody[email.value]
        self.recipients = recipients
        self.bcc = bcc
        self.context = context
        self.body = body
        self.url = url

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
        body = email["body"]
        message = email["message"]
        if self.body:
            body = self.body
        if self.url:
            message = message.replace("#url#", self.url)
        html = html_template.render(
            logo=f"{webdomain}/logo.png",
            instance_name="Income Driver Calculator",
            webdomain=webdomain,
            title=email["title"],
            body=body,
            image=email["image"],
            message=message,
            context=self.context,
        )
        msg = EmailMessage()
        msg["From"] = from_email
        msg["Subject"] = email["subject"]
        msg["To"] = format_recipients(self.recipients)
        if self.bcc:
            msg["Bcc"] = format_recipients(self.bcc)
        # The plain-text rendering is the message body and the HTML is
        # registered as an alternative, so a client that refuses HTML still
        # receives something readable. smtplib strips the Bcc header on send
        # while still using it for the envelope.
        msg.set_content(html_to_text(html))
        msg.add_alternative(html, subtype="html")
        return msg

    @property
    def send(self) -> bool:
        try:
            cls = smtplib.SMTP_SSL if EMAIL_USE_SSL else smtplib.SMTP
            with cls(EMAIL_HOST, EMAIL_PORT, timeout=EMAIL_TIMEOUT) as relay:
                # STARTTLS upgrades a plaintext connection, so it is only
                # meaningful when the socket did not already start as SSL.
                if EMAIL_USE_TLS and not EMAIL_USE_SSL:
                    relay.starttls()
                if EMAIL_HOST_USER:
                    relay.login(EMAIL_HOST_USER, EMAIL_HOST_PASSWORD)
                relay.send_message(self.data)
            return True
        except Exception as e:
            print(f"[ERROR], Failed to send email: {e}")
            return False

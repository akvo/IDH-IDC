import os
import enum
import base64
from typing import List, Optional
from bs4 import BeautifulSoup
from models.user import EmailRecipient
from mailjet_rest import Client
from jinja2 import Environment, FileSystemLoader

mjkey = os.environ["MAILJET_APIKEY"]
mjsecret = os.environ["MAILJET_SECRET"]
webdomain = os.environ["WEBDOMAIN"]
if webdomain == "idc.akvo.org":
    webdomain = "incomedrivercalculator.idhtrade.org"
if "https://" not in webdomain:
    webdomain = f"https://{webdomain}"

mailjet = Client(auth=(mjkey, mjsecret))
loader = FileSystemLoader(".")
env = Environment(loader=loader)
html_template = env.get_template("./templates/email.html")
image_url = f"{webdomain}/email-icons"
FTYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64"  # noqa


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
        "body": "You have invited to to IDC portal.",
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


def send(data):
    res = mailjet.send.create(data=data)
    res = res.json()
    return res


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


def format_attachment(file):
    try:
        with open(file, "rb") as f:
            f.read()
    except (OSError, IOError):
        return None
    return {
        "ContentType": FTYPE,
        "Filename": file.split("/")[2],
        "content": base64.b64encode(open(file, "rb").read()).decode("UTF-8"),
    }


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
        attachment: Optional[str] = None,
        context: Optional[str] = None,
        body: Optional[str] = None,
        url: Optional[str] = None,
    ):
        self.email = EmailBody[email.value]
        self.recipients = recipients
        self.bcc = bcc
        self.attachment = attachment
        self.context = context
        self.body = body
        self.url = url

    @property
    def data(self):
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
        payload = {
            "FromEmail": from_email,
            "Subject": email["subject"],
            "Html-part": html,
            "Text-part": html_to_text(html),
            "Recipients": self.recipients,
        }
        if self.bcc:
            payload.update({"Bcc": self.bcc})
        if self.attachment:
            attachment = format_attachment(self.attachment)
            payload.update({"Attachments": [attachment]})
        return payload

    @property
    def send(self) -> int:
        res = mailjet.send.create(data=self.data)
        return res.status_code == 200

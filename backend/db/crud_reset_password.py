import secrets
from sqlalchemy import func
from sqlalchemy.orm import Session
from models.user import User
from models.reset_password import (
    ResetPassword,
    ResetPasswordBase,
    RESET_PASSWORD_EXPIRE_MINUTES,
)
from datetime import datetime, timedelta


def new_reset_password(
    session: Session, email: str, commit: bool = True
) -> ResetPasswordBase:
    clean_email = email.strip().lower() if email else ""
    user = (
        session.query(User)
        .filter(func.lower(User.email) == clean_email)
        .first()
    )
    if not user:
        return None
    reset_password = (
        session.query(ResetPassword)
        .filter(ResetPassword.user == user.id)
        .first()
    )
    if not reset_password:
        reset_password = ResetPassword(user=user.id)
        session.add(reset_password)
    else:
        reset_password.url = secrets.token_urlsafe(32)
        reset_password.valid = datetime.utcnow() + timedelta(
            minutes=RESET_PASSWORD_EXPIRE_MINUTES
        )
    if commit:
        session.commit()
        session.flush()
        session.refresh(reset_password)
    return reset_password.serialize


def get_reset_password(session: Session, url: str) -> ResetPasswordBase:
    reset_password = (
        session.query(ResetPassword).filter(ResetPassword.url == url).first()
    )
    return reset_password


def delete_reset_password(
    session: Session, url: str, commit: bool = True
) -> None:
    session.query(ResetPassword).filter(ResetPassword.url == url).delete()
    if commit:
        session.commit()
        session.flush()

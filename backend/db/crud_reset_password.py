from uuid import uuid4
from sqlalchemy.orm import Session
from models.user import User
from models.reset_password import ResetPassword, ResetPasswordBase
from datetime import datetime, timedelta


def new_reset_password(session: Session, email: str) -> ResetPasswordBase:
    user = session.query(User).filter(User.email == email).first()
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
        reset_password.url = str(uuid4())
        reset_password.valid = datetime.utcnow() + timedelta(minutes=20)
    session.commit()
    session.flush()
    session.refresh(reset_password)
    return reset_password.serialize


def get_reset_password(session: Session, url: str) -> ResetPasswordBase:
    reset_password = (
        session.query(ResetPassword).filter(ResetPassword.url == url).first()
    )
    return reset_password


def delete_reset_password(session: Session, url: str) -> None:
    session.query(ResetPassword).filter(ResetPassword.url == url).delete()
    session.commit()

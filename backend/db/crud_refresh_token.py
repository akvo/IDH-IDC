import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional, Tuple

from sqlalchemy.orm import Session

from models.refresh_token import RefreshToken
from models.user import User

REFRESH_TOKEN_SESSION_DAYS = 1
REFRESH_TOKEN_REMEMBER_DAYS = 30


def hash_refresh_token(raw_token: str) -> str:
    """Hash a raw refresh token using SHA-256 hex digest."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def issue_refresh_token(
    session: Session,
    user_id: int,
    remember_me: bool = False,
    family_id: Optional[str] = None,
    commit: bool = True,
) -> Tuple[str, RefreshToken]:
    """Create and persist a new hashed refresh token row."""
    raw_token = secrets.token_urlsafe(48)
    resolved_family = family_id or secrets.token_hex(16)
    ttl_days = (
        REFRESH_TOKEN_REMEMBER_DAYS
        if remember_me
        else REFRESH_TOKEN_SESSION_DAYS
    )
    record = RefreshToken(
        user_id=user_id,
        token_hash=hash_refresh_token(raw_token),
        family_id=resolved_family,
        remember_me=bool(remember_me),
        expires_at=datetime.utcnow() + timedelta(days=ttl_days),
    )
    session.add(record)
    if commit:
        session.commit()
        session.refresh(record)
    else:
        session.flush()
    return raw_token, record


def rotate_refresh_token(
    session: Session, raw_token: str
) -> Optional[Tuple[str, RefreshToken, User]]:
    """Validate and rotate a refresh token with family replay protection."""
    if not raw_token:
        return None
    token_hash = hash_refresh_token(raw_token)
    record = (
        session.query(RefreshToken)
        .filter(RefreshToken.token_hash == token_hash)
        .first()
    )
    if not record:
        return None

    now = datetime.utcnow()
    if record.revoked_at is not None:
        # Replay detected: revoke every active token sharing this family_id.
        session.query(RefreshToken).filter(
            RefreshToken.family_id == record.family_id,
            RefreshToken.revoked_at.is_(None),
        ).update({"revoked_at": now}, synchronize_session=False)
        session.commit()
        return None

    if record.expires_at < now:
        record.revoked_at = now
        session.commit()
        return None

    user = session.query(User).filter(User.id == record.user_id).first()
    if not user or user.is_active != 1:
        record.revoked_at = now
        session.commit()
        return None

    record.revoked_at = now
    new_raw, new_record = issue_refresh_token(
        session=session,
        user_id=user.id,
        remember_me=record.remember_me,
        family_id=record.family_id,
        commit=False,
    )
    session.commit()
    session.refresh(new_record)
    return new_raw, new_record, user


def revoke_token(
    session: Session, raw_token: Optional[str], commit: bool = True
) -> bool:
    """Revoke a single active refresh token if found."""
    if not raw_token:
        return False
    token_hash = hash_refresh_token(raw_token)
    record = (
        session.query(RefreshToken)
        .filter(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked_at.is_(None),
        )
        .first()
    )
    if not record:
        return False
    record.revoked_at = datetime.utcnow()
    if commit:
        session.commit()
    else:
        session.flush()
    return True


def revoke_all_for_user(
    session: Session, user_id: int, commit: bool = True
) -> int:
    """Revoke every active refresh token owned by user_id."""
    count = (
        session.query(RefreshToken)
        .filter(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked_at.is_(None),
        )
        .update({"revoked_at": datetime.utcnow()}, synchronize_session=False)
    )
    if commit:
        session.commit()
    else:
        session.flush()
    return count

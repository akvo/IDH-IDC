from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_
from models.user_case_access import (
    UserCaseAccess,
    UserCaseAccessPayload,
    UserCaseAccessDict,
)
from models.enum_type import PermissionType


def check_user_case_access_permission(
    session: Session,
    user_id: int,
    case_id: int,
    permission: Optional[PermissionType] = None,
) -> UserCaseAccess:
    res = session.query(UserCaseAccess).filter(
        and_(
            UserCaseAccess.user == user_id,
            UserCaseAccess.case == case_id,
        )
    )
    if permission:
        res = res.filter(UserCaseAccess.permission == permission)
        return res.first()
    return res.all()


def find_user_case_access_viewer(
    session: Session, user_id: int
) -> List[UserCaseAccess]:
    # if user defined on this list, overide private case check
    # else user only can view public case (private = false)
    res = (
        session.query(UserCaseAccess)
        .filter(
            UserCaseAccess.user == user_id,
        )
        .all()
    )
    return res


def add_case_access(
    session: Session, payload: List[UserCaseAccessPayload], case_id: int
) -> UserCaseAccessDict:
    # add new case access
    uca = UserCaseAccess(case=case_id, user=payload.user, permission=payload.permission)
    session.add(uca)
    session.commit()
    session.flush()
    session.refresh(uca)
    return uca


def delete_case_access(session: Session, access_id: int):
    uca = session.query(UserCaseAccess).filter(UserCaseAccess.id == access_id).first()
    session.delete(uca)
    session.commit()
    session.flush()


def get_case_access(session: Session, case_id: int) -> List[UserCaseAccessDict]:
    data = session.query(UserCaseAccess).filter(UserCaseAccess.case == case_id).all()
    return data

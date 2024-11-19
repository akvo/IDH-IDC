from uuid import uuid4
from fastapi import HTTPException, status
from typing import Optional, List
from sqlalchemy import or_, and_
from sqlalchemy.orm import Session
from models.user import (
    User,
    UserDict,
    UserBase,
    UserUpdateBase,
    UserInvitation,
    UserRole,
    FilterUserRole,
)
from models.user_case_access import UserCaseAccess
from models.user_tag import UserTag
from models.user_business_unit import UserBusinessUnit, UserBusinessUnitRole
from db.crud_user_business_unit import (
    find_users_in_same_business_unit,
    find_user_business_units,
    delete_user_business_units_by_user_id,
    get_all_business_unit_users,
)
from db.crud_organisation import default_organisation


def add_user(
    session: Session,
    payload: UserBase,
    invitation_id: Optional[bool] = False,
) -> UserDict:
    try:
        password = payload.password.get_secret_value()
    except AttributeError:
        password = payload.password
    role = payload.role if invitation_id or payload.role else UserRole.user
    # all cases TRUE for Regular/Internal user (user with BU)
    all_cases = 1 if payload.all_cases or payload.business_units else 0
    if role in [UserRole.super_admin, UserRole.admin]:
        all_cases = 1
    # default organisation for now
    organisation = payload.organisation
    if not organisation:
        def_org = default_organisation(session=session, name="IDH")
        organisation = def_org.id
    user = User(
        fullname=payload.fullname,
        email=payload.email,
        password=password if not invitation_id else None,
        organisation=organisation,
        role=role,
        all_cases=all_cases,
        is_active=1 if invitation_id else 0,
        invitation_id=str(uuid4()) if invitation_id else None,
    )
    if payload.tags:
        for tag in payload.tags:
            user_tag = UserTag(tag=tag)
            user.user_tags.append(user_tag)
    if payload.cases:
        for proj in payload.cases:
            case_access = UserCaseAccess(
                case=proj["case"], permission=proj["permission"]
            )
            user.user_case_access.append(case_access)
    if payload.business_units:
        bu_role = (
            UserBusinessUnitRole.admin
            if role in [UserRole.super_admin, UserRole.admin]
            else UserBusinessUnitRole.member
        )
        for bu in payload.business_units:
            business_unit = UserBusinessUnit(
                business_unit=bu["business_unit"], role=bu_role
            )
            user.user_business_units.append(business_unit)
    session.add(user)
    session.commit()
    session.flush()
    session.refresh(user)
    return user


def update_user(
    session: Session, id: int, payload: UserUpdateBase
) -> UserDict:
    user = get_user_by_id(session=session, id=id)
    user.fullname = payload.fullname
    user.organisation = (
        payload.organisation if payload.organisation else user.organisation
    )
    user.is_active = 1 if payload.is_active else user.is_active
    role = payload.role if payload.role else user.role
    user.role = role
    all_cases = 0
    if role in [UserRole.super_admin, UserRole.admin]:
        all_cases = 1
    # all cases TRUE for Regular/Internal user (user with BU)
    user.all_cases = (
        1 if payload.all_cases or payload.business_units else all_cases
    )
    # Handle business units delete business units
    user_bus = find_user_business_units(session=session, user_id=user.id)
    if not payload.business_units and user_bus:
        delete_user_business_units_by_user_id(session=session, user_id=user.id)
    if payload.password:
        try:
            password = payload.password.get_secret_value()
        except AttributeError:
            password = payload.password
        user.password = password
    if payload.tags:
        # delete prev user tags before update
        prev_user_tags = (
            session.query(UserTag).filter(UserTag.user == user.id).all()
        )
        for ut in prev_user_tags:
            session.delete(ut)
            session.commit()
            session.flush()
        # add new user tags
        for tag in payload.tags:
            user_tag = UserTag(user=user.id, tag=tag)
            user.user_tags.append(user_tag)
    if payload.cases:
        # delete prev user cases before update
        prev_user_cases = (
            session.query(UserCaseAccess)
            .filter(UserCaseAccess.user == user.id)
            .all()
        )
        for uc in prev_user_cases:
            session.delete(uc)
            session.commit()
            session.flush()
        # add new user case access
        for proj in payload.cases:
            case_access = UserCaseAccess(
                user=user.id, case=proj["case"], permission=proj["permission"]
            )
            user.user_case_access.append(case_access)
    # Handle business units
    if payload.business_units:
        bu_role = (
            UserBusinessUnitRole.admin
            if role in [UserRole.super_admin, UserRole.admin]
            else UserBusinessUnitRole.member
        )
        # delete prev user business units before update
        prev_user_bus = (
            session.query(UserBusinessUnit)
            .filter(UserBusinessUnit.user == user.id)
            .all()
        )
        for bu in prev_user_bus:
            session.delete(bu)
            session.commit()
            session.flush()
        # add new user business units
        for bu in payload.business_units:
            business_unit = UserBusinessUnit(
                user=user.id, role=bu_role, business_unit=bu["business_unit"]
            )
            user.user_business_units.append(business_unit)
    session.commit()
    session.flush()
    session.refresh(user)
    return user


def update_password(session: Session, id: int, password: str) -> UserDict:
    user = get_user_by_id(session=session, id=id)
    user.password = password
    session.commit()
    session.flush()
    session.refresh(user)
    return user


def get_user_by_email(session: Session, email: str) -> User:
    return session.query(User).filter(User.email == email).first()


def get_user_by_id(session: Session, id: int) -> UserDict:
    user = session.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"user {id} not found",
        )
    return user


def filter_user(
    session: Session,
    search: Optional[str] = None,
    approved: Optional[bool] = True,
    organisation: Optional[int] = None,
    business_unit_users: Optional[List[int]] = None,
    role: Optional[FilterUserRole] = None,
):
    is_active = 1 if approved else 0
    user = session.query(User).filter(User.is_active == is_active)
    if search:
        user = user.filter(
            or_(
                User.fullname.ilike("%{}%".format(search.lower().strip())),
                User.email.ilike("%{}%".format(search.lower().strip())),
            )
        )
    if organisation:
        user = user.filter(User.organisation.in_([organisation]))
    if business_unit_users:
        user = user.filter(User.id.in_(business_unit_users))
    if role and role == FilterUserRole.internal:
        all_bus = get_all_business_unit_users(session=session)
        user_ids = [bu.user for bu in all_bus]
        user = user.filter(
            and_(User.id.in_(user_ids), User.role == UserRole.user)
        )
    if role and role == FilterUserRole.external:
        all_bus = get_all_business_unit_users(session=session)
        user_ids = [bu.user for bu in all_bus]
        user = user.filter(
            and_(~User.id.in_(user_ids), User.role == UserRole.user)
        )
    if role and role not in [
        FilterUserRole.internal,
        FilterUserRole.external,
    ]:
        user = user.filter(User.role == role.value)
    return user


def get_all_user(
    session: Session,
    search: Optional[str] = None,
    approved: Optional[bool] = True,
    organisation: Optional[List[int]] = None,
    business_unit_users: Optional[List[int]] = None,
    role: Optional[FilterUserRole] = None,
    skip: int = 0,
    limit: int = 10,
) -> List[UserDict]:
    user = filter_user(
        session=session,
        search=search,
        organisation=organisation,
        approved=approved,
        business_unit_users=business_unit_users,
        role=role,
    )
    user = user.order_by(User.id.desc()).offset(skip).limit(limit).all()
    return user


def count(
    session: Session,
    search: Optional[str] = None,
    approved: Optional[bool] = True,
    organisation: Optional[int] = None,
    business_unit_users: Optional[List[int]] = None,
) -> int:
    user = filter_user(
        session=session,
        search=search,
        organisation=organisation,
        approved=approved,
        business_unit_users=business_unit_users,
    )
    return user.count()


def delete_user(session: Session, id: int):
    user = get_user_by_id(session=session, id=id)
    session.delete(user)
    session.commit()
    session.flush()


def get_invitation(session: Session, invitation_id: str) -> UserInvitation:
    user = (
        session.query(User).filter(User.invitation_id == invitation_id).first()
    )
    if not user:
        return None
    return user


def accept_invitation(
    session: Session, invitation_id: str, password=str
) -> UserInvitation:
    user = get_invitation(session=session, invitation_id=invitation_id)
    user.password = password
    user.invitation_id = None
    user.is_active = 1
    session.commit()
    session.flush()
    session.refresh(user)
    return user


def find_same_business_unit(session: Session, user_id: int):
    return (
        session.query(UserBusinessUnit)
        .filter(UserBusinessUnit.user == user_id)
        .all()
    )


def find_business_unit_admin(session: Session, user_id: int):
    business_units = find_same_business_unit(session=session, user_id=user_id)
    bu_ids = [bu.business_unit for bu in business_units]
    user_ids = find_users_in_same_business_unit(
        session=session, business_units=bu_ids
    )
    admins = (
        session.query(User)
        .filter(and_(User.id.in_(user_ids), User.role == UserRole.admin))
        .all()
    )
    return admins


def find_super_admin(session: Session):
    super_admins = (
        session.query(User).filter(User.role == UserRole.super_admin).all()
    )
    return super_admins


def search_user(session: Session, search: str):
    user = filter_user(session=session, search=search, approved=True)
    return user.all()

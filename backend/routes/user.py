import os
import secrets
import db.crud_user as crud_user
import db.crud_user_business_unit as crud_bu
import db.crud_company as crud_company
import db.crud_reset_password as crud_reset_pwd
import db.crud_case as crud_case
import db.crud_user_case_access as crud_uca
import db.crud_tag as crud_tag
import db.crud_question as crud_question
import db.crud_reference_data as crud_ref_data
from db.crud_organisation import default_organisation
from db.academy import crud_profile, crud_settings

from math import ceil
from middleware import (
    Token,
    authenticate_user,
    generate_user_token,
    verify_user,
    verify_password,
    get_password_hash,
    verify_admin,
)
from fastapi import (
    Depends,
    HTTPException,
    status,
    APIRouter,
    Request,
    Query,
    Form,
)
from fastapi import Response
from fastapi.security import HTTPBearer
from fastapi.security import HTTPBasicCredentials as credentials
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy.orm import Session
from db.connection import get_session
from models.user import (
    User,
    ToolType,
    UserType,
    UserDict,
    UserBase,
    UserResponse,
    UserInfo,
    UserUpdateBase,
    UserInvitation,
    UserDetailDict,
    UserRole,
    UserSearchDict,
    FilterUserRole,
    UserRegisterAcademy,
    AcademyRegisterResponse,
    AcademyVerifyResponse,
    UserProfileUpdateRequest,
    ChangePasswordRequest,
    GrantIdcAccessRequest,
)
from models.academy.academy_schemas import (
    ChangePasswordPayload,
    ChangePasswordResponse,
)
from models.user_profile import UserProfileUpdatePayload
from models.user_business_unit import UserBusinessUnitRole
from typing import Optional, List
from pydantic import SecretStr
from http import HTTPStatus
from utils.mailer import Email, MailTypeEnum

security = HTTPBearer()
user_route = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/user/login")
oauth2_scopes = ["openid", "email"]
webdomain = os.environ["WEBDOMAIN"]
if webdomain == "idc.akvo.org":
    webdomain = "incomedrivercalculator.idhtrade.org"
if "https://" not in webdomain:
    webdomain = f"https://{webdomain}"


@user_route.post(
    "/user/login",
    response_model=Token,
    summary="user login",
    name="user:login",
    tags=["User"],
)
def login(
    req: Request,
    payload: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session),
):
    if not payload.grant_type == "password":
        raise HTTPException(status_code=404, detail="Invalid Grant Type")
    if payload.client_id != os.environ["CLIENT_ID"]:
        raise HTTPException(status_code=404, detail="Invalid Client ID")
    if payload.client_secret != os.environ["CLIENT_SECRET"]:
        raise HTTPException(status_code=404, detail="Invalid Client Secret")
    for scope in payload.scopes:
        if scope not in oauth2_scopes:
            raise HTTPException(status_code=404, detail="Scope Not Found")
    user = authenticate_user(
        session=session, email=payload.username, password=payload.password
    )
    if not user or not user.is_active:
        raise HTTPException(
            detail=(
                "Incorrect email or password."
                if not user
                else "You can't login until your account is approved."
            ),
            status_code=status.HTTP_401_UNAUTHORIZED,
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = generate_user_token(user)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user.to_user_info,
    }


@user_route.get(
    "/user",
    response_model=UserResponse,
    summary="get all users",
    name="user:get_all",
    tags=["User"],
)
def get_all(
    req: Request,
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = Query(None),
    approved: Optional[bool] = Query(True),
    organisation: Optional[int] = Query(None),
    role: Optional[FilterUserRole] = Query(None),
    company: Optional[int] = Query(None),
    tool: Optional[ToolType] = Query(None),
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    user = verify_admin(session=session, authenticated=req.state.authenticated)
    business_unit_users = []
    if user.role == UserRole.admin:
        business_unit_users = crud_bu.find_users_in_same_business_unit(
            session=session,
            business_units=[
                bu.business_unit for bu in user.user_business_units
            ],
        )
    user = crud_user.get_all_user(
        session=session,
        search=search,
        organisation=organisation,
        approved=approved,
        skip=(limit * (page - 1)),
        limit=limit,
        business_unit_users=business_unit_users,
        role=role,
        company=company,
        tool=tool,
    )
    if not user:
        raise HTTPException(status_code=404, detail="Not found")
    # count total user
    total = crud_user.count(
        session=session,
        search=search,
        organisation=organisation,
        approved=approved,
        business_unit_users=business_unit_users,
        role=role,
        company=company,
        tool=tool,
    )
    user = [u.to_user_list for u in user]
    total_page = ceil(total / limit) if total > 0 else 0
    if total_page < page:
        raise HTTPException(status_code=404, detail="Not found")
    return {
        "current": page,
        "data": user,
        "total": total,
        "total_page": total_page,
    }


@user_route.get(
    "/user/me",
    response_model=UserInfo,
    summary="get account information",
    name="user:me",
    tags=["User"],
)
def get_me(
    req: Request,
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    user = verify_user(session=session, authenticated=req.state.authenticated)
    return user.to_user_info


# user register by admin (user invitation)
@user_route.post(
    "/user/register",
    response_model=UserDict,
    summary="user register",
    name="user:register",
    tags=["User"],
)
def register(
    req: Request,
    payload: UserBase = Depends(UserBase.as_form),
    invitation_id: Optional[bool] = False,
    session: Session = Depends(get_session),
):
    # check invitation or not
    user = None
    if invitation_id:
        if hasattr(req.state, "authenticated"):
            user = verify_admin(
                session=session, authenticated=req.state.authenticated
            )
        else:
            raise HTTPException(status_code=403, detail="Forbidden access")
    # Check if user exist by email
    check_user_exist = crud_user.get_user_by_email(
        session=session, email=payload.email
    )
    if check_user_exist:
        raise HTTPException(
            status_code=409, detail=f"User {payload.email} already exist."
        )
    if payload.password:
        payload.password = payload.password.get_secret_value()
        payload.password = get_password_hash(payload.password)
    is_editor_or_viewer = payload.role in [UserRole.editor, UserRole.viewer]
    # if super_admin invite editor/viewer
    if (
        user
        and user.role == UserRole.super_admin
        and is_editor_or_viewer
        and not payload.business_units
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"business_units required for {payload.role.value} role",
        )
    # EOL super_admin invite editor/viewer
    # generate business unit for editor/viewer invited by admin
    if user and user.role == UserRole.admin and is_editor_or_viewer:
        same_business_units = crud_user.find_same_business_unit(
            session=session, user_id=user.id
        )
        payload_bu = []
        for bu in same_business_units:
            payload_bu.append(
                {
                    "business_unit": bu.business_unit,
                    "role": UserBusinessUnitRole.member.value,
                }
            )
        payload.business_units = payload_bu
    # EOL generate business unit for editor/viewer
    user = crud_user.add_user(
        session=session, payload=payload, invitation_id=invitation_id
    )
    res_invitation_id = user.invitation_id
    recipients = [user.recipient]
    user = user.serialize
    # send email
    if invitation_id:
        # send invitation email
        url = f"{webdomain}/invitation/{res_invitation_id}"
        email = Email(
            recipients=recipients, email=MailTypeEnum.INVITATION, url=url
        )
        email.send
    # regular / internal user registration
    if not invitation_id and payload.business_units:
        # send email to business unit admin
        admins = crud_user.find_business_unit_admin(
            session=session, user_id=user["id"]
        )
        email = Email(
            recipients=[a.recipient for a in admins],
            email=MailTypeEnum.REG_NEW,
        )
        email.send
    # external user registration
    if not invitation_id and not payload.business_units:
        # send email to super admin
        super_admins = crud_user.find_super_admin(session=session)
        email = Email(
            recipients=[a.recipient for a in super_admins],
            email=MailTypeEnum.REG_NEW,
        )
        email.send
    return user


@user_route.post(
    "/user/register-academy",
    response_model=AcademyRegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register new user for Living Income Academy",
    name="user:register_academy",
    tags=["User"],
)
def register_academy(
    req: Request,
    payload: UserRegisterAcademy,
    session: Session = Depends(get_session),
):
    normalized_email = payload.email.strip().lower()
    check_user_exist = crud_user.get_user_by_email(
        session=session, email=normalized_email
    )
    if check_user_exist:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"User {normalized_email} already exists.",
        )

    verification_token = secrets.token_hex(32)
    hashed_password = get_password_hash(payload.password)
    def_org = default_organisation(session=session, name="IDH")
    organisation_id = def_org.id if def_org else None

    user = User(
        fullname=payload.fullname.strip(),
        email=normalized_email,
        password=hashed_password,
        role=UserRole.user,
        organisation=organisation_id,
        company=None,
        is_active=0,
        all_cases=0,
        invitation_id=verification_token,
        tools=[ToolType.academy.value],
    )
    session.add(user)
    session.commit()
    session.flush()
    session.refresh(user)

    profile = crud_profile.get_or_create_user_profile(
        session=session, user=user
    )
    profile.company_name = payload.company_name.strip()
    session.commit()

    base_url = req.headers.get("origin") or webdomain
    verify_url = f"{base_url}/verify-academy?token={verification_token}"
    email = Email(
        recipients=[user.recipient],
        email=MailTypeEnum.ACADEMY_VERIFY,
        url=verify_url,
    )
    email.send

    return {
        "message": (
            "Registration successful. Please check your email "
            "to verify your account."
        )
    }


@user_route.get(
    "/user/verify-academy",
    response_model=AcademyVerifyResponse,
    summary="Verify Living Income Academy registration token",
    name="user:verify_academy",
    tags=["User"],
)
def verify_academy(
    req: Request,
    token: str = Query(..., description="Verification token"),
    session: Session = Depends(get_session),
):
    if not token or not token.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification token is required.",
        )

    user = (
        session.query(User)
        .filter(User.invitation_id == token.strip())
        .first()
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token.",
        )

    user.is_active = 1
    user.invitation_id = None
    session.commit()

    accept_header = req.headers.get("accept", "")
    if "text/html" in accept_header:
        base_url = req.headers.get("origin") or webdomain
        return RedirectResponse(
            url=f"{base_url}/login?verified=true",
            status_code=status.HTTP_302_FOUND,
        )

    return {
        "message": "Account verified successfully. You may now log in.",
        "verified": True,
    }


@user_route.get(
    "/user/invitation/{invitation_id:path}",
    response_model=UserInvitation,
    summary="get invitation detail",
    name="user:invitation",
    tags=["User"],
)
def invitation(
    req: Request, invitation_id: str, session: Session = Depends(get_session)
):
    user = crud_user.get_invitation(
        session=session, invitation_id=invitation_id
    )
    if not user:
        raise HTTPException(status_code=404, detail="Not found")
    return user.to_user_invitation


@user_route.post(
    "/user/invitation/{invitation_id:path}",
    response_model=Token,
    summary="set password for invited user",
    name="user:register_password",
    tags=["User"],
)
def change_password(
    req: Request,
    invitation_id: str,
    password: SecretStr = Form(...),
    session: Session = Depends(get_session),
):
    try:
        password = get_password_hash(password.get_secret_value())
    except AttributeError:
        password = password
    user = crud_user.accept_invitation(
        session=session, invitation_id=invitation_id, password=password
    )
    if not user:
        raise HTTPException(status_code=404, detail="Not found")
    access_token = generate_user_token(user)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user.to_user_info,
    }


@user_route.get(
    "/user/search_dropdown",
    response_model=List[UserSearchDict],
    summary="get users by search value",
    name="user:search_user_dropdown",
    tags=["User"],
)
def search_user(
    req: Request,
    search: str,
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    verify_user(session=session, authenticated=req.state.authenticated)
    user = crud_user.search_user(
        session=session,
        search=search,
    )
    if not user:
        return []
    return [u.to_search_dropdown for u in user]


@user_route.get(
    "/user/reset-password/{url:path}",
    response_model=UserInvitation,
    summary="Verify reset password",
    name="user:reset-password",
    tags=["User"],
)
def get_forgot_password(
    req: Request, url: str, session: Session = Depends(get_session)
):
    reset_password = crud_reset_pwd.get_reset_password(
        session=session, url=url
    )
    if not reset_password:
        raise HTTPException(status_code=404, detail="URL is not valid")
    reset_password = reset_password.serialize
    if reset_password["expired"]:
        return JSONResponse(
            status_code=status.HTTP_410_GONE,
            content={"message": "url is expired"},
        )
    user = crud_user.get_user_by_id(session=session, id=reset_password["user"])
    return user.to_user_invitation


@user_route.post(
    "/user/{user_id}/grant-idc",
    response_model=UserDetailDict,
    summary="grant IDC access to user",
    name="user:grant_idc",
    tags=["User"],
)
def grant_idc(
    req: Request,
    user_id: int,
    payload: GrantIdcAccessRequest,
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    verify_admin(session=session, authenticated=req.state.authenticated)
    company = crud_company.get_company_by_id(
        session=session, id=payload.company_id
    )
    user = crud_user.get_user_by_id(session=session, id=user_id)
    if user.is_active != 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "User account must be verified/active before granting "
                "IDC access"
            ),
        )
    tools_list = list(user.tools or [])
    if ToolType.idc.value not in tools_list:
        user.tools = [*tools_list, ToolType.idc.value]
    user.company = company.id
    if user.role == UserRole.user:
        user.user_type = payload.user_type or (
            user.user_type
            if user.user_type in (
                UserType.external_regular,
                UserType.external_advanced,
            )
            else UserType.external_regular
        )
    session.commit()
    session.refresh(user)
    email = Email(
        recipients=[user.recipient],
        email=MailTypeEnum.IDC_ACCESS_GRANTED,
        body=(
            f"An administrator has granted you access to the "
            f"Income Driver Calculator under {company.name}."
        ),
    )
    email.send
    return user.to_user_detail


@user_route.post(
    "/user/{user_id}/revoke-idc",
    response_model=UserDetailDict,
    summary="revoke IDC access from user",
    name="user:revoke_idc",
    tags=["User"],
)
def revoke_idc(
    req: Request,
    user_id: int,
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    verify_admin(session=session, authenticated=req.state.authenticated)
    user = crud_user.get_user_by_id(session=session, id=user_id)
    tools_list = list(user.tools or [])
    if ToolType.idc.value not in tools_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User does not have IDC access",
        )

    # Check case ownership before allowing IDC access revocation
    cases_owned_by_user = crud_case.get_case_by_created_by(
        session=session, created_by=user.id
    )
    if cases_owned_by_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "id": user.id,
                "email": user.email,
                "cases": [case.to_dropdown for case in cases_owned_by_user],
            },
        )

    new_tools = [t for t in tools_list if t != ToolType.idc.value]
    if not new_tools:
        new_tools = [ToolType.academy.value]
    user.tools = new_tools
    user.company = None
    user.all_cases = 0
    session.commit()
    session.refresh(user)
    return user.to_user_detail


@user_route.post(
    "/user/{user_id}/deactivate",
    response_model=UserDetailDict,
    summary="deactivate user account",
    name="user:deactivate",
    tags=["User"],
)
def deactivate_user(
    req: Request,
    user_id: int,
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    admin = verify_admin(session=session, authenticated=req.state.authenticated)
    user = crud_user.get_user_by_id(session=session, id=user_id)
    if admin.id == user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account",
        )
    user.is_active = 0
    session.commit()
    session.refresh(user)
    return user.to_user_detail


@user_route.post(
    "/user/{user_id}/activate",
    response_model=UserDetailDict,
    summary="activate user account",
    name="user:activate",
    tags=["User"],
)
def activate_user(
    req: Request,
    user_id: int,
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    verify_admin(session=session, authenticated=req.state.authenticated)
    user = crud_user.get_user_by_id(session=session, id=user_id)
    user.is_active = 1
    session.commit()
    session.refresh(user)
    return user.to_user_detail


@user_route.get(
    "/user/{user_id:path}",
    response_model=UserDetailDict,
    summary="get user detail by id",
    name="user:get_by_id",
    tags=["User"],
)
def get_user_by_id(
    req: Request,
    user_id: int,
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    verify_admin(session=session, authenticated=req.state.authenticated)
    user = crud_user.get_user_by_id(session=session, id=user_id)
    return user.to_user_detail


@user_route.put(
    "/user/profile",
    response_model=UserInfo,
    summary="update user profile",
    name="user:update_profile",
    tags=["User"],
)
def update_profile(
    req: Request,
    payload: UserProfileUpdateRequest,
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    user = verify_user(
        session=session, authenticated=req.state.authenticated
    )

    # Validate current password upfront so profile edits are never partially
    # committed when a combined password change fails authentication.
    if payload.new_password is not None:
        if not payload.current_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is required to set a new password",
            )
        if not verify_password(payload.current_password, user.password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect current password",
            )

    profile_update_kwargs = {}

    if payload.fullname is not None:
        trimmed_name = payload.fullname.strip()
        parts = trimmed_name.split(" ", 1)
        profile_update_kwargs["first_name"] = parts[0]
        profile_update_kwargs["last_name"] = (
            parts[1] if len(parts) > 1 else ""
        )
        user.fullname = trimmed_name

    tools_list = user.tools if user.tools is not None else []
    if "idc" not in tools_list and payload.company_name is not None:
        profile_update_kwargs["company_name"] = payload.company_name

    if profile_update_kwargs:
        crud_profile.update_user_profile(
            session=session,
            user=user,
            payload=UserProfileUpdatePayload(**profile_update_kwargs),
        )
        if payload.fullname is not None:
            user.fullname = payload.fullname.strip()

    if payload.new_password is not None:
        crud_settings.change_user_password(
            session=session,
            user=user,
            payload=ChangePasswordPayload(
                current_password=payload.current_password,
                new_password=payload.new_password,
            ),
        )

    session.commit()
    session.refresh(user)
    return user.to_user_info


@user_route.post(
    "/user/change-password",
    response_model=ChangePasswordResponse,
    summary="change user password",
    name="user:change_password",
    tags=["User"],
)
def change_user_password(
    req: Request,
    payload: ChangePasswordRequest,
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    user = verify_user(
        session=session, authenticated=req.state.authenticated
    )
    crud_settings.change_user_password(
        session=session,
        user=user,
        payload=ChangePasswordPayload(
            current_password=payload.current_password,
            new_password=payload.new_password,
        ),
    )
    return ChangePasswordResponse(message="Password changed successfully")


@user_route.put(
    "/user/{user_id:path}",
    response_model=UserInfo,
    summary="update user by id",
    name="user:update",
    tags=["User"],
)
def update_user_by_id(
    req: Request,
    user_id: int,
    approved: Optional[bool] = False,
    payload: UserUpdateBase = Depends(UserUpdateBase.as_form),
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    verify_user(session=session, authenticated=req.state.authenticated)
    if payload.password:
        payload.password = payload.password.get_secret_value()
        payload.password = get_password_hash(payload.password)
    user = crud_user.update_user(session=session, id=user_id, payload=payload)
    # send email to approved user
    if user and approved:
        email = Email(
            recipients=[user.recipient], email=MailTypeEnum.REG_APPROVED
        )
        email.send
    return user.to_user_info


@user_route.delete(
    "/user/{user_id:path}",
    responses={204: {"model": None}},
    status_code=HTTPStatus.NO_CONTENT,
    summary="delete user by id",
    name="user:delete",
    tags=["User"],
)
def delete(
    req: Request,
    user_id: int,
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    verify_admin(session=session, authenticated=req.state.authenticated)
    user = crud_user.get_user_by_id(session=session, id=user_id)

    # Make sure to check the case owner before allowing user deletion.
    cases_owned_by_user = crud_case.get_case_by_created_by(
        session=session, created_by=user.id
    )
    if cases_owned_by_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "id": user.id,
                "email": user.email,
                "cases": [case.to_dropdown for case in cases_owned_by_user],
            },
        )

    # Ensure that the case updated by deleted user also clean
    # by move created_by value into updated_by column
    cases_updated_by_user = crud_case.get_case_by_updated_by(
        session=session, updated_by=user.id
    )
    if cases_updated_by_user:
        for case in cases_updated_by_user:
            case.updated_by = case.created_by
        session.commit()

    # Confirm that the user's case access is removed.
    crud_uca.delete_case_access_by_user_id(session=session, user_id=user.id)

    # Verify that the user's business unit is deleted.
    crud_bu.delete_user_business_units_by_user_id(
        session=session, user_id=user.id
    )

    # Ensure that the user's ID is removed from tags created_by the user.
    tags = crud_tag.get_tag_by_user_id(session=session, user_id=user.id)
    if tags:
        for tag in tags:
            tag.created_by = None
        session.commit()

    # Verify user's ID removed from questions created_by the user
    questions = crud_question.get_question_by_created_by(
        session=session, created_by=user.id
    )
    if questions:
        for question in questions:
            question.created_by = None
        session.commit()

    # Verify user's ID removed from reference created_by the user
    references = crud_ref_data.get_reference_by_created_by(
        session=session, created_by=user.id
    )
    if references:
        for reference in references:
            reference.created_by = None
            session.flush()
            session.commit()
            session.refresh(reference)

    # finally delete user
    crud_user.delete_user(session=session, id=user.id)
    return Response(status_code=HTTPStatus.NO_CONTENT.value)


@user_route.post(
    "/user/forgot-password",
    status_code=201,
    summary="Generate Forgot Password Link",
    name="user:forgot-password",
    tags=["User"],
)
def new_forgot_password(
    req: Request,
    email: str = Form(...),
    session: Session = Depends(get_session),
):
    reset_password = crud_reset_pwd.new_reset_password(
        session=session, email=email
    )
    if not reset_password:
        raise HTTPException(status_code=404, detail="User Not found")
    # Send reset password email
    user = crud_user.get_user_by_email(session=session, email=email)
    url = f"{webdomain}/reset-password/{reset_password['url']}"
    email = Email(
        recipients=[user.recipient],
        email=MailTypeEnum.FORGOT_PASSWORD,
        url=url,
    )
    email.send
    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content={"message": "url is generated"},
    )


@user_route.post(
    "/user/reset-password/{url:path}",
    response_model=Token,
    summary="Reset password",
    name="user:reset-password",
    tags=["User"],
)
def post_forgot_password(
    req: Request,
    url: str,
    password: SecretStr = Form(...),
    session: Session = Depends(get_session),
):
    reset_password = crud_reset_pwd.get_reset_password(
        session=session, url=url
    )
    if not reset_password:
        raise HTTPException(status_code=404, detail="URL is not valid")
    reset_password = reset_password.serialize
    if reset_password["expired"]:
        return JSONResponse(
            status_code=status.HTTP_410_GONE,
            content={"message": "url is expired"},
        )
    password = get_password_hash(password.get_secret_value())
    user = crud_user.update_password(
        session=session, id=reset_password["user"], password=password
    )
    crud_reset_pwd.delete_reset_password(session=session, url=url)
    access_token = generate_user_token(user)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user.to_user_info,
    }

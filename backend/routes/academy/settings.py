from fastapi import (
    APIRouter,
    Depends,
    Request,
    Response,
    status,
)
from fastapi.security import HTTPBasicCredentials as credentials
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session

from db.academy import crud_settings
from db.connection import get_session
from middleware import verify_user
from models.academy.academy_schemas import (
    ChangePasswordPayload,
    ChangePasswordResponse,
)

security = HTTPBearer()
academy_settings_router = APIRouter(
    prefix="/academy",
    tags=["Academy - Settings"],
)


@academy_settings_router.post(
    "/settings/change-password",
    response_model=ChangePasswordResponse,
    summary="Change authenticated user password",
    name="academy:change_password",
)
def change_password(
    req: Request,
    payload: ChangePasswordPayload,
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    """Change password for the authenticated user."""
    user = verify_user(session=session, authenticated=req.state.authenticated)
    crud_settings.change_user_password(
        session=session, user=user, payload=payload
    )
    return ChangePasswordResponse(message="Password changed successfully")


@academy_settings_router.delete(
    "/account",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete authenticated learner account",
    name="academy:delete_account",
)
def delete_account(
    req: Request,
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    """Self-service deletion of the authenticated learner account."""
    user = verify_user(session=session, authenticated=req.state.authenticated)
    crud_settings.delete_learner_account(session=session, user=user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

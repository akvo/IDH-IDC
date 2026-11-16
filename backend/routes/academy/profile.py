from fastapi import (
    APIRouter,
    Depends,
    Request,
)
from fastapi.security import HTTPBasicCredentials as credentials
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session

from db.academy import crud_profile
from db.connection import get_session
from middleware import verify_user
from models.user_profile import (
    UserProfileResponse,
    UserProfileUpdatePayload,
)

security = HTTPBearer()
academy_profile_router = APIRouter(
    prefix="/academy",
    tags=["Academy - Profile"],
)


@academy_profile_router.get(
    "/profile",
    response_model=UserProfileResponse,
    summary="Get authenticated learner profile",
    name="academy:get_profile",
)
def get_profile(
    req: Request,
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    """Retrieve authenticated learner's profile, auto-provisioning if missing."""
    user = verify_user(session=session, authenticated=req.state.authenticated)
    return crud_profile.get_or_create_user_profile(session=session, user=user)


@academy_profile_router.put(
    "/profile",
    response_model=UserProfileResponse,
    summary="Update authenticated learner profile",
    name="academy:update_profile",
)
def update_profile(
    req: Request,
    payload: UserProfileUpdatePayload,
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    """Update learner profile and sync display name to user."""
    user = verify_user(session=session, authenticated=req.state.authenticated)
    return crud_profile.update_user_profile(
        session=session, user=user, payload=payload
    )

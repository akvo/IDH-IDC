"""Living Income Academy - User Profile CRUD Operations."""

from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from models.region import Region
from models.user import User
from models.user_profile import UserProfile, UserProfileUpdatePayload


def get_or_create_user_profile(
    session: Session, user: User
) -> UserProfile:
    """Retrieve existing user profile or auto-provision one from user info.

    If no user_profile record exists for user.id, provisions a new record
    parsing first_name and last_name from user.fullname, with default
    empty commodities list.
    """
    profile = (
        session.query(UserProfile)
        .filter(UserProfile.user_id == user.id)
        .first()
    )
    if profile:
        return profile

    fullname = (user.fullname or "").strip()
    if fullname:
        parts = fullname.split(" ", 1)
        first_name: Optional[str] = parts[0]
        last_name: Optional[str] = parts[1] if len(parts) > 1 else None
    else:
        first_name = None
        last_name = None

    profile = UserProfile(
        user_id=user.id,
        first_name=first_name,
        last_name=last_name,
        commodities=[],
    )
    session.add(profile)
    session.commit()
    session.refresh(profile)
    return profile


def update_user_profile(
    session: Session, user: User, payload: UserProfileUpdatePayload
) -> UserProfile:
    """Update learner profile and sync display name to user.fullname.

    Preserves user.company foreign key while updating organizational
    attributes in user_profile. Validates region_id if provided.
    """
    profile = get_or_create_user_profile(session=session, user=user)
    update_data = payload.model_dump(exclude_unset=True)

    if "first_name" in update_data:
        profile.first_name = update_data["first_name"]

    if "last_name" in update_data:
        profile.last_name = update_data["last_name"]

    if "company_name" in update_data:
        profile.company_name = update_data["company_name"]

    if "company_type" in update_data:
        profile.company_type = update_data["company_type"]

    if "sector" in update_data:
        profile.sector = update_data["sector"]

    if "region_id" in update_data:
        region_id = update_data["region_id"]
        if region_id is not None:
            region = (
                session.query(Region)
                .filter(Region.id == region_id)
                .first()
            )
            if not region:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Region with id {region_id} not found",
                )
            profile.region_id = region.id
            if (
                "region_name" not in update_data
                or not update_data.get("region_name")
            ):
                profile.region_name = region.name
        else:
            profile.region_id = None

    if "region_name" in update_data:
        profile.region_name = update_data["region_name"]

    if "commodities" in update_data:
        raw_commodities = update_data["commodities"]
        if raw_commodities is not None:
            cleaned: List[str] = []
            for item in raw_commodities:
                if isinstance(item, str):
                    c_clean = item.strip()
                    if c_clean and c_clean not in cleaned:
                        cleaned.append(c_clean)
            profile.commodities = cleaned
        else:
            profile.commodities = []

    # Sync full name back to user model
    full_name = f"{profile.first_name or ''} {profile.last_name or ''}".strip()
    if full_name:
        user.fullname = full_name
        session.add(user)

    session.add(profile)
    session.commit()
    session.refresh(profile)
    return profile

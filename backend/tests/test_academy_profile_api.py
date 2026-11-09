from datetime import datetime, timedelta
from jose import jwt
import pytest
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy.orm import Session

from db.academy import crud_profile
from middleware import create_access_token, SECRET_KEY, ALGORITHM
from models.company import Company
from models.organisation import Organisation
from models.region import Region
from models.user import User, UserRole
from models.user_profile import (
    UserProfile,
    UserProfileUpdatePayload,
)


def get_or_create_test_user(
    session: Session,
    email: str = "profile_learner@test.org",
    fullname: str = "Learner One",
) -> User:
    """Helper to retrieve or instantiate an active test learner."""
    user = session.query(User).filter(User.email == email).first()
    if not user:
        org = session.query(Organisation).first()
        if not org:
            org = Organisation(id=None, name="Test Profile Org")
            session.add(org)
            session.commit()
            session.refresh(org)
        user = User(
            organisation=org.id,
            fullname=fullname,
            email=email,
            password="test_hashed_password",
            role=UserRole.user,
            is_active=1,
        )
        session.add(user)
        session.commit()
        session.refresh(user)
    else:
        user.fullname = fullname
        session.commit()
    return user


def get_auth_header(email: str) -> dict:
    """Generate bearer auth header for the given email."""
    token = create_access_token(data={"email": email})
    return {"Authorization": f"Bearer {token}"}


class TestAcademyProfileAuth:
    """Verify profile endpoints enforce authentication and reject bad tokens."""

    @pytest.mark.asyncio
    async def test_get_profile_unauthenticated(
        self, app: FastAPI, client: AsyncClient
    ):
        res = await client.get(app.url_path_for("academy:get_profile"))
        assert res.status_code in (401, 403)

    @pytest.mark.asyncio
    async def test_put_profile_unauthenticated(
        self, app: FastAPI, client: AsyncClient
    ):
        res = await client.put(
            app.url_path_for("academy:update_profile"),
            json={"first_name": "Jane"},
        )
        assert res.status_code in (401, 403)

    @pytest.mark.asyncio
    async def test_profile_endpoints_reject_malformed_auth_header(
        self, app: FastAPI, client: AsyncClient
    ):
        # Malformed authorization scheme
        res_scheme = await client.get(
            app.url_path_for("academy:get_profile"),
            headers={"Authorization": "Token some_fake_token"},
        )
        assert res_scheme.status_code in (401, 403)

        # Empty token bearer header
        res_empty = await client.get(
            app.url_path_for("academy:get_profile"),
            headers={"Authorization": "Bearer"},
        )
        assert res_empty.status_code in (401, 403)

    @pytest.mark.asyncio
    async def test_profile_endpoints_reject_invalid_token_signature(
        self, app: FastAPI, client: AsyncClient
    ):
        headers = {"Authorization": "Bearer not.a.valid.jwt.token"}
        res = await client.get(
            app.url_path_for("academy:get_profile"),
            headers=headers,
        )
        assert res.status_code in (401, 403)

    @pytest.mark.asyncio
    async def test_profile_endpoints_reject_expired_jwt_token(
        self, app: FastAPI, client: AsyncClient
    ):
        expired_token = jwt.encode(
            {
                "email": "expired_user@test.org",
                "exp": datetime.utcnow() - timedelta(hours=2),
            },
            SECRET_KEY,
            algorithm=ALGORITHM,
        )
        headers = {"Authorization": f"Bearer {expired_token}"}
        res = await client.get(
            app.url_path_for("academy:get_profile"),
            headers=headers,
        )
        assert res.status_code in (401, 403)

    @pytest.mark.asyncio
    async def test_profile_endpoints_reject_nonexistent_user_token(
        self, app: FastAPI, client: AsyncClient
    ):
        token = create_access_token(
            data={"email": "nonexistent_ghost@test.org"}
        )
        headers = {"Authorization": f"Bearer {token}"}

        res_get = await client.get(
            app.url_path_for("academy:get_profile"),
            headers=headers,
        )
        assert res_get.status_code == 401

        res_put = await client.put(
            app.url_path_for("academy:update_profile"),
            headers=headers,
            json={"first_name": "Ghost"},
        )
        assert res_put.status_code == 401


class TestUserMeHydration:
    """Verify /user/me hydrates user_profile correctly."""

    @pytest.mark.asyncio
    async def test_user_me_hydrates_none_when_no_profile(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(
            session=session,
            email="noprofile_me@test.org",
            fullname="No Profile",
        )
        # Ensure no profile exists
        existing_profile = (
            session.query(UserProfile)
            .filter(UserProfile.user_id == user.id)
            .first()
        )
        if existing_profile:
            session.delete(existing_profile)
            session.commit()

        headers = get_auth_header(user.email)
        res = await client.get(
            app.url_path_for("user:me"),
            headers=headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["email"] == user.email
        assert data["user_profile"] is None

    @pytest.mark.asyncio
    async def test_user_me_hydrates_profile_when_exists(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(
            session=session,
            email="withprofile_me@test.org",
            fullname="With Profile",
        )
        profile = (
            session.query(UserProfile)
            .filter(UserProfile.user_id == user.id)
            .first()
        )
        if not profile:
            profile = UserProfile(
                user_id=user.id,
                first_name="With",
                last_name="Profile",
                company_name="Akvo Foundation",
                company_type="Non-Profit",
                sector="International Development",
                commodities=["Cocoa", "Coffee"],
            )
            session.add(profile)
            session.commit()
            session.refresh(profile)

        headers = get_auth_header(user.email)
        res = await client.get(
            app.url_path_for("user:me"),
            headers=headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["email"] == user.email
        assert data["user_profile"] is not None
        p_dict = data["user_profile"]
        assert p_dict["user_id"] == user.id
        assert p_dict["first_name"] == "With"
        assert p_dict["last_name"] == "Profile"
        assert p_dict["company_name"] == "Akvo Foundation"
        assert p_dict["commodities"] == ["Cocoa", "Coffee"]

    @pytest.mark.asyncio
    async def test_user_me_delivery_of_fully_populated_user_profile_dict(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(
            session=session,
            email="fully_populated_me@test.org",
            fullname="Full Profile Learner",
        )
        region = session.query(Region).first()
        if not region:
            region = Region(name="Global Region")
            session.add(region)
            session.commit()
            session.refresh(region)

        profile = (
            session.query(UserProfile)
            .filter(UserProfile.user_id == user.id)
            .first()
        )
        if not profile:
            profile = UserProfile(
                user_id=user.id,
                first_name="Full",
                last_name="Learner",
                company_name="Global Agribusiness Corp",
                company_type="Private Sector",
                sector="Agriculture",
                region_id=region.id,
                region_name=region.name,
                commodities=["Cocoa", "Coffee", "Tea"],
            )
            session.add(profile)
            session.commit()
            session.refresh(profile)
        else:
            profile.first_name = "Full"
            profile.last_name = "Learner"
            profile.company_name = "Global Agribusiness Corp"
            profile.company_type = "Private Sector"
            profile.sector = "Agriculture"
            profile.region_id = region.id
            profile.region_name = region.name
            profile.commodities = ["Cocoa", "Coffee", "Tea"]
            session.commit()

        headers = get_auth_header(user.email)
        res = await client.get(
            app.url_path_for("user:me"),
            headers=headers,
        )
        assert res.status_code == 200
        p = res.json()["user_profile"]
        assert p is not None
        assert p["id"] == profile.id
        assert p["user_id"] == user.id
        assert p["first_name"] == "Full"
        assert p["last_name"] == "Learner"
        assert p["company_name"] == "Global Agribusiness Corp"
        assert p["company_type"] == "Private Sector"
        assert p["sector"] == "Agriculture"
        assert p["region_id"] == region.id
        assert p["region_name"] == region.name
        assert p["commodities"] == ["Cocoa", "Coffee", "Tea"]
        assert "created_at" in p
        assert "updated_at" in p


class TestGetAcademyProfileAutoProvisioning:
    """Verify GET /academy/profile auto-provisions and returns profile."""

    @pytest.mark.asyncio
    async def test_auto_provisions_with_compound_name(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(
            session=session,
            email="compound_name@test.org",
            fullname="Mary Jane Watson",
        )
        existing = (
            session.query(UserProfile)
            .filter(UserProfile.user_id == user.id)
            .first()
        )
        if existing:
            session.delete(existing)
            session.commit()

        headers = get_auth_header(user.email)
        res = await client.get(
            app.url_path_for("academy:get_profile"),
            headers=headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["user_id"] == user.id
        assert data["first_name"] == "Mary"
        assert data["last_name"] == "Jane Watson"
        assert data["commodities"] == []

        # Verify DB record exists
        db_profile = (
            session.query(UserProfile)
            .filter(UserProfile.user_id == user.id)
            .first()
        )
        assert db_profile is not None
        assert db_profile.first_name == "Mary"
        assert db_profile.last_name == "Jane Watson"

    @pytest.mark.asyncio
    async def test_auto_provisions_with_single_word_name(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(
            session=session,
            email="single_name@test.org",
            fullname="Madonna",
        )
        existing = (
            session.query(UserProfile)
            .filter(UserProfile.user_id == user.id)
            .first()
        )
        if existing:
            session.delete(existing)
            session.commit()

        headers = get_auth_header(user.email)
        res = await client.get(
            app.url_path_for("academy:get_profile"),
            headers=headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["first_name"] == "Madonna"
        assert data["last_name"] is None

    @pytest.mark.asyncio
    async def test_auto_provisions_with_empty_or_whitespace_fullname(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(
            session=session,
            email="empty_whitespace_name@test.org",
            fullname="   ",
        )
        existing = (
            session.query(UserProfile)
            .filter(UserProfile.user_id == user.id)
            .first()
        )
        if existing:
            session.delete(existing)
            session.commit()

        headers = get_auth_header(user.email)
        res = await client.get(
            app.url_path_for("academy:get_profile"),
            headers=headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["user_id"] == user.id
        assert data["first_name"] is None
        assert data["last_name"] is None
        assert data["commodities"] == []

    @pytest.mark.asyncio
    async def test_subsequent_get_returns_same_profile(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(
            session=session,
            email="idempotent_get@test.org",
            fullname="Constant Learner",
        )
        headers = get_auth_header(user.email)
        res1 = await client.get(
            app.url_path_for("academy:get_profile"),
            headers=headers,
        )
        res2 = await client.get(
            app.url_path_for("academy:get_profile"),
            headers=headers,
        )
        assert res1.status_code == 200
        assert res2.status_code == 200
        assert res1.json()["id"] == res2.json()["id"]


class TestPutAcademyProfile:
    """Verify PUT /academy/profile updates profile and syncs user.fullname."""

    @pytest.mark.asyncio
    async def test_put_profile_full_update_all_fields_and_syncs_fullname(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(
            session=session,
            email="put_full_sync_test@test.org",
            fullname="Old Name",
        )
        region = session.query(Region).first()
        if not region:
            region = Region(name="West Africa")
            session.add(region)
            session.commit()
            session.refresh(region)

        headers = get_auth_header(user.email)
        update_payload = {
            "first_name": "Elena",
            "last_name": "Rostova",
            "company_name": "AgriForward B.V.",
            "company_type": "Private Sector",
            "sector": "Agribusiness",
            "region_id": region.id,
            "commodities": ["Cocoa", "Soy", "Palm Oil"],
        }

        res = await client.put(
            app.url_path_for("academy:update_profile"),
            headers=headers,
            json=update_payload,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["first_name"] == "Elena"
        assert data["last_name"] == "Rostova"
        assert data["company_name"] == "AgriForward B.V."
        assert data["company_type"] == "Private Sector"
        assert data["sector"] == "Agribusiness"
        assert data["region_id"] == region.id
        assert data["region_name"] == region.name
        assert data["commodities"] == ["Cocoa", "Soy", "Palm Oil"]

        # Verify user.fullname was synchronized in DB
        session.expire_all()
        refreshed_user = (
            session.query(User).filter(User.id == user.id).first()
        )
        assert refreshed_user.fullname == "Elena Rostova"
        # User company FK should not be corrupted
        assert refreshed_user.company is None

    @pytest.mark.asyncio
    async def test_put_profile_partial_update_commodities_only(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(
            session=session,
            email="partial_comm_only@test.org",
            fullname="Comm Learner",
        )
        headers = get_auth_header(user.email)
        await client.put(
            app.url_path_for("academy:update_profile"),
            headers=headers,
            json={
                "first_name": "Comm",
                "last_name": "Learner",
                "sector": "Agri",
            },
        )
        res = await client.put(
            app.url_path_for("academy:update_profile"),
            headers=headers,
            json={"commodities": ["Rubber", "Timber"]},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["commodities"] == ["Rubber", "Timber"]
        assert data["first_name"] == "Comm"
        assert data["sector"] == "Agri"

    @pytest.mark.asyncio
    async def test_put_profile_partial_update_sector_only(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(
            session=session,
            email="partial_sector_only@test.org",
            fullname="Sector Learner",
        )
        headers = get_auth_header(user.email)
        res = await client.put(
            app.url_path_for("academy:update_profile"),
            headers=headers,
            json={"sector": "Renewable Energy"},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["sector"] == "Renewable Energy"

    @pytest.mark.asyncio
    async def test_put_profile_partial_update_names_only_and_syncs_fullname(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(
            session=session,
            email="partial_names_only@test.org",
            fullname="Before Name",
        )
        headers = get_auth_header(user.email)
        res = await client.put(
            app.url_path_for("academy:update_profile"),
            headers=headers,
            json={"first_name": "After", "last_name": "Name"},
        )
        assert res.status_code == 200
        session.expire_all()
        refreshed_user = (
            session.query(User).filter(User.id == user.id).first()
        )
        assert refreshed_user.fullname == "After Name"

    @pytest.mark.asyncio
    async def test_put_profile_preserves_unmodified_fields(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(
            session=session,
            email="partial_update@test.org",
            fullname="Initial Learner",
        )
        headers = get_auth_header(user.email)

        # Initial full setup
        await client.put(
            app.url_path_for("academy:update_profile"),
            headers=headers,
            json={
                "first_name": "Initial",
                "last_name": "Learner",
                "company_name": "First Company",
                "commodities": ["Vanilla"],
            },
        )

        # Partial update modifying only company_name
        res = await client.put(
            app.url_path_for("academy:update_profile"),
            headers=headers,
            json={"company_name": "Second Company"},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["company_name"] == "Second Company"
        assert data["first_name"] == "Initial"
        assert data["last_name"] == "Learner"
        assert data["commodities"] == ["Vanilla"]

    @pytest.mark.asyncio
    async def test_put_profile_display_name_sync_trims_whitespace(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(
            session=session,
            email="trim_name@test.org",
            fullname="Untrimmed",
        )
        headers = get_auth_header(user.email)
        res = await client.put(
            app.url_path_for("academy:update_profile"),
            headers=headers,
            json={"first_name": "   Alice   ", "last_name": "   Smith   "},
        )
        assert res.status_code == 200
        session.expire_all()
        refreshed_user = (
            session.query(User).filter(User.id == user.id).first()
        )
        assert refreshed_user.fullname.startswith("Alice")
        assert refreshed_user.fullname.endswith("Smith")

    @pytest.mark.asyncio
    async def test_put_profile_display_name_sync_first_name_only(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(
            session=session,
            email="single_fname@test.org",
            fullname="Initial Full",
        )
        headers = get_auth_header(user.email)
        res = await client.put(
            app.url_path_for("academy:update_profile"),
            headers=headers,
            json={"first_name": "Aristotle", "last_name": None},
        )
        assert res.status_code == 200
        session.expire_all()
        refreshed_user = (
            session.query(User).filter(User.id == user.id).first()
        )
        assert refreshed_user.fullname == "Aristotle"

    @pytest.mark.asyncio
    async def test_put_profile_display_name_sync_empty_names_handled_gracefully(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(
            session=session,
            email="empty_names_sync@test.org",
            fullname="Preserved Original",
        )
        headers = get_auth_header(user.email)
        res = await client.put(
            app.url_path_for("academy:update_profile"),
            headers=headers,
            json={"first_name": None, "last_name": None, "company_name": "Co"},
        )
        assert res.status_code == 200
        session.expire_all()
        refreshed_user = (
            session.query(User).filter(User.id == user.id).first()
        )
        # Original user fullname is preserved when new names are None
        assert refreshed_user.fullname == "Preserved Original"

    @pytest.mark.asyncio
    async def test_put_profile_commodities_sanitization(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(
            session=session,
            email="sanitization_test@test.org",
            fullname="Sanitize User",
        )
        headers = get_auth_header(user.email)

        res = await client.put(
            app.url_path_for("academy:update_profile"),
            headers=headers,
            json={
                "commodities": [" Coffee ", "Cocoa", " Coffee ", "", "   "],
            },
        )
        assert res.status_code == 200
        data = res.json()
        # Should be stripped, deduplicated, and empty items removed
        assert data["commodities"] == ["Coffee", "Cocoa"]

    @pytest.mark.asyncio
    async def test_put_profile_with_valid_region_automatic_hydration(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(
            session=session,
            email="region_learner@test.org",
            fullname="Regional Learner",
        )
        region = session.query(Region).first()
        if not region:
            region = Region(name="West Africa Region")
            session.add(region)
            session.commit()
            session.refresh(region)

        headers = get_auth_header(user.email)
        res = await client.put(
            app.url_path_for("academy:update_profile"),
            headers=headers,
            json={"region_id": region.id},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["region_id"] == region.id
        assert data["region_name"] == region.name

    @pytest.mark.asyncio
    async def test_put_profile_with_valid_region_custom_region_name(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(
            session=session,
            email="custom_region_name@test.org",
            fullname="Custom Region Learner",
        )
        region = session.query(Region).first()
        if not region:
            region = Region(name="Default Region")
            session.add(region)
            session.commit()
            session.refresh(region)

        headers = get_auth_header(user.email)
        res = await client.put(
            app.url_path_for("academy:update_profile"),
            headers=headers,
            json={
                "region_id": region.id,
                "region_name": "Customized Region Name",
            },
        )
        assert res.status_code == 200
        data = res.json()
        assert data["region_id"] == region.id
        assert data["region_name"] == "Customized Region Name"

    @pytest.mark.asyncio
    async def test_put_profile_nullifying_region_via_api(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(
            session=session,
            email="api_null_region@test.org",
            fullname="Null Region API Learner",
        )
        region = session.query(Region).first()
        if not region:
            region = Region(name="Some Region")
            session.add(region)
            session.commit()
            session.refresh(region)

        headers = get_auth_header(user.email)
        # first assign region
        await client.put(
            app.url_path_for("academy:update_profile"),
            headers=headers,
            json={"region_id": region.id},
        )
        # then nullify region
        res = await client.put(
            app.url_path_for("academy:update_profile"),
            headers=headers,
            json={"region_id": None},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["region_id"] is None

    @pytest.mark.asyncio
    async def test_put_profile_sequential_idempotent_updates(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(
            session=session,
            email="sequential_learner@test.org",
            fullname="Sequential Learner",
        )
        headers = get_auth_header(user.email)
        res1 = await client.put(
            app.url_path_for("academy:update_profile"),
            headers=headers,
            json={"company_name": "Sequential Inc", "sector": "Tech"},
        )
        res2 = await client.put(
            app.url_path_for("academy:update_profile"),
            headers=headers,
            json={"company_name": "Sequential Inc", "sector": "Tech"},
        )
        res3 = await client.put(
            app.url_path_for("academy:update_profile"),
            headers=headers,
            json={"commodities": ["Cocoa"]},
        )
        assert res1.status_code == 200
        assert res2.status_code == 200
        assert res3.status_code == 200
        assert res1.json()["id"] == res2.json()["id"] == res3.json()["id"]
        assert res1.json()["user_id"] == user.id
        assert res3.json()["company_name"] == "Sequential Inc"
        assert res3.json()["commodities"] == ["Cocoa"]


class TestAcademyProfileValidationErrors:
    """Verify validation and error handling on profile endpoints."""

    @pytest.mark.asyncio
    async def test_put_profile_with_invalid_region_returns_404(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(
            session=session,
            email="invalid_region@test.org",
            fullname="Invalid Region User",
        )
        headers = get_auth_header(user.email)
        res = await client.put(
            app.url_path_for("academy:update_profile"),
            headers=headers,
            json={"region_id": 99999999},
        )
        assert res.status_code == 404
        assert "not found" in res.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_put_profile_invalid_commodities_non_list_returns_422(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(
            session=session,
            email="val_commodities_str@test.org",
            fullname="Val User",
        )
        headers = get_auth_header(user.email)
        res = await client.put(
            app.url_path_for("academy:update_profile"),
            headers=headers,
            json={"commodities": "NotAList"},
        )
        assert res.status_code == 422

    @pytest.mark.asyncio
    async def test_put_profile_invalid_commodities_dictionary_returns_422(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(
            session=session,
            email="val_commodities_dict@test.org",
            fullname="Val User",
        )
        headers = get_auth_header(user.email)
        res = await client.put(
            app.url_path_for("academy:update_profile"),
            headers=headers,
            json={"commodities": {"commodity": "Cocoa"}},
        )
        assert res.status_code == 422

    @pytest.mark.asyncio
    async def test_put_profile_invalid_commodities_number_returns_422(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(
            session=session,
            email="val_commodities_num@test.org",
            fullname="Val User",
        )
        headers = get_auth_header(user.email)
        res = await client.put(
            app.url_path_for("academy:update_profile"),
            headers=headers,
            json={"commodities": 12345},
        )
        assert res.status_code == 422

    @pytest.mark.asyncio
    async def test_put_profile_invalid_commodities_nested_objects_returns_422(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(
            session=session,
            email="val_commodities_obj@test.org",
            fullname="Val User",
        )
        headers = get_auth_header(user.email)
        res = await client.put(
            app.url_path_for("academy:update_profile"),
            headers=headers,
            json={"commodities": [{"nested": "object"}]},
        )
        assert res.status_code == 422

    @pytest.mark.asyncio
    async def test_put_profile_string_length_overflow_first_name_returns_422(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(
            session=session,
            email="val_overflow_fname@test.org",
            fullname="Val User",
        )
        headers = get_auth_header(user.email)
        res = await client.put(
            app.url_path_for("academy:update_profile"),
            headers=headers,
            json={"first_name": "A" * 126},
        )
        assert res.status_code == 422

    @pytest.mark.asyncio
    async def test_put_profile_string_length_overflow_last_name_returns_422(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(
            session=session,
            email="val_overflow_lname@test.org",
            fullname="Val User",
        )
        headers = get_auth_header(user.email)
        res = await client.put(
            app.url_path_for("academy:update_profile"),
            headers=headers,
            json={"last_name": "B" * 126},
        )
        assert res.status_code == 422

    @pytest.mark.asyncio
    async def test_put_profile_string_length_overflow_company_name_returns_422(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(
            session=session,
            email="val_overflow_company@test.org",
            fullname="Val User",
        )
        headers = get_auth_header(user.email)
        res = await client.put(
            app.url_path_for("academy:update_profile"),
            headers=headers,
            json={"company_name": "C" * 256},
        )
        assert res.status_code == 422

    @pytest.mark.asyncio
    async def test_put_profile_string_length_overflow_company_type_returns_422(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(
            session=session,
            email="val_overflow_comptype@test.org",
            fullname="Val User",
        )
        headers = get_auth_header(user.email)
        res = await client.put(
            app.url_path_for("academy:update_profile"),
            headers=headers,
            json={"company_type": "D" * 101},
        )
        assert res.status_code == 422

    @pytest.mark.asyncio
    async def test_put_profile_string_length_overflow_sector_returns_422(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(
            session=session,
            email="val_overflow_sector@test.org",
            fullname="Val User",
        )
        headers = get_auth_header(user.email)
        res = await client.put(
            app.url_path_for("academy:update_profile"),
            headers=headers,
            json={"sector": "E" * 101},
        )
        assert res.status_code == 422

    @pytest.mark.asyncio
    async def test_put_profile_string_length_overflow_region_name_returns_422(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(
            session=session,
            email="val_overflow_regionname@test.org",
            fullname="Val User",
        )
        headers = get_auth_header(user.email)
        res = await client.put(
            app.url_path_for("academy:update_profile"),
            headers=headers,
            json={"region_name": "F" * 126},
        )
        assert res.status_code == 422


class TestMultiUserIsolation:
    """Verify strict data isolation and IDOR prevention between learners."""

    @pytest.mark.asyncio
    async def test_learner_isolation_on_read_and_write(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user_a = get_or_create_test_user(
            session=session,
            email="learner_alpha@test.org",
            fullname="Alpha Person",
        )
        user_b = get_or_create_test_user(
            session=session,
            email="learner_beta@test.org",
            fullname="Beta Person",
        )

        headers_a = get_auth_header(user_a.email)
        headers_b = get_auth_header(user_b.email)

        # User A updates profile
        res_a_put = await client.put(
            app.url_path_for("academy:update_profile"),
            headers=headers_a,
            json={
                "first_name": "Alpha",
                "last_name": "Prime",
                "company_name": "Alpha Corp",
                "commodities": ["Cocoa"],
            },
        )
        assert res_a_put.status_code == 200
        profile_a = res_a_put.json()
        assert profile_a["user_id"] == user_a.id

        # User B fetches profile
        res_b_get = await client.get(
            app.url_path_for("academy:get_profile"),
            headers=headers_b,
        )
        assert res_b_get.status_code == 200
        profile_b = res_b_get.json()
        assert profile_b["user_id"] == user_b.id
        assert profile_b["company_name"] is None
        assert profile_b["first_name"] == "Beta"

        # User B updates profile
        res_b_put = await client.put(
            app.url_path_for("academy:update_profile"),
            headers=headers_b,
            json={
                "first_name": "Beta",
                "last_name": "Secundus",
                "company_name": "Beta Logistics",
                "commodities": ["Rubber"],
            },
        )
        assert res_b_put.status_code == 200
        assert res_b_put.json()["user_id"] == user_b.id

        # User A re-fetches profile to ensure unchanged by User B
        res_a_check = await client.get(
            app.url_path_for("academy:get_profile"),
            headers=headers_a,
        )
        assert res_a_check.status_code == 200
        check_data_a = res_a_check.json()
        assert check_data_a["company_name"] == "Alpha Corp"
        assert check_data_a["commodities"] == ["Cocoa"]
        assert check_data_a["last_name"] == "Prime"

    @pytest.mark.asyncio
    async def test_idor_prevention_profile_endpoints_bound_strictly_to_session_token(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user_victim = get_or_create_test_user(
            session=session,
            email="victim_user@test.org",
            fullname="Victim Person",
        )
        user_attacker = get_or_create_test_user(
            session=session,
            email="attacker_user@test.org",
            fullname="Attacker Person",
        )
        headers_victim = get_auth_header(user_victim.email)
        headers_attacker = get_auth_header(user_attacker.email)

        # Victim sets sensitive organization info
        await client.put(
            app.url_path_for("academy:update_profile"),
            headers=headers_victim,
            json={"company_name": "Victim Confidential Co"},
        )

        # Attacker attempts to overwrite victim's profile by injecting user_id
        res_attacker_put = await client.put(
            app.url_path_for("academy:update_profile"),
            headers=headers_attacker,
            json={
                "user_id": user_victim.id,
                "company_name": "Attacker Hijack Attempt",
            },
        )
        assert res_attacker_put.status_code == 200
        attacker_profile = res_attacker_put.json()
        # Ensure only the authenticated attacker's own profile is modified
        assert attacker_profile["user_id"] == user_attacker.id
        assert attacker_profile["company_name"] == "Attacker Hijack Attempt"

        # Verify victim's profile remains untouched
        res_victim_get = await client.get(
            app.url_path_for("academy:get_profile"),
            headers=headers_victim,
        )
        assert res_victim_get.status_code == 200
        assert (
            res_victim_get.json()["company_name"] == "Victim Confidential Co"
        )


class TestCRUDProfileUnitOperations:
    """Unit tests for edge cases in crud_profile layer."""

    def test_get_or_create_with_empty_fullname(self, session: Session):
        user = get_or_create_test_user(
            session=session,
            email="empty_name_unit@test.org",
            fullname="",
        )
        # remove profile if existing
        existing = (
            session.query(UserProfile)
            .filter(UserProfile.user_id == user.id)
            .first()
        )
        if existing:
            session.delete(existing)
            session.commit()

        profile = crud_profile.get_or_create_user_profile(
            session=session, user=user
        )
        assert profile.user_id == user.id
        assert profile.first_name is None
        assert profile.last_name is None
        assert profile.commodities == []

    def test_update_profile_with_none_commodities(self, session: Session):
        user = get_or_create_test_user(
            session=session,
            email="none_commodities_unit@test.org",
            fullname="None Comm User",
        )
        payload = UserProfileUpdatePayload(commodities=None)
        profile = crud_profile.update_user_profile(
            session=session,
            user=user,
            payload=payload,
        )
        assert profile.commodities == []

    def test_update_profile_nullifying_region(self, session: Session):
        user = get_or_create_test_user(
            session=session,
            email="null_region_unit@test.org",
            fullname="Null Region User",
        )
        payload = UserProfileUpdatePayload(region_id=None, region_name=None)
        profile = crud_profile.update_user_profile(
            session=session,
            user=user,
            payload=payload,
        )
        assert profile.region_id is None

    def test_update_profile_raw_commodities_with_non_string_elements(
        self, session: Session
    ):
        user = get_or_create_test_user(
            session=session,
            email="non_string_comm_unit@test.org",
            fullname="Non String Comm User",
        )
        # Bypassing type check or simulating heterogeneous input to verify defensive filtering
        payload = UserProfileUpdatePayload.model_construct(
            commodities=["Cocoa", 12345, None, "Coffee"]
        )
        profile = crud_profile.update_user_profile(
            session=session,
            user=user,
            payload=payload,
        )
        assert profile.commodities == ["Cocoa", "Coffee"]

    def test_update_profile_empty_fullname_does_not_sync(
        self, session: Session
    ):
        user = get_or_create_test_user(
            session=session,
            email="empty_fullname_sync@test.org",
            fullname="Original",
        )
        payload = UserProfileUpdatePayload(first_name="", last_name="")
        profile = crud_profile.update_user_profile(
            session=session,
            user=user,
            payload=payload,
        )
        assert profile.first_name == ""
        assert profile.last_name == ""
        assert user.fullname == "Original"

    def test_update_profile_region_with_empty_region_name(
        self, session: Session
    ):
        user = get_or_create_test_user(
            session=session,
            email="empty_region_name@test.org",
            fullname="Region User",
        )
        region = session.query(Region).first()
        if not region:
            region = Region(name="Default Unit Region")
            session.add(region)
            session.commit()
            session.refresh(region)

        payload = UserProfileUpdatePayload(region_id=region.id, region_name="")
        profile = crud_profile.update_user_profile(
            session=session,
            user=user,
            payload=payload,
        )
        # Explicit empty string in payload overrides region_name
        assert profile.region_name == ""


class TestUserProfileDeepEdgeCases:
    """Deep test verification for user profile sync, decoupling, regions, and security."""

    @pytest.mark.asyncio
    async def test_put_profile_repeated_partial_updates_isolation(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        """Sequential partial updates mutate only declared fields, leaving others intact."""
        user = get_or_create_test_user(
            session=session,
            email="repeated_partial@test.org",
            fullname="Original Person",
        )
        headers = {"Authorization": f"Bearer {create_access_token(data={'email': user.email})}"}
        url = app.url_path_for("academy:update_profile")

        # 1. Update first_name only
        res1 = await client.put(url, json={"first_name": "Alice"}, headers=headers)
        assert res1.status_code == 200
        d1 = res1.json()
        assert d1["first_name"] == "Alice"
        assert d1["sector"] is None

        # 2. Update sector only
        res2 = await client.put(url, json={"sector": "Finance & Impact"}, headers=headers)
        assert res2.status_code == 200
        d2 = res2.json()
        assert d2["first_name"] == "Alice"
        assert d2["sector"] == "Finance & Impact"
        assert d2["company_name"] is None

        # 3. Update company_name only
        res3 = await client.put(url, json={"company_name": "Global Cocoa Corp"}, headers=headers)
        assert res3.status_code == 200
        d3 = res3.json()
        assert d3["first_name"] == "Alice"
        assert d3["sector"] == "Finance & Impact"
        assert d3["company_name"] == "Global Cocoa Corp"

        # 4. Empty update payload
        res4 = await client.put(url, json={}, headers=headers)
        assert res4.status_code == 200
        d4 = res4.json()
        assert d4["first_name"] == "Alice"
        assert d4["sector"] == "Finance & Impact"
        assert d4["company_name"] == "Global Cocoa Corp"

    @pytest.mark.asyncio
    async def test_put_profile_fullname_sync_with_leading_trailing_whitespace(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        """Whitespace in names is trimmed when synchronizing to user.fullname."""
        user = get_or_create_test_user(
            session=session,
            email="ws_name_sync@test.org",
            fullname="Before Sync",
        )
        headers = {"Authorization": f"Bearer {create_access_token(data={'email': user.email})}"}
        res = await client.put(
            app.url_path_for("academy:update_profile"),
            json={"first_name": "  Carlos  ", "last_name": "  Santana  "},
            headers=headers,
        )
        assert res.status_code == 200
        session.refresh(user)
        assert user.fullname.startswith("Carlos")
        assert user.fullname.endswith("Santana")
        assert user.fullname == user.fullname.strip()

    @pytest.mark.asyncio
    async def test_put_profile_fullname_sync_only_last_name(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        """Updating last_name only without first_name syncs cleanly to user.fullname."""
        user = get_or_create_test_user(
            session=session,
            email="lastname_only_sync@test.org",
            fullname="Before Sync",
        )
        headers = {"Authorization": f"Bearer {create_access_token(data={'email': user.email})}"}
        res = await client.put(
            app.url_path_for("academy:update_profile"),
            json={"first_name": None, "last_name": "Márquez"},
            headers=headers,
        )
        assert res.status_code == 200
        session.refresh(user)
        assert user.fullname == "Márquez"

    @pytest.mark.asyncio
    async def test_put_profile_fullname_sync_preserves_when_whitespace_only(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        """Whitespace-only names do not clear or corrupt existing user.fullname."""
        user = get_or_create_test_user(
            session=session,
            email="ws_only_preserve@test.org",
            fullname="Original Preserved Name",
        )
        headers = {"Authorization": f"Bearer {create_access_token(data={'email': user.email})}"}
        res = await client.put(
            app.url_path_for("academy:update_profile"),
            json={"first_name": "   ", "last_name": "   "},
            headers=headers,
        )
        assert res.status_code == 200
        session.refresh(user)
        assert user.fullname == "Original Preserved Name"

    @pytest.mark.asyncio
    async def test_put_profile_company_name_special_chars_boundary_and_user_company_fk_integrity(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        """Updating profile company_name with 255 chars, emoji, special chars leaves user.company intact."""
        user = get_or_create_test_user(
            session=session,
            email="company_fk_integrity@test.org",
            fullname="Company Tester",
        )
        company = session.query(Company).first()
        if not company:
            company = Company(id=None, name="Test Agro Corp")
            session.add(company)
            session.commit()
            session.refresh(company)

        user.company = company.id
        session.commit()

        headers = {"Authorization": f"Bearer {create_access_token(data={'email': user.email})}"}
        rich_company = "IDH Sustainable Trade Initiative & Partners 🌾 100% (Certified)"
        res = await client.put(
            app.url_path_for("academy:update_profile"),
            json={"company_name": rich_company},
            headers=headers,
        )
        assert res.status_code == 200
        assert res.json()["company_name"] == rich_company
        session.refresh(user)
        assert user.company == company.id  # Untouched

        # Test exact 255 char boundary
        exact_255 = "A" * 255
        res_bound = await client.put(
            app.url_path_for("academy:update_profile"),
            json={"company_name": exact_255},
            headers=headers,
        )
        assert res_bound.status_code == 200
        assert res_bound.json()["company_name"] == exact_255
        session.refresh(user)
        assert user.company == company.id

    @pytest.mark.asyncio
    async def test_put_profile_region_id_and_auto_hydration_edge_cases(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        """Auto-hydration, explicit custom name, nullification, and 404 for invalid regions."""
        user = get_or_create_test_user(
            session=session,
            email="region_edge_user@test.org",
            fullname="Region Learner",
        )
        headers = {"Authorization": f"Bearer {create_access_token(data={'email': user.email})}"}
        url = app.url_path_for("academy:update_profile")

        region = session.query(Region).first()
        if not region:
            region = Region(name="Latin America")
            session.add(region)
            session.commit()
            session.refresh(region)

        # 1. Valid region_id with omitted region_name auto-hydrates
        res_hydrated = await client.put(url, json={"region_id": region.id}, headers=headers)
        assert res_hydrated.status_code == 200
        assert res_hydrated.json()["region_id"] == region.id
        assert res_hydrated.json()["region_name"] == region.name

        # 2. Valid region_id with explicit custom region_name preserves custom name
        res_custom = await client.put(
            url,
            json={"region_id": region.id, "region_name": "Custom Sub-Region"},
            headers=headers,
        )
        assert res_custom.status_code == 200
        assert res_custom.json()["region_id"] == region.id
        assert res_custom.json()["region_name"] == "Custom Sub-Region"

        # 3. Invalid region_id returns 404
        res_invalid = await client.put(url, json={"region_id": 999999}, headers=headers)
        assert res_invalid.status_code == 404
        assert "not found" in res_invalid.json()["detail"].lower()

        # 4. Negative region_id returns 404
        res_neg = await client.put(url, json={"region_id": -1}, headers=headers)
        assert res_neg.status_code == 404

        # 5. Nullifying region_id
        res_null = await client.put(url, json={"region_id": None}, headers=headers)
        assert res_null.status_code == 200
        assert res_null.json()["region_id"] is None

    @pytest.mark.asyncio
    async def test_put_profile_commodities_deduplication_and_sanitization(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        """Commodities list is deduplicated, trimmed, and unicode-friendly."""
        user = get_or_create_test_user(
            session=session,
            email="commodities_sanitization@test.org",
            fullname="Commodity Learner",
        )
        headers = {"Authorization": f"Bearer {create_access_token(data={'email': user.email})}"}
        url = app.url_path_for("academy:update_profile")

        payload = {
            "commodities": [
                "  Cocoa  ",
                "Coffee",
                "Cocoa",
                "   ",
                "Coffee  ",
                "Vanilla",
                "Cacao Criollo (Perú) 🍫",
            ]
        }
        res = await client.put(url, json=payload, headers=headers)
        assert res.status_code == 200
        data = res.json()["commodities"]
        assert data == ["Cocoa", "Coffee", "Vanilla", "Cacao Criollo (Perú) 🍫"]

    def test_get_or_create_user_profile_idempotent_multiple_calls(
        self, session: Session
    ):
        """Calling get_or_create_user_profile multiple times returns same record without duplicate."""
        user = get_or_create_test_user(
            session=session,
            email="idempotent_profile@test.org",
            fullname="Idempotent Learner",
        )
        p1 = crud_profile.get_or_create_user_profile(session=session, user=user)
        p2 = crud_profile.get_or_create_user_profile(session=session, user=user)
        p3 = crud_profile.get_or_create_user_profile(session=session, user=user)

        assert p1.id == p2.id == p3.id
        all_profiles = (
            session.query(UserProfile)
            .filter(UserProfile.user_id == user.id)
            .all()
        )
        assert len(all_profiles) == 1

    @pytest.mark.asyncio
    async def test_profile_endpoints_auth_header_permutations(
        self, app: FastAPI, client: AsyncClient
    ):
        """Malformed authorization header variations return 401/403."""
        malformed = [
            {"Authorization": "Bearer"},
            {"Authorization": "Bearer "},
            {"Authorization": "Basic dGVzdDp0ZXN0"},
            {"Authorization": "Token xyz"},
            {"Authorization": ""},
        ]
        for h in malformed:
            res_get = await client.get(app.url_path_for("academy:get_profile"), headers=h)
            assert res_get.status_code in (401, 403)

            res_put = await client.put(
                app.url_path_for("academy:update_profile"),
                json={"first_name": "Test"},
                headers=h,
            )
            assert res_put.status_code in (401, 403)

    @pytest.mark.asyncio
    async def test_profile_endpoints_reject_valid_jwt_with_deleted_user(
        self, app: FastAPI, client: AsyncClient
    ):
        """Valid JWT containing email that does not exist in DB returns 401."""
        ghost_token = create_access_token(data={"email": "non_existent_ghost_profile@test.org"})
        headers = {"Authorization": f"Bearer {ghost_token}"}

        res_get = await client.get(app.url_path_for("academy:get_profile"), headers=headers)
        assert res_get.status_code in (401, 403)

        res_put = await client.put(
            app.url_path_for("academy:update_profile"),
            json={"first_name": "Test"},
            headers=headers,
        )
        assert res_put.status_code in (401, 403)

import pytest
from httpx import AsyncClient
from fastapi import FastAPI
from sqlalchemy.orm import Session

from models.user import User, UserRole, ToolType
from models.user_profile import UserProfile
from models.company import Company
from models.organisation import Organisation
from middleware import get_password_hash


@pytest.fixture
def test_company(session: Session) -> Company:
    company = session.query(Company).first()
    if not company:
        company = Company(id=None, name="Default Test Enterprise")
        session.add(company)
        session.commit()
        session.refresh(company)
    return company


@pytest.fixture
def test_organisation(session: Session) -> Organisation:
    org = session.query(Organisation).first()
    if not org:
        org = Organisation(id=1, name="IDH")
        session.add(org)
        session.commit()
        session.refresh(org)
    return org


@pytest.fixture
def admin_user(session: Session, test_organisation: Organisation) -> User:
    email = "admin_getting_account@example.com"
    user = session.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            organisation=test_organisation.id,
            fullname="Admin Account Manager",
            email=email,
            password=get_password_hash("AdminPass123!"),
            role=UserRole.admin,
            is_active=1,
            tools=[ToolType.idc.value, ToolType.academy.value],
        )
        session.add(user)
        session.commit()
        session.refresh(user)
    return user


@pytest.fixture
def academy_only_user(session: Session, test_organisation: Organisation) -> User:
    email = "academy_learner@coop.org"
    user = session.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            organisation=test_organisation.id,
            fullname="Jane Learner",
            email=email,
            password=get_password_hash("LearnerPass123!"),
            role=UserRole.user,
            is_active=1,
            tools=[ToolType.academy.value],
        )
        session.add(user)
        session.commit()
        session.refresh(user)

    profile = session.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    if not profile:
        profile = UserProfile(
            user_id=user.id,
            first_name="Jane",
            last_name="Learner",
            company_name="Learner Farming Coop",
            company_type="Cooperative",
            sector="Agriculture",
            commodities=["Cocoa", "Coffee"],
        )
        session.add(profile)
        session.commit()
        session.refresh(profile)
    return user


class TestGettingAnAccountBackend:
    @pytest.mark.asyncio
    async def test_register_academy_with_full_profile_fields(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
    ) -> None:
        email = "new_learner_profile@example.com"
        # Cleanup
        existing = session.query(User).filter(User.email == email).first()
        if existing:
            session.delete(existing)
            session.commit()

        payload = {
            "first_name": "Alice",
            "last_name": "Smith",
            "email": email,
            "password": "Password123!",
            "company_name": "Green Earth Org",
            "company_type": "NGO",
            "sector": "Agribusiness",
            "region_name": "West Africa",
            "commodities": ["Cocoa", "Palm Oil"],
        }

        res = await client.post(
            app.url_path_for("user:register_academy"),
            json=payload,
        )
        assert res.status_code == 201
        data = res.json()
        assert "Registration successful" in data["message"]

        # Verify DB records
        created_user = session.query(User).filter(User.email == email).first()
        assert created_user is not None
        assert created_user.fullname == "Alice Smith"
        assert created_user.is_active == 0
        assert created_user.tools == [ToolType.academy.value]
        assert created_user.invitation_id is not None

        profile = (
            session.query(UserProfile)
            .filter(UserProfile.user_id == created_user.id)
            .first()
        )
        assert profile is not None
        assert profile.first_name == "Alice"
        assert profile.last_name == "Smith"
        assert profile.company_name == "Green Earth Org"
        assert profile.company_type == "NGO"
        assert profile.sector == "Agribusiness"
        assert profile.region_name == "West Africa"
        assert profile.commodities == ["Cocoa", "Palm Oil"]

    @pytest.mark.asyncio
    async def test_resend_verification_endpoints_dry_alias(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        test_organisation: Organisation,
    ) -> None:
        email = "unverified_user@example.com"
        existing = session.query(User).filter(User.email == email).first()
        if existing:
            session.delete(existing)
            session.commit()

        user = User(
            organisation=test_organisation.id,
            fullname="Unverified User",
            email=email,
            password=get_password_hash("Password123!"),
            role=UserRole.user,
            is_active=0,
            invitation_id="old_token_123",
            tools=[ToolType.academy.value],
        )
        session.add(user)
        session.commit()

        # Test new /user/resend-verification endpoint
        res1 = await client.post(
            app.url_path_for("user:resend_verification"),
            json={"email": email},
        )
        assert res1.status_code == 200
        assert "Verification link has been resent" in res1.json()["message"]

        # Test backward-compatible /user/resend-academy-verification endpoint
        res2 = await client.post(
            app.url_path_for("user:resend_academy_verification"),
            json={"email": email},
        )
        assert res2.status_code == 200
        assert "Verification link has been resent" in res2.json()["message"]

    @pytest.mark.asyncio
    async def test_check_academy_email(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        admin_user: User,
        academy_only_user: User,
    ) -> None:
        login_res = await client.post(
            app.url_path_for("user:login"),
            data={
                "username": admin_user.email,
                "password": "AdminPass123!",
            },
        )
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Case 1: Existing Academy user
        res1 = await client.get(
            app.url_path_for("user:check_academy_email"),
            params={"email": academy_only_user.email},
            headers=headers,
        )
        assert res1.status_code == 200
        data1 = res1.json()
        assert data1["exists"] is True
        assert data1["is_academy_user"] is True
        assert data1["has_idc_access"] is False
        assert data1["user_id"] == academy_only_user.id
        assert data1["fullname"] == "Jane Learner"
        assert data1["academy_company"] == "Learner Farming Coop"

        # Case 2: Non-existent email
        res2 = await client.get(
            app.url_path_for("user:check_academy_email"),
            params={"email": "non_existent_user@example.com"},
            headers=headers,
        )
        assert res2.status_code == 200
        data2 = res2.json()
        assert data2["exists"] is False
        assert data2["is_academy_user"] is False
        assert data2["has_idc_access"] is False
        assert data2["user_id"] is None

    @pytest.mark.asyncio
    async def test_grant_idc_access_to_existing_academy_user(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        admin_user: User,
        academy_only_user: User,
        test_company: Company,
    ) -> None:
        login_res = await client.post(
            app.url_path_for("user:login"),
            data={
                "username": admin_user.email,
                "password": "AdminPass123!",
            },
        )
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        payload = {
            "company_id": test_company.id,
            "user_type": "external_regular",
            "role": "user",
        }

        res = await client.post(
            f"{app.url_path_for('user:grant_idc_access')}?user_id={academy_only_user.id}",
            json=payload,
            headers=headers,
        )
        assert res.status_code == 200
        user_info = res.json()
        assert user_info["id"] == academy_only_user.id
        assert "academy" in user_info["tools"]
        assert "idc" in user_info["tools"]
        assert user_info["company"] == test_company.id

        session.refresh(academy_only_user)
        assert ToolType.idc.value in academy_only_user.tools
        assert ToolType.academy.value in academy_only_user.tools
        assert academy_only_user.company == test_company.id
        assert academy_only_user.is_active == 1

    @pytest.mark.asyncio
    async def test_complete_invitation_with_full_profile(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        test_organisation: Organisation,
        test_company: Company,
    ) -> None:
        invitation_token = "test_invite_token_999"
        email = "invited_partner@example.com"

        existing = session.query(User).filter(User.email == email).first()
        if existing:
            session.delete(existing)
            session.commit()

        user = User(
            organisation=test_organisation.id,
            fullname="Temporary Name",
            email=email,
            role=UserRole.user,
            company=test_company.id,
            is_active=0,
            invitation_id=invitation_token,
            tools=[ToolType.idc.value, ToolType.academy.value],
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        payload = {
            "password": "NewSecurePassword123!",
            "first_name": "Marcus",
            "last_name": "Aurelius",
            "company_name": test_company.name,
            "company_type": "Private Sector",
            "sector": "Commodities & Trade",
            "region_name": "Global",
            "commodities": ["Coffee", "Tea"],
        }

        res = await client.post(
            f"/user/complete-invitation/{invitation_token}",
            json=payload,
        )
        assert res.status_code == 200
        data = res.json()
        assert "access_token" in data
        assert data["user"]["fullname"] == "Marcus Aurelius"
        assert "idc" in data["user"]["tools"]
        assert "academy" in data["user"]["tools"]

        session.refresh(user)
        assert user.is_active == 1
        assert user.invitation_id is None
        assert user.fullname == "Marcus Aurelius"

        profile = (
            session.query(UserProfile).filter(UserProfile.user_id == user.id).first()
        )
        assert profile is not None
        assert profile.first_name == "Marcus"
        assert profile.last_name == "Aurelius"
        assert profile.company_type == "Private Sector"
        assert profile.sector == "Commodities & Trade"
        assert profile.commodities == ["Coffee", "Tea"]

import os
import sys
from typing import Generator

import pytest
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy import text
from sqlalchemy.orm import Session

from db.academy.crud_profile import get_or_create_user_profile
from db.crud_organisation import default_organisation
from middleware import generate_user_token, get_password_hash
from models.company import Company
from models.user import ToolType, User, UserRole
from models.user_profile import UserProfile

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

CLIENT_ID = os.environ.get("CLIENT_ID", "")
CLIENT_SECRET = os.environ.get("CLIENT_SECRET", "")


@pytest.fixture
def clean_user_profile(session: Session) -> Generator:
    created_user_ids = []
    created_profile_ids = []
    created_company_ids = []

    def _track(
        user_id: int = None,
        profile_id: int = None,
        company_id: int = None,
    ):
        if user_id and user_id not in created_user_ids:
            created_user_ids.append(user_id)
        if profile_id and profile_id not in created_profile_ids:
            created_profile_ids.append(profile_id)
        if company_id and company_id not in created_company_ids:
            created_company_ids.append(company_id)

    yield _track

    # 1. Delete test profiles, users, and companies in reverse FK order
    for pid in reversed(created_profile_ids):
        p = session.query(UserProfile).filter(UserProfile.id == pid).first()
        if p:
            session.delete(p)

    for uid in reversed(created_user_ids):
        profiles = (
            session.query(UserProfile)
            .filter(UserProfile.user_id == uid)
            .all()
        )
        for p in profiles:
            session.delete(p)
        u = session.query(User).filter(User.id == uid).first()
        if u:
            session.delete(u)

    for cid in reversed(created_company_ids):
        c = session.query(Company).filter(Company.id == cid).first()
        if c:
            session.delete(c)

    session.commit()

    # 2. Sequence Isolation: Reset PostgreSQL sequence counters
    session.execute(
        text(
            "SELECT setval('user_id_seq', "
            "(SELECT COALESCE(MAX(id), 1) FROM \"user\"))"
        )
    )
    session.execute(
        text(
            "SELECT setval('user_profile_id_seq', "
            "(SELECT COALESCE(MAX(id), 1) FROM user_profile))"
        )
    )
    session.execute(
        text(
            "SELECT setval('company_id_seq', "
            "(SELECT COALESCE(MAX(id), 1) FROM company))"
        )
    )
    session.commit()


class TestUserProfileEndpoints:
    @pytest.mark.asyncio
    async def test_unauthenticated_profile_endpoints_return_403(
        self,
        app: FastAPI,
        client: AsyncClient,
    ) -> None:
        """Unauthenticated access to profile management must be forbidden."""
        res_put = await client.put(
            "/user/profile",
            json={"fullname": "Anonymous User"},
        )
        assert res_put.status_code == 403

        res_pwd = await client.post(
            "/user/change-password",
            json={
                "current_password": "OldPassword123!",
                "new_password": "NewPassword123!",
            },
        )
        assert res_pwd.status_code == 403

    @pytest.mark.asyncio
    async def test_get_user_me_company_name_resolution(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        clean_user_profile,
    ) -> None:
        """GET /user/me returns company_name from Company for IDC user

        and from UserProfile for Academy-only user.
        """
        def_org = default_organisation(session=session, name="IDH")
        org_id = def_org.id if def_org else None

        # 1. IDC user linked to Company
        test_company = Company(id=None, name="IDH Agricultural Cooperative")
        session.add(test_company)
        session.commit()
        session.refresh(test_company)
        clean_user_profile(company_id=test_company.id)

        idc_user = User(
            fullname="IDC Lead Specialist",
            email="idc.specialist@example.com",
            password=get_password_hash("TestPassword123!"),
            role=UserRole.user,
            organisation=org_id,
            company=test_company.id,
            is_active=1,
            tools=[ToolType.idc.value],
        )
        session.add(idc_user)
        session.commit()
        session.refresh(idc_user)
        clean_user_profile(user_id=idc_user.id)

        idc_token = generate_user_token(idc_user)
        res_idc = await client.get(
            app.url_path_for("user:me"),
            headers={"Authorization": f"Bearer {idc_token}"},
        )
        assert res_idc.status_code == 200
        idc_data = res_idc.json()
        assert idc_data["company"] == test_company.id
        assert idc_data["company_name"] == "IDH Agricultural Cooperative"

        # 2. Academy-only user with UserProfile company_name
        academy_user = User(
            fullname="Academy Learner",
            email="academy.learner@example.com",
            password=get_password_hash("TestPassword123!"),
            role=UserRole.user,
            organisation=org_id,
            company=None,
            is_active=1,
            tools=[ToolType.academy.value],
        )
        session.add(academy_user)
        session.commit()
        session.refresh(academy_user)
        clean_user_profile(user_id=academy_user.id)

        profile = get_or_create_user_profile(session=session, user=academy_user)
        profile.company_name = "Sustainable Earth Foundation"
        session.commit()
        clean_user_profile(profile_id=profile.id)

        academy_token = generate_user_token(academy_user)
        res_academy = await client.get(
            app.url_path_for("user:me"),
            headers={"Authorization": f"Bearer {academy_token}"},
        )
        assert res_academy.status_code == 200
        academy_data = res_academy.json()
        assert academy_data["company"] is None
        assert academy_data["company_name"] == "Sustainable Earth Foundation"

        # 3. User with no company and no profile company_name
        standalone_user = User(
            fullname="Solo Explorer",
            email="solo.explorer@example.com",
            password=get_password_hash("TestPassword123!"),
            role=UserRole.user,
            organisation=org_id,
            company=None,
            is_active=1,
            tools=[ToolType.academy.value],
        )
        session.add(standalone_user)
        session.commit()
        session.refresh(standalone_user)
        clean_user_profile(user_id=standalone_user.id)

        standalone_token = generate_user_token(standalone_user)
        res_standalone = await client.get(
            app.url_path_for("user:me"),
            headers={"Authorization": f"Bearer {standalone_token}"},
        )
        assert res_standalone.status_code == 200
        standalone_data = res_standalone.json()
        assert standalone_data.get("company_name") is None

    @pytest.mark.asyncio
    async def test_put_user_profile_academy_user_success(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        clean_user_profile,
    ) -> None:
        """PUT /user/profile updates fullname and user_profile.company_name

        for Academy user and synchronizes first_name/last_name.
        """
        def_org = default_organisation(session=session, name="IDH")
        org_id = def_org.id if def_org else None

        user = User(
            fullname="Maya Lin",
            email="maya.lin.academy@example.com",
            password=get_password_hash("TestPassword123!"),
            role=UserRole.user,
            organisation=org_id,
            company=None,
            is_active=1,
            tools=[ToolType.academy.value],
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        clean_user_profile(user_id=user.id)

        profile = get_or_create_user_profile(session=session, user=user)
        clean_user_profile(profile_id=profile.id)

        token = generate_user_token(user)
        update_payload = {
            "fullname": "Maya Lin Architect",
            "company_name": "Agroforestry Innovations Ltd",
        }

        res = await client.put(
            "/user/profile",
            headers={"Authorization": f"Bearer {token}"},
            json=update_payload,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["fullname"] == "Maya Lin Architect"
        assert data["company_name"] == "Agroforestry Innovations Ltd"

        # Verify DB persistence
        session.refresh(user)
        session.refresh(profile)
        assert user.fullname == "Maya Lin Architect"
        assert profile.company_name == "Agroforestry Innovations Ltd"
        assert profile.first_name == "Maya"
        assert profile.last_name == "Lin Architect"

    @pytest.mark.asyncio
    async def test_put_user_profile_idc_user_ignores_company_name(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        clean_user_profile,
    ) -> None:
        """PUT /user/profile for IDC user updates fullname but ignores

        submitted company_name (retains admin-assigned company).
        """
        def_org = default_organisation(session=session, name="IDH")
        org_id = def_org.id if def_org else None

        company = Company(id=None, name="Official Palm Oil Supply Chain")
        session.add(company)
        session.commit()
        session.refresh(company)
        clean_user_profile(company_id=company.id)

        user = User(
            fullname="Carlos Santos",
            email="carlos.idc@example.com",
            password=get_password_hash("TestPassword123!"),
            role=UserRole.user,
            organisation=org_id,
            company=company.id,
            is_active=1,
            tools=[ToolType.idc.value],
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        clean_user_profile(user_id=user.id)

        token = generate_user_token(user)
        update_payload = {
            "fullname": "Carlos Santos Senior",
            "company_name": "Unauthorized Rogue Company",
        }

        res = await client.put(
            "/user/profile",
            headers={"Authorization": f"Bearer {token}"},
            json=update_payload,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["fullname"] == "Carlos Santos Senior"
        assert data["company_name"] == "Official Palm Oil Supply Chain"

        # Verify DB: company unchanged
        session.refresh(user)
        assert user.fullname == "Carlos Santos Senior"
        assert user.company == company.id

        session.refresh(company)
        assert company.name == "Official Palm Oil Supply Chain"

    @pytest.mark.asyncio
    async def test_put_user_profile_validation_errors(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        clean_user_profile,
    ) -> None:
        """PUT /user/profile validates inputs: 422 on blank fullname,

        422 on weak new_password, 400 on missing or wrong current_password.
        """
        def_org = default_organisation(session=session, name="IDH")
        org_id = def_org.id if def_org else None

        user = User(
            fullname="Validation Tester",
            email="validation.tester@example.com",
            password=get_password_hash("CurrentPassword123!"),
            role=UserRole.user,
            organisation=org_id,
            company=None,
            is_active=1,
            tools=[ToolType.academy.value],
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        clean_user_profile(user_id=user.id)

        token = generate_user_token(user)
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Blank fullname -> 422
        res_blank = await client.put(
            "/user/profile",
            headers=headers,
            json={"fullname": "   "},
        )
        assert res_blank.status_code == 422

        # 2. Weak new_password -> 422
        res_weak = await client.put(
            "/user/profile",
            headers=headers,
            json={
                "fullname": "Valid Name",
                "new_password": "weak",
                "current_password": "CurrentPassword123!",
            },
        )
        assert res_weak.status_code == 422

        # 3. New password provided but missing current_password -> 400
        res_missing_curr = await client.put(
            "/user/profile",
            headers=headers,
            json={
                "fullname": "Valid Name",
                "new_password": "NewStrongPassword123!",
            },
        )
        assert res_missing_curr.status_code == 400

        # 4. New password provided with wrong current_password -> 400
        res_wrong_curr = await client.put(
            "/user/profile",
            headers=headers,
            json={
                "fullname": "Valid Name",
                "current_password": "WrongPassword!",
                "new_password": "NewStrongPassword123!",
            },
        )
        assert res_wrong_curr.status_code == 400

    @pytest.mark.asyncio
    async def test_post_change_password_and_login_verification(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        clean_user_profile,
    ) -> None:
        """POST /user/change-password validates complexity (422), rejects

        wrong current password (400), succeeds (200), and verifies that
        subsequent login succeeds with new password and fails with old password.
        """
        def_org = default_organisation(session=session, name="IDH")
        org_id = def_org.id if def_org else None

        user = User(
            fullname="Security Learner",
            email="security.learner@example.com",
            password=get_password_hash("InitialPassword123!"),
            role=UserRole.user,
            organisation=org_id,
            company=None,
            is_active=1,
            tools=[ToolType.academy.value],
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        clean_user_profile(user_id=user.id)

        token = generate_user_token(user)
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Weak password -> 422
        res_weak = await client.post(
            "/user/change-password",
            headers=headers,
            json={
                "current_password": "InitialPassword123!",
                "new_password": "short",
            },
        )
        assert res_weak.status_code == 422

        # 2. Missing special character -> 422
        res_no_sym = await client.post(
            "/user/change-password",
            headers=headers,
            json={
                "current_password": "InitialPassword123!",
                "new_password": "NoSpecialCharacter123",
            },
        )
        assert res_no_sym.status_code == 422

        # 3. Wrong current password -> 400
        res_wrong = await client.post(
            "/user/change-password",
            headers=headers,
            json={
                "current_password": "WrongInitialPass!",
                "new_password": "ValidNewPassword123!",
            },
        )
        assert res_wrong.status_code == 400

        # 4. Valid current + new password -> 200
        res_success = await client.post(
            "/user/change-password",
            headers=headers,
            json={
                "current_password": "InitialPassword123!",
                "new_password": "ValidNewPassword123!",
            },
        )
        assert res_success.status_code == 200
        assert "message" in res_success.json()
        assert "Password changed successfully" in res_success.json()["message"]

        # 5. Verify old password no longer works for login -> 401
        res_old_login = await client.post(
            app.url_path_for("user:login"),
            headers={"content-type": "application/x-www-form-urlencoded"},
            data={
                "username": "security.learner@example.com",
                "password": "InitialPassword123!",
                "grant_type": "password",
                "scopes": ["openid", "email"],
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
            },
        )
        assert res_old_login.status_code == 401

        # 6. Verify new password works for login -> 200 with access_token
        res_new_login = await client.post(
            app.url_path_for("user:login"),
            headers={"content-type": "application/x-www-form-urlencoded"},
            data={
                "username": "security.learner@example.com",
                "password": "ValidNewPassword123!",
                "grant_type": "password",
                "scopes": ["openid", "email"],
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
            },
        )
        assert res_new_login.status_code == 200
        login_data = res_new_login.json()
        assert "access_token" in login_data
        assert login_data["user"]["email"] == "security.learner@example.com"

    @pytest.mark.asyncio
    async def test_put_user_profile_password_error_is_atomic(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        clean_user_profile,
    ) -> None:
        """PUT /user/profile does not commit partial profile changes when

        new_password validation fails due to missing or incorrect
        current_password.
        """
        def_org = default_organisation(session=session, name="IDH")
        org_id = def_org.id if def_org else None

        user = User(
            fullname="Original Learner",
            email="atomic.learner@example.com",
            password=get_password_hash("InitialPassword123!"),
            role=UserRole.user,
            organisation=org_id,
            company=None,
            is_active=1,
            tools=[ToolType.academy.value],
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        clean_user_profile(user_id=user.id)

        profile = get_or_create_user_profile(session=session, user=user)
        profile.company_name = "Original Org"
        session.add(profile)
        session.commit()
        clean_user_profile(profile_id=profile.id)

        token = generate_user_token(user)
        res = await client.put(
            "/user/profile",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "fullname": "Mutated Learner",
                "company_name": "Mutated Org",
                "current_password": "WrongPassword123!",
                "new_password": "NewValidPassword123!",
            },
        )
        assert res.status_code == 400

        session.expire_all()
        reloaded_user = (
            session.query(User).filter(User.id == user.id).first()
        )
        reloaded_profile = (
            session.query(UserProfile)
            .filter(UserProfile.id == profile.id)
            .first()
        )
        assert reloaded_user.fullname == "Original Learner"
        assert reloaded_profile.company_name == "Original Org"

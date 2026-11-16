import os
import sys
from typing import Generator

import pytest
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy import text
from sqlalchemy.orm import Session

from db.crud_organisation import default_organisation
from middleware import generate_user_token, get_password_hash
from models.company import Company
from models.user import ToolType, User, UserRole, UserType
from models.user_profile import UserProfile
from utils.mailer import Email

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)


@pytest.fixture
def clean_invitation_dedup(session: Session) -> Generator:
    """Hermetic fixture tracking and cleaning created test entities."""
    created_user_ids = []
    created_company_ids = []
    created_profile_ids = []

    def _track(
        user_id: int = None,
        company_id: int = None,
        profile_id: int = None,
    ):
        if user_id and user_id not in created_user_ids:
            created_user_ids.append(user_id)
        if company_id and company_id not in created_company_ids:
            created_company_ids.append(company_id)
        if profile_id and profile_id not in created_profile_ids:
            created_profile_ids.append(profile_id)

    yield _track

    # Clean profiles, users, companies in reverse dependency order
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

    # Sequence Isolation: Reset PostgreSQL sequence counters cleanly
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


def _create_test_user(
    session: Session,
    clean_tracker,
    email: str,
    fullname: str,
    role: UserRole = UserRole.user,
    tools=None,
    company_id: int = None,
    is_active: int = 1,
    user_type: UserType = None,
) -> User:
    """Helper creating a test user with tracked lifecycle."""
    def_org = default_organisation(session=session, name="IDH")
    org_id = def_org.id if def_org else None

    user = User(
        fullname=fullname,
        email=email,
        password=get_password_hash("TestPassword123!"),
        role=role,
        organisation=org_id,
        company=company_id,
        is_active=is_active,
        tools=tools if tools is not None else [ToolType.idc.value],
    )
    if user_type is not None:
        user.user_type = user_type
    session.add(user)
    session.commit()
    session.refresh(user)
    clean_tracker(user_id=user.id)
    return user


def _create_test_company(
    session: Session,
    clean_tracker,
    name: str = "Test Partner Co",
) -> Company:
    """Helper creating a test company with tracked lifecycle."""
    comp = Company(id=None, name=name)
    session.add(comp)
    session.commit()
    session.refresh(comp)
    clean_tracker(company_id=comp.id)
    return comp


def _create_test_profile(
    session: Session,
    clean_tracker,
    user_id: int,
    company_name: str = "Acme Academy",
) -> UserProfile:
    """Helper creating a test user profile with tracked lifecycle."""
    profile = UserProfile(
        user_id=user_id,
        company_name=company_name,
    )
    session.add(profile)
    session.commit()
    session.refresh(profile)
    clean_tracker(profile_id=profile.id)
    return profile


class TestAdminInvitationDeduplication:
    """Test suite covering [TLSA-008] Admin invitation deduplication."""

    @pytest.mark.asyncio
    async def test_invite_existing_academy_user_returns_409_with_metadata(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        clean_invitation_dedup,
    ) -> None:
        """Admin inviting an Academy user returns 409 with structured info."""
        admin = _create_test_user(
            session=session,
            clean_tracker=clean_invitation_dedup,
            email="admin.dedup.meta@example.com",
            fullname="Admin Dedup Tester",
            role=UserRole.admin,
            tools=[ToolType.idc.value],
        )
        academy_user = _create_test_user(
            session=session,
            clean_tracker=clean_invitation_dedup,
            email="existing.academy.meta@example.com",
            fullname="Jane Academy",
            role=UserRole.user,
            tools=[ToolType.academy.value],
        )
        _create_test_profile(
            session=session,
            clean_tracker=clean_invitation_dedup,
            user_id=academy_user.id,
            company_name="Acme Academy",
        )
        company = _create_test_company(
            session=session,
            clean_tracker=clean_invitation_dedup,
            name="Target IDC Co",
        )

        admin_token = generate_user_token(admin)
        payload = {
            "fullname": "Jane Academy Invited",
            "email": "existing.academy.meta@example.com",
            "role": UserRole.user.value,
            "user_type": UserType.external_regular.value,
            "all_cases": "false",
            "company": str(company.id),
        }
        res = await client.post(
            "/user/register?invitation_id=true",
            data=payload,
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert res.status_code == 409
        data = res.json()
        assert "detail" in data
        detail = data["detail"]
        assert isinstance(detail, dict)
        assert detail["is_academy_user"] is True
        assert detail["user_id"] == academy_user.id
        assert detail["fullname"] == academy_user.fullname
        assert detail["email"] == academy_user.email
        assert detail["academy_company"] == "Acme Academy"

    @pytest.mark.asyncio
    async def test_invite_existing_academy_user_without_profile_returns_409_none_company(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        clean_invitation_dedup,
    ) -> None:
        """Academy user without UserProfile returns 409 with company=None."""
        admin = _create_test_user(
            session=session,
            clean_tracker=clean_invitation_dedup,
            email="admin.dedup.noprofile@example.com",
            fullname="Admin NoProfile Tester",
            role=UserRole.admin,
            tools=[ToolType.idc.value],
        )
        academy_user = _create_test_user(
            session=session,
            clean_tracker=clean_invitation_dedup,
            email="existing.academy.noprofile@example.com",
            fullname="John Academy NoProfile",
            role=UserRole.user,
            tools=[ToolType.academy.value],
        )
        company = _create_test_company(
            session=session,
            clean_tracker=clean_invitation_dedup,
            name="Target Co NoProfile",
        )

        admin_token = generate_user_token(admin)
        payload = {
            "fullname": "John Academy NoProfile",
            "email": "existing.academy.noprofile@example.com",
            "role": UserRole.user.value,
            "user_type": UserType.external_regular.value,
            "all_cases": "false",
            "company": str(company.id),
        }
        res = await client.post(
            "/user/register?invitation_id=true",
            data=payload,
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert res.status_code == 409
        data = res.json()
        assert "detail" in data
        detail = data["detail"]
        assert isinstance(detail, dict)
        assert detail["is_academy_user"] is True
        assert detail["user_id"] == academy_user.id
        assert detail["fullname"] == academy_user.fullname
        assert detail["email"] == academy_user.email
        assert detail["academy_company"] is None

    @pytest.mark.asyncio
    async def test_invite_existing_idc_user_returns_409_string_detail(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        clean_invitation_dedup,
    ) -> None:
        """Inviting existing IDC user returns 409 with plain string detail."""
        admin = _create_test_user(
            session=session,
            clean_tracker=clean_invitation_dedup,
            email="admin.dedup.idc@example.com",
            fullname="Admin IDC Dedup Tester",
            role=UserRole.admin,
            tools=[ToolType.idc.value],
        )
        idc_only_user = _create_test_user(
            session=session,
            clean_tracker=clean_invitation_dedup,
            email="existing.idc.only@example.com",
            fullname="Bob IDC Only",
            role=UserRole.user,
            tools=[ToolType.idc.value],
        )
        both_tools_user = _create_test_user(
            session=session,
            clean_tracker=clean_invitation_dedup,
            email="existing.both.tools@example.com",
            fullname="Charlie Both Tools",
            role=UserRole.user,
            tools=[ToolType.academy.value, ToolType.idc.value],
        )
        company = _create_test_company(
            session=session,
            clean_tracker=clean_invitation_dedup,
            name="Existing IDC Check Co",
        )

        admin_token = generate_user_token(admin)

        # 1. Invite IDC-only user
        payload1 = {
            "fullname": "Bob IDC Only Invited",
            "email": idc_only_user.email,
            "role": UserRole.user.value,
            "user_type": UserType.external_regular.value,
            "all_cases": "false",
            "company": str(company.id),
        }
        res1 = await client.post(
            "/user/register?invitation_id=true",
            data=payload1,
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert res1.status_code == 409
        data1 = res1.json()
        assert isinstance(data1["detail"], str)
        assert "already exist" in data1["detail"].lower()

        # 2. Invite user with both academy and idc tools
        payload2 = {
            "fullname": "Charlie Both Tools Invited",
            "email": both_tools_user.email,
            "role": UserRole.user.value,
            "user_type": UserType.external_regular.value,
            "all_cases": "false",
            "company": str(company.id),
        }
        res2 = await client.post(
            "/user/register?invitation_id=true",
            data=payload2,
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert res2.status_code == 409
        data2 = res2.json()
        assert isinstance(data2["detail"], str)
        assert "already exist" in data2["detail"].lower()

    @pytest.mark.asyncio
    async def test_invite_non_admin_returns_403(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        clean_invitation_dedup,
    ) -> None:
        """Regular user calling POST /user/register?invitation_id=true gets 403."""
        regular_user = _create_test_user(
            session=session,
            clean_tracker=clean_invitation_dedup,
            email="regular.attempt.invite@example.com",
            fullname="Regular Inviter",
            role=UserRole.user,
            tools=[ToolType.idc.value],
        )
        company = _create_test_company(
            session=session,
            clean_tracker=clean_invitation_dedup,
            name="Some Co",
        )

        user_token = generate_user_token(regular_user)
        payload = {
            "fullname": "Target User",
            "email": "target.invited@example.com",
            "role": UserRole.user.value,
            "user_type": UserType.external_regular.value,
            "all_cases": "false",
            "company": str(company.id),
        }
        res = await client.post(
            "/user/register?invitation_id=true",
            data=payload,
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert res.status_code == 403

    @pytest.mark.asyncio
    async def test_invite_conflict_then_grant_idc_links_without_duplicate(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        clean_invitation_dedup,
        monkeypatch,
    ) -> None:
        """Admin conflict flow links IDC access without creating duplicate user."""
        monkeypatch.setattr(Email, "send", property(lambda self: True))

        admin = _create_test_user(
            session=session,
            clean_tracker=clean_invitation_dedup,
            email="admin.flow.dedup@example.com",
            fullname="Admin Flow Tester",
            role=UserRole.admin,
            tools=[ToolType.idc.value],
        )
        academy_user = _create_test_user(
            session=session,
            clean_tracker=clean_invitation_dedup,
            email="flow.academy.dedup@example.com",
            fullname="Flow Academy User",
            role=UserRole.user,
            tools=[ToolType.academy.value],
        )
        _create_test_profile(
            session=session,
            clean_tracker=clean_invitation_dedup,
            user_id=academy_user.id,
            company_name="Flow Academy Corp",
        )
        target_company = _create_test_company(
            session=session,
            clean_tracker=clean_invitation_dedup,
            name="Agro Link Corp",
        )

        admin_token = generate_user_token(admin)

        # Step 1: Admin invites the user -> gets 409 conflict with user_id
        payload = {
            "fullname": "Flow Academy User",
            "email": "flow.academy.dedup@example.com",
            "role": UserRole.user.value,
            "user_type": UserType.external_regular.value,
            "all_cases": "false",
            "company": str(target_company.id),
        }
        invite_res = await client.post(
            "/user/register?invitation_id=true",
            data=payload,
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert invite_res.status_code == 409
        conflict_data = invite_res.json()["detail"]
        assert isinstance(conflict_data, dict)
        assert conflict_data["is_academy_user"] is True
        assert conflict_data["user_id"] == academy_user.id
        target_user_id = conflict_data["user_id"]

        # Step 2: Admin calls grant-idc with target company and user_type
        grant_res = await client.post(
            f"/user/{target_user_id}/grant-idc",
            json={
                "company_id": target_company.id,
                "user_type": "external_regular",
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert grant_res.status_code == 200
        grant_data = grant_res.json()
        assert ToolType.idc.value in grant_data["tools"]
        assert ToolType.academy.value in grant_data["tools"]
        assert grant_data["company"] == target_company.id

        # Step 3: Verify DB state - user has idc tool, company link, and NO duplicate
        session.refresh(academy_user)
        assert ToolType.idc.value in academy_user.tools
        assert ToolType.academy.value in academy_user.tools
        assert academy_user.company == target_company.id
        assert academy_user.user_type == UserType.external_regular

        total_users = (
            session.query(User)
            .filter(User.email == "flow.academy.dedup@example.com")
            .count()
        )
        assert total_users == 1

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
from utils.mailer import Email, MailTypeEnum

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)


@pytest.fixture
def clean_admin_tool_access(session: Session) -> Generator:
    """Hermetic fixture tracking and cleaning created test entities."""
    created_user_ids = []
    created_company_ids = []
    created_profile_ids = []
    created_case_ids = []
    created_country_ids = []
    created_commodity_ids = []

    def _track(
        user_id: int = None,
        company_id: int = None,
        profile_id: int = None,
        case_id: int = None,
        country_id: int = None,
        commodity_id: int = None,
    ):
        if user_id and user_id not in created_user_ids:
            created_user_ids.append(user_id)
        if company_id and company_id not in created_company_ids:
            created_company_ids.append(company_id)
        if profile_id and profile_id not in created_profile_ids:
            created_profile_ids.append(profile_id)
        if case_id and case_id not in created_case_ids:
            created_case_ids.append(case_id)
        if country_id and country_id not in created_country_ids:
            created_country_ids.append(country_id)
        if commodity_id and commodity_id not in created_commodity_ids:
            created_commodity_ids.append(commodity_id)

    yield _track

    # 1. Clean cases, profiles, users, companies, commodities, countries in reverse dependency order
    for cid in reversed(created_case_ids):
        from models.case import Case
        case = session.query(Case).filter(Case.id == cid).first()
        if case:
            session.delete(case)
    session.commit()

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

    for com_id in reversed(created_commodity_ids):
        from models.commodity import Commodity
        cm = session.query(Commodity).filter(Commodity.id == com_id).first()
        if cm:
            session.delete(cm)

    for cou_id in reversed(created_country_ids):
        from models.country import Country
        co = session.query(Country).filter(Country.id == cou_id).first()
        if co:
            session.delete(co)

    session.commit()

    # 2. Sequence Isolation: Reset PostgreSQL sequence counters cleanly
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


class TestAdminToolAccessEndpoints:
    """Test suite covering tool access filtering and IDC access granting."""

    @pytest.mark.asyncio
    async def test_get_users_filter_by_tool_academy(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        clean_admin_tool_access,
    ) -> None:
        """GET /user?tool=academy returns only users having academy access."""
        admin = _create_test_user(
            session=session,
            clean_tracker=clean_admin_tool_access,
            email="admin.tools.filter@example.com",
            fullname="Admin Filter Tester",
            role=UserRole.admin,
            tools=[ToolType.idc.value],
        )
        u_acad = _create_test_user(
            session=session,
            clean_tracker=clean_admin_tool_access,
            email="user.acad.only@example.com",
            fullname="Academy Only User",
            role=UserRole.user,
            tools=[ToolType.academy.value],
        )
        u_idc = _create_test_user(
            session=session,
            clean_tracker=clean_admin_tool_access,
            email="user.idc.only@example.com",
            fullname="IDC Only User",
            role=UserRole.user,
            tools=[ToolType.idc.value],
        )
        u_dual = _create_test_user(
            session=session,
            clean_tracker=clean_admin_tool_access,
            email="user.dual.tools@example.com",
            fullname="Dual Tools User",
            role=UserRole.user,
            tools=[ToolType.idc.value, ToolType.academy.value],
        )

        admin_token = generate_user_token(admin)
        res = await client.get(
            "/user?tool=academy",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert res.status_code == 200
        payload = res.json()
        assert "data" in payload
        assert "total" in payload
        assert "total_page" in payload

        returned_emails = [u["email"] for u in payload["data"]]
        assert u_acad.email in returned_emails
        assert u_dual.email in returned_emails
        assert u_idc.email not in returned_emails

        for u in payload["data"]:
            assert ToolType.academy.value in u.get("tools", [])

    @pytest.mark.asyncio
    async def test_get_users_filter_by_tool_idc(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        clean_admin_tool_access,
    ) -> None:
        """GET /user?tool=idc returns only users having idc access."""
        admin = _create_test_user(
            session=session,
            clean_tracker=clean_admin_tool_access,
            email="admin.idc.filter@example.com",
            fullname="Admin IDC Filter",
            role=UserRole.admin,
            tools=[ToolType.idc.value],
        )
        u_acad = _create_test_user(
            session=session,
            clean_tracker=clean_admin_tool_access,
            email="user.acad.excl@example.com",
            fullname="Academy Excluded User",
            role=UserRole.user,
            tools=[ToolType.academy.value],
        )
        u_idc = _create_test_user(
            session=session,
            clean_tracker=clean_admin_tool_access,
            email="user.idc.incl@example.com",
            fullname="IDC Included User",
            role=UserRole.user,
            tools=[ToolType.idc.value],
        )
        u_dual = _create_test_user(
            session=session,
            clean_tracker=clean_admin_tool_access,
            email="user.dual.incl@example.com",
            fullname="Dual Included User",
            role=UserRole.user,
            tools=[ToolType.idc.value, ToolType.academy.value],
        )

        admin_token = generate_user_token(admin)
        res = await client.get(
            "/user?tool=idc",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert res.status_code == 200
        payload = res.json()

        returned_emails = [u["email"] for u in payload["data"]]
        assert u_idc.email in returned_emails
        assert u_dual.email in returned_emails
        assert u_acad.email not in returned_emails

        for u in payload["data"]:
            assert ToolType.idc.value in u.get("tools", [])

    @pytest.mark.asyncio
    async def test_get_users_filter_by_invalid_tool_returns_422(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        clean_admin_tool_access,
    ) -> None:
        """GET /user?tool=invalid returns 422 Unprocessable Entity."""
        admin = _create_test_user(
            session=session,
            clean_tracker=clean_admin_tool_access,
            email="admin.invalid.tool@example.com",
            fullname="Admin Invalid Tool",
            role=UserRole.admin,
            tools=[ToolType.idc.value],
        )
        admin_token = generate_user_token(admin)
        res = await client.get(
            "/user?tool=unknown_tool_type",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert res.status_code == 422

    @pytest.mark.asyncio
    async def test_get_users_unauthenticated_returns_401_or_403(
        self,
        app: FastAPI,
        client: AsyncClient,
    ) -> None:
        """Unauthenticated request to GET /user must be rejected."""
        res = await client.get("/user?tool=academy")
        assert res.status_code in (401, 403)

    @pytest.mark.asyncio
    async def test_get_users_non_admin_returns_403(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        clean_admin_tool_access,
    ) -> None:
        """Regular non-admin users must be forbidden from GET /user."""
        user = _create_test_user(
            session=session,
            clean_tracker=clean_admin_tool_access,
            email="regular.user.noadmin@example.com",
            fullname="Regular Non-Admin",
            role=UserRole.user,
            tools=[ToolType.idc.value],
        )
        token = generate_user_token(user)
        res = await client.get(
            "/user?tool=academy",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 403

    @pytest.mark.asyncio
    async def test_grant_idc_access_success(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        clean_admin_tool_access,
        monkeypatch,
    ) -> None:
        """Admin grants IDC access with company link and email notification."""
        admin = _create_test_user(
            session=session,
            clean_tracker=clean_admin_tool_access,
            email="admin.grant.idc@example.com",
            fullname="Admin IDC Granter",
            role=UserRole.admin,
            tools=[ToolType.idc.value],
        )
        target_user = _create_test_user(
            session=session,
            clean_tracker=clean_admin_tool_access,
            email="target.grant.idc@example.com",
            fullname="Target Grant User",
            role=UserRole.user,
            tools=[ToolType.academy.value],
            company_id=None,
        )
        company = _create_test_company(
            session=session,
            clean_tracker=clean_admin_tool_access,
            name="Sustainable Cocoa Alliance",
        )

        sent_emails = []

        class MockEmail:
            def __init__(self, recipients, email, **kwargs):
                self.recipients = recipients
                self.email = email
                self.kwargs = kwargs
                sent_emails.append(
                    {
                        "recipients": recipients,
                        "email": email,
                        "kwargs": kwargs,
                    }
                )

            @property
            def send(self) -> bool:
                return True

        monkeypatch.setattr("routes.user.Email", MockEmail)

        admin_token = generate_user_token(admin)
        res = await client.post(
            f"/user/{target_user.id}/grant-idc",
            json={
                "company_id": company.id,
                "user_type": "external_regular",
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert res.status_code == 200
        data = res.json()
        assert ToolType.idc.value in data["tools"]
        assert ToolType.academy.value in data["tools"]
        assert data["company"] == company.id

        session.refresh(target_user)
        assert ToolType.idc.value in target_user.tools
        assert ToolType.academy.value in target_user.tools
        assert target_user.company == company.id
        assert target_user.user_type == UserType.external_regular

        # Verify email notification dispatch
        assert len(sent_emails) == 1
        call = sent_emails[0]
        assert any(
            r.get("Email") == target_user.email for r in call["recipients"]
        )
        expected_mail_enum = getattr(
            MailTypeEnum, "IDC_ACCESS_GRANTED", None
        )
        if expected_mail_enum is not None:
            assert call["email"] == expected_mail_enum
        else:
            assert "IDC_ACCESS_GRANTED" in str(call["email"])

        email_body = call["kwargs"].get("body") or ""
        assert company.name in email_body

    @pytest.mark.asyncio
    async def test_grant_idc_access_by_super_admin(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        clean_admin_tool_access,
        monkeypatch,
    ) -> None:
        """Super Admin can also grant IDC access to a user."""
        super_admin = _create_test_user(
            session=session,
            clean_tracker=clean_admin_tool_access,
            email="superadmin.grant.idc@example.com",
            fullname="Super Admin Granter",
            role=UserRole.super_admin,
            tools=[ToolType.idc.value],
        )
        target_user = _create_test_user(
            session=session,
            clean_tracker=clean_admin_tool_access,
            email="target.superadmin.grant@example.com",
            fullname="Target SuperAdmin Grant",
            role=UserRole.user,
            tools=[ToolType.academy.value],
            company_id=None,
        )
        company = _create_test_company(
            session=session,
            clean_tracker=clean_admin_tool_access,
            name="Agro Forest Network",
        )

        monkeypatch.setattr(Email, "send", property(lambda self: True))

        super_admin_token = generate_user_token(super_admin)
        res = await client.post(
            f"/user/{target_user.id}/grant-idc",
            json={
                "company_id": company.id,
                "user_type": "external_advanced",
            },
            headers={"Authorization": f"Bearer {super_admin_token}"},
        )
        assert res.status_code == 200

        session.refresh(target_user)
        assert ToolType.idc.value in target_user.tools
        assert target_user.company == company.id
        assert target_user.user_type == UserType.external_advanced

    @pytest.mark.asyncio
    async def test_grant_idc_access_idempotent_no_duplicate_idc(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        clean_admin_tool_access,
        monkeypatch,
    ) -> None:
        """Repeated grant updates company without duplicating 'idc' tools."""
        admin = _create_test_user(
            session=session,
            clean_tracker=clean_admin_tool_access,
            email="admin.idempotent@example.com",
            fullname="Admin Idempotent",
            role=UserRole.admin,
            tools=[ToolType.idc.value],
        )
        comp1 = _create_test_company(
            session=session,
            clean_tracker=clean_admin_tool_access,
            name="Primary Company",
        )
        comp2 = _create_test_company(
            session=session,
            clean_tracker=clean_admin_tool_access,
            name="Updated Secondary Company",
        )
        target_user = _create_test_user(
            session=session,
            clean_tracker=clean_admin_tool_access,
            email="target.idempotent@example.com",
            fullname="Target Idempotent",
            role=UserRole.user,
            tools=[ToolType.idc.value, ToolType.academy.value],
            company_id=comp1.id,
        )

        monkeypatch.setattr(Email, "send", property(lambda self: True))

        admin_token = generate_user_token(admin)
        res = await client.post(
            f"/user/{target_user.id}/grant-idc",
            json={"company_id": comp2.id},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert res.status_code == 200

        session.refresh(target_user)
        assert target_user.tools.count(ToolType.idc.value) == 1
        assert ToolType.academy.value in target_user.tools
        assert target_user.company == comp2.id

    @pytest.mark.asyncio
    async def test_grant_idc_access_preserves_admin_role_user_type(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        clean_admin_tool_access,
        monkeypatch,
    ) -> None:
        """Granting IDC to admin user does not force external user_type."""
        admin = _create_test_user(
            session=session,
            clean_tracker=clean_admin_tool_access,
            email="admin.role.preserver@example.com",
            fullname="Admin Preserver",
            role=UserRole.admin,
            tools=[ToolType.idc.value],
        )
        target_admin = _create_test_user(
            session=session,
            clean_tracker=clean_admin_tool_access,
            email="target.admin.recipient@example.com",
            fullname="Target Admin Recipient",
            role=UserRole.admin,
            tools=[ToolType.academy.value],
            company_id=None,
        )
        company = _create_test_company(
            session=session,
            clean_tracker=clean_admin_tool_access,
            name="Global Enterprise",
        )

        monkeypatch.setattr(Email, "send", property(lambda self: True))

        admin_token = generate_user_token(admin)
        res = await client.post(
            f"/user/{target_admin.id}/grant-idc",
            json={
                "company_id": company.id,
                "user_type": "external_regular",
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert res.status_code == 200

        session.refresh(target_admin)
        assert target_admin.role == UserRole.admin
        assert target_admin.company == company.id
        assert ToolType.idc.value in target_admin.tools

    @pytest.mark.asyncio
    async def test_grant_idc_access_non_admin_returns_403(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        clean_admin_tool_access,
    ) -> None:
        """Regular users cannot grant IDC access."""
        reg_user = _create_test_user(
            session=session,
            clean_tracker=clean_admin_tool_access,
            email="reg.caller.forbidden@example.com",
            fullname="Regular Caller",
            role=UserRole.user,
            tools=[ToolType.idc.value],
        )
        target_user = _create_test_user(
            session=session,
            clean_tracker=clean_admin_tool_access,
            email="target.forbidden@example.com",
            fullname="Target Forbidden",
            role=UserRole.user,
            tools=[ToolType.academy.value],
        )
        company = _create_test_company(
            session=session,
            clean_tracker=clean_admin_tool_access,
            name="Any Company",
        )

        token = generate_user_token(reg_user)
        res = await client.post(
            f"/user/{target_user.id}/grant-idc",
            json={"company_id": company.id},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 403

    @pytest.mark.asyncio
    async def test_grant_idc_access_user_not_found_returns_404(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        clean_admin_tool_access,
    ) -> None:
        """Non-existent user id returns 404 Not Found."""
        admin = _create_test_user(
            session=session,
            clean_tracker=clean_admin_tool_access,
            email="admin.notfound.user@example.com",
            fullname="Admin Not Found User",
            role=UserRole.admin,
            tools=[ToolType.idc.value],
        )
        company = _create_test_company(
            session=session,
            clean_tracker=clean_admin_tool_access,
            name="Valid Company",
        )

        admin_token = generate_user_token(admin)
        res = await client.post(
            "/user/9999999/grant-idc",
            json={"company_id": company.id},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert res.status_code == 404

    @pytest.mark.asyncio
    async def test_grant_idc_access_company_not_found_returns_404(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        clean_admin_tool_access,
    ) -> None:
        """Non-existent company id returns 404 Not Found."""
        admin = _create_test_user(
            session=session,
            clean_tracker=clean_admin_tool_access,
            email="admin.notfound.comp@example.com",
            fullname="Admin Not Found Comp",
            role=UserRole.admin,
            tools=[ToolType.idc.value],
        )
        target_user = _create_test_user(
            session=session,
            clean_tracker=clean_admin_tool_access,
            email="target.notfound.comp@example.com",
            fullname="Target Not Found Comp",
            role=UserRole.user,
            tools=[ToolType.academy.value],
        )

        admin_token = generate_user_token(admin)
        res = await client.post(
            f"/user/{target_user.id}/grant-idc",
            json={"company_id": 9999999},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert res.status_code == 404

    @pytest.mark.asyncio
    async def test_grant_idc_access_inactive_user_returns_400(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        clean_admin_tool_access,
    ) -> None:
        """Granting IDC to unverified/inactive user returns 400 Bad Request."""
        admin = _create_test_user(
            session=session,
            clean_tracker=clean_admin_tool_access,
            email="admin.inactive.target@example.com",
            fullname="Admin Inactive Target",
            role=UserRole.admin,
            tools=[ToolType.idc.value],
        )
        inactive_user = _create_test_user(
            session=session,
            clean_tracker=clean_admin_tool_access,
            email="inactive.target@example.com",
            fullname="Inactive Target User",
            role=UserRole.user,
            tools=[ToolType.academy.value],
            is_active=0,
        )
        company = _create_test_company(
            session=session,
            clean_tracker=clean_admin_tool_access,
            name="Valid Partner Co",
        )

        admin_token = generate_user_token(admin)
        res = await client.post(
            f"/user/{inactive_user.id}/grant-idc",
            json={"company_id": company.id},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert res.status_code == 400

    @pytest.mark.asyncio
    async def test_grant_idc_access_smtp_failure_does_not_rollback(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        clean_admin_tool_access,
        monkeypatch,
    ) -> None:
        """SMTP delivery failure logs error without rolling back grant."""
        admin = _create_test_user(
            session=session,
            clean_tracker=clean_admin_tool_access,
            email="admin.smtp.fail@example.com",
            fullname="Admin SMTP Fail",
            role=UserRole.admin,
            tools=[ToolType.idc.value],
        )
        target_user = _create_test_user(
            session=session,
            clean_tracker=clean_admin_tool_access,
            email="target.smtp.fail@example.com",
            fullname="Target SMTP Fail",
            role=UserRole.user,
            tools=[ToolType.academy.value],
            company_id=None,
        )
        company = _create_test_company(
            session=session,
            clean_tracker=clean_admin_tool_access,
            name="Reliable Agro Group",
        )

        # Force Email.send to simulate SMTP connection timeout/failure
        monkeypatch.setattr(Email, "send", property(lambda self: False))

        admin_token = generate_user_token(admin)
        res = await client.post(
            f"/user/{target_user.id}/grant-idc",
            json={"company_id": company.id},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert res.status_code == 200

        session.refresh(target_user)
        assert ToolType.idc.value in target_user.tools
        assert target_user.company == company.id


class TestAdminRevokeIdcAccess:
    """Test suite for POST /user/{user_id}/revoke-idc endpoint."""

    @pytest.mark.asyncio
    async def test_revoke_idc_access_success(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        clean_admin_tool_access,
    ) -> None:
        """Admin revokes IDC access: removes 'idc', unlinks company, clears all_cases."""
        admin = _create_test_user(
            session=session,
            clean_tracker=clean_admin_tool_access,
            email="admin.revoke.success@example.com",
            fullname="Admin Revoke Success",
            role=UserRole.admin,
            tools=[ToolType.idc.value],
        )
        company = _create_test_company(
            session=session,
            clean_tracker=clean_admin_tool_access,
            name="Revoke Agro Partner",
        )
        target_user = _create_test_user(
            session=session,
            clean_tracker=clean_admin_tool_access,
            email="target.revoke.success@example.com",
            fullname="Target Revoke Success",
            role=UserRole.user,
            tools=[ToolType.idc.value, ToolType.academy.value],
            company_id=company.id,
        )
        target_user.all_cases = 1
        session.commit()

        admin_token = generate_user_token(admin)
        res = await client.post(
            f"/user/{target_user.id}/revoke-idc",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert res.status_code == 200
        data = res.json()
        assert ToolType.idc.value not in data.get("tools", [])
        assert ToolType.academy.value in data.get("tools", [])
        assert data.get("company") is None

        session.refresh(target_user)
        assert ToolType.idc.value not in target_user.tools
        assert ToolType.academy.value in target_user.tools
        assert target_user.company is None
        assert target_user.all_cases == 0

    @pytest.mark.asyncio
    async def test_revoke_idc_access_user_with_only_idc_retains_academy(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        clean_admin_tool_access,
    ) -> None:
        """Revoking IDC from user whose tools were only ['idc'] ensures ['academy'] remains."""
        admin = _create_test_user(
            session=session,
            clean_tracker=clean_admin_tool_access,
            email="admin.revoke.fallback@example.com",
            fullname="Admin Revoke Fallback",
            role=UserRole.admin,
            tools=[ToolType.idc.value],
        )
        target_user = _create_test_user(
            session=session,
            clean_tracker=clean_admin_tool_access,
            email="target.revoke.fallback@example.com",
            fullname="Target Revoke Fallback",
            role=UserRole.user,
            tools=[ToolType.idc.value],
        )
        admin_token = generate_user_token(admin)
        res = await client.post(
            f"/user/{target_user.id}/revoke-idc",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert res.status_code == 200
        session.refresh(target_user)
        assert target_user.tools == [ToolType.academy.value]

    @pytest.mark.asyncio
    async def test_revoke_idc_access_non_admin_returns_403(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        clean_admin_tool_access,
    ) -> None:
        """Non-admin user cannot revoke IDC access."""
        regular_user = _create_test_user(
            session=session,
            clean_tracker=clean_admin_tool_access,
            email="nonadmin.revoke@example.com",
            fullname="Non Admin Revoke",
            role=UserRole.user,
            tools=[ToolType.idc.value],
        )
        user_token = generate_user_token(regular_user)
        res = await client.post(
            f"/user/{regular_user.id}/revoke-idc",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert res.status_code == 403

    @pytest.mark.asyncio
    async def test_revoke_idc_access_user_without_idc_returns_400(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        clean_admin_tool_access,
    ) -> None:
        """Revoking IDC from user without IDC access returns 400 Bad Request."""
        admin = _create_test_user(
            session=session,
            clean_tracker=clean_admin_tool_access,
            email="admin.revoke.no.idc@example.com",
            fullname="Admin Revoke No IDC",
            role=UserRole.admin,
            tools=[ToolType.idc.value],
        )
        target_user = _create_test_user(
            session=session,
            clean_tracker=clean_admin_tool_access,
            email="target.no.idc@example.com",
            fullname="Target No IDC",
            role=UserRole.user,
            tools=[ToolType.academy.value],
        )
        admin_token = generate_user_token(admin)
        res = await client.post(
            f"/user/{target_user.id}/revoke-idc",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert res.status_code == 400
        assert "does not have IDC access" in res.json().get("detail", "")

    @pytest.mark.asyncio
    async def test_revoke_idc_access_user_with_owned_cases_returns_409(
        self,
        app: FastAPI,
        session: Session,
        client: AsyncClient,
        clean_admin_tool_access,
    ) -> None:
        """Revoking IDC from user who owns cases returns 409 Conflict with cases list."""
        from datetime import date
        from models.case import Case
        from models.country import Country
        from models.commodity import Commodity

        admin = _create_test_user(
            session=session,
            clean_tracker=clean_admin_tool_access,
            email="admin.revoke.conflict@example.com",
            fullname="Admin Revoke Conflict",
            role=UserRole.admin,
            tools=[ToolType.idc.value],
        )
        case_owner = _create_test_user(
            session=session,
            clean_tracker=clean_admin_tool_access,
            email="owner.revoke.conflict@example.com",
            fullname="Owner Revoke Conflict",
            role=UserRole.user,
            tools=[ToolType.idc.value, ToolType.academy.value],
        )
        country = Country(name="Conflict Country")
        commodity = Commodity(name="Conflict Commodity")
        session.add(country)
        session.add(commodity)
        session.commit()
        session.refresh(country)
        session.refresh(commodity)
        clean_admin_tool_access(
            country_id=country.id,
            commodity_id=commodity.id,
        )

        test_case = Case(
            name="Conflict Test Case",
            description="Testing 409 conflict on revoke",
            date=date.today(),
            year=2024,
            country=country.id,
            focus_commodity=commodity.id,
            currency="USD",
            area_size_unit="ha",
            volume_measurement_unit="kg",
            cost_of_production_unit="Per-area",
            reporting_period="Per-season",
            segmentation=0,
            living_income_study=None,
            multiple_commodities=0,
            logo=None,
            created_by=case_owner.id,
        )
        session.add(test_case)
        session.commit()
        session.refresh(test_case)
        clean_admin_tool_access(case_id=test_case.id)

        admin_token = generate_user_token(admin)
        res = await client.post(
            f"/user/{case_owner.id}/revoke-idc",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert res.status_code == 409
        detail = res.json().get("detail", {})
        assert detail.get("id") == case_owner.id
        assert len(detail.get("cases", [])) > 0
        assert any(c["value"] == test_case.id for c in detail.get("cases", []))

import os
import sys
from types import SimpleNamespace
from typing import Generator

import pytest
from fastapi import FastAPI, HTTPException
from httpx import AsyncClient
from sqlalchemy import text
from sqlalchemy.orm import Session

from middleware import (
    create_access_token,
    generate_user_token,
    get_password_hash,
)
from models.organisation import Organisation
from models.user import User, UserRole, UserType

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

from sqlalchemy import func  # noqa: E402
from models.case import Case, LivingIncomeStudyEnum  # noqa: E402
from models.commodity import Commodity  # noqa: E402
from models.commodity_category import CommodityCategory  # noqa: E402
from models.country import Country  # noqa: E402
from models.enum_type import PermissionType  # noqa: E402
from models.segment import Segment  # noqa: E402
from models.segment_answer import SegmentAnswer  # noqa: E402
from models.user_case_access import UserCaseAccess  # noqa: E402
from models.visualization import Visualization  # noqa: E402


def build_valid_case_payload(country_id: int, focus_commodity_id: int) -> dict:
    return {
        "name": "Route Guard Regression Test Case",
        "description": "Regression payload verifying IDC route gatekeeping",
        "date": "2026-01-15",
        "year": 2026,
        "country": country_id,
        "focus_commodity": focus_commodity_id,
        "currency": "USD",
        "area_size_unit": "hectare",
        "volume_measurement_unit": "kilogram",
        "cost_of_production_unit": "Per-area",
        "reporting_period": "per-year",
        "segmentation": False,
        "living_income_study": LivingIncomeStudyEnum.better_income.value,
        "multiple_commodities": False,
        "private": False,
    }


def _reset_serial_sequence(session: Session, table_name: str) -> None:
    session.execute(
        text(
            f"SELECT CASE "
            f"WHEN (SELECT MAX(id) FROM \"{table_name}\") IS NULL "
            f"THEN setval(pg_get_serial_sequence('{table_name}', 'id'), "
            f"1, false) "
            f"ELSE setval(pg_get_serial_sequence('{table_name}', 'id'), "
            f"(SELECT MAX(id) FROM \"{table_name}\"), true) "
            f"END"
        )
    )


@pytest.fixture
def clean_route_guard_cases(session: Session) -> Generator:
    initial_max_case_id = session.query(func.max(Case.id)).scalar() or 0
    created_country_id = None
    created_category_id = None
    created_commodity_id = None
    created_uca_ids = []
    created_case_ids = []

    country = session.query(Country).first()
    if not country:
        country = Country(name="Route Guard Test Country")
        session.add(country)
        session.commit()
        session.refresh(country)
        created_country_id = country.id

    commodity = session.query(Commodity).first()
    if not commodity:
        category = session.query(CommodityCategory).first()
        if not category:
            category = CommodityCategory(name="Route Guard Test Category")
            session.add(category)
            session.commit()
            session.refresh(category)
            created_category_id = category.id
        commodity = Commodity(
            name="Route Guard Test Commodity",
            commodity_category=category.id,
        )
        session.add(commodity)
        session.commit()
        session.refresh(commodity)
        created_commodity_id = commodity.id

    def _create_case(owner_id: int) -> Case:
        case = Case(
            name="Route Guard Seeded Case",
            date="2026-01-15",
            year=2026,
            country=country.id,
            focus_commodity=commodity.id,
            currency="USD",
            area_size_unit="hectare",
            volume_measurement_unit="kilogram",
            cost_of_production_unit="Per-area",
            segmentation=0,
            reporting_period="per-year",
            living_income_study=LivingIncomeStudyEnum.better_income.value,
            description="Seeded case for route guard revocation tests",
            multiple_commodities=0,
            logo=None,
            created_by=owner_id,
            updated_by=owner_id,
            private=0,
        )
        session.add(case)
        session.commit()
        session.refresh(case)
        created_case_ids.append(case.id)
        return case

    def _grant_case_access(
        user_id: int, case_id: int, permission: PermissionType
    ) -> UserCaseAccess:
        uca = UserCaseAccess(
            user=user_id,
            case=case_id,
            permission=permission,
        )
        session.add(uca)
        session.commit()
        session.refresh(uca)
        created_uca_ids.append(uca.id)
        return uca

    yield {
        "country_id": country.id,
        "commodity_id": commodity.id,
        "create_case": _create_case,
        "grant_access": _grant_case_access,
    }

    session.rollback()
    for uca_id in reversed(created_uca_ids):
        uca = (
            session.query(UserCaseAccess)
            .filter(UserCaseAccess.id == uca_id)
            .first()
        )
        if uca:
            session.delete(uca)

    new_cases = (
        session.query(Case)
        .filter(
            (Case.id > initial_max_case_id) | (Case.id.in_(created_case_ids))
        )
        .all()
    )
    for case in new_cases:
        session.query(UserCaseAccess).filter(
            UserCaseAccess.case == case.id
        ).delete()
        session.delete(case)

    if created_commodity_id is not None:
        comm = (
            session.query(Commodity)
            .filter(Commodity.id == created_commodity_id)
            .first()
        )
        if comm:
            session.delete(comm)
    if created_category_id is not None:
        cat = (
            session.query(CommodityCategory)
            .filter(CommodityCategory.id == created_category_id)
            .first()
        )
        if cat:
            session.delete(cat)
    if created_country_id is not None:
        c = (
            session.query(Country)
            .filter(Country.id == created_country_id)
            .first()
        )
        if c:
            session.delete(c)
    session.commit()

    for table_name in (
        "user_case_access",
        "case",
        "case_commodity",
        "segment",
        "case_tag",
    ):
        _reset_serial_sequence(session, table_name)
    if created_commodity_id is not None:
        _reset_serial_sequence(session, "commodity")
    if created_category_id is not None:
        _reset_serial_sequence(session, "commodity_category")
    if created_country_id is not None:
        _reset_serial_sequence(session, "country")
    session.commit()


@pytest.fixture
def clean_route_guard_users(session: Session) -> Generator:
    created_user_ids = []
    created_org_id = None

    def _create_user(
        email: str,
        tools,
        role: UserRole = UserRole.user,
        user_type: UserType = UserType.external_advanced,
    ) -> User:
        nonlocal created_org_id
        org = session.query(Organisation).first()
        if not org:
            org = Organisation(id=None, name="Route Guard Test Org")
            session.add(org)
            session.commit()
            session.refresh(org)
            created_org_id = org.id

        user = User(
            fullname="Route Guard Test User",
            email=email,
            password=get_password_hash("StrongPassword123!"),
            role=role,
            organisation=org.id,
            is_active=1,
            tools=tools,
        )
        user.user_type = user_type
        session.add(user)
        session.commit()
        session.refresh(user)
        created_user_ids.append(user.id)
        return user

    yield _create_user

    session.rollback()
    for uid in reversed(created_user_ids):
        user = session.query(User).filter(User.id == uid).first()
        if user:
            session.delete(user)
    if created_org_id is not None:
        org = (
            session.query(Organisation)
            .filter(Organisation.id == created_org_id)
            .first()
        )
        if org:
            session.delete(org)
    session.commit()

    session.execute(
        text(
            "SELECT setval('user_id_seq', "
            "(SELECT COALESCE(MAX(id), 1) FROM \"user\"))"
        )
    )
    session.commit()


class TestIdcRouteGuarding:
    @pytest.mark.asyncio
    async def test_unauthenticated_requests_rejected(
        self, app: FastAPI, client: AsyncClient
    ) -> None:
        # Missing Authorization header -> HTTPBearer 403
        res_no_header = await client.get("/case_countries")
        assert res_no_header.status_code == 403

        # Invalid JWT -> 401
        res_bad_token = await client.get(
            "/case_countries",
            headers={"Authorization": "Bearer invalid.jwt.token"},
        )
        assert res_bad_token.status_code == 401

    @pytest.mark.asyncio
    @pytest.mark.parametrize(
        "method,url,json_body",
        [
            ("get", "/case", None),
            ("get", "/case_countries", None),
            ("get", "/case/99999", None),
            ("post", "/case", {}),
            ("post", "/case-import/segmentation-preview", {}),
            ("get", "/segment/case/99999", None),
            ("post", "/segment-answer/99999", []),
            ("get", "/visualization/case/99999", None),
            (
                "post",
                "/optimize/run-model/1/1",
                {"percentages": [], "editable_indices": []},
            ),
            ("get", "/map/case-by-country", None),
            ("get", "/map/case-by-country-and-company", None),
        ],
    )
    async def test_academy_only_user_denied_on_idc_endpoints(
        self,
        app: FastAPI,
        client: AsyncClient,
        clean_route_guard_users,
        method: str,
        url: str,
        json_body,
    ) -> None:
        academy_user = clean_route_guard_users(
            email="academy_guard_user@example.com",
            tools=["academy"],
            role=UserRole.admin,
        )
        token = generate_user_token(academy_user)

        request_fn = getattr(client, method)
        kwargs = {"headers": {"Authorization": f"Bearer {token}"}}
        if json_body is not None:
            kwargs["json"] = json_body

        res = await request_fn(url, **kwargs)
        assert res.status_code == 403
        assert res.json() == {"detail": "Tool access required: idc"}

    @pytest.mark.asyncio
    async def test_empty_tools_array_fails_closed(
        self,
        app: FastAPI,
        client: AsyncClient,
        clean_route_guard_users,
    ) -> None:
        user = clean_route_guard_users(
            email="empty_tools_guard@example.com",
            tools=[],
            role=UserRole.admin,
        )
        token = generate_user_token(user)

        res = await client.get(
            "/case_countries",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 403
        assert res.json() == {"detail": "Tool access required: idc"}

    def test_null_tools_attribute_fails_closed(self, monkeypatch) -> None:
        import middleware

        fake_user = SimpleNamespace(
            id=999, email="null@example.com", tools=None
        )
        monkeypatch.setattr(
            middleware, "verify_user", lambda session, authenticated: fake_user
        )
        fake_req = SimpleNamespace(
            state=SimpleNamespace(authenticated={"email": "null@example.com"})
        )
        fake_creds = SimpleNamespace(credentials="token")

        with pytest.raises(HTTPException) as exc_info:
            middleware.verify_idc_access(
                req=fake_req, session=None, credentials=fake_creds
            )
        assert exc_info.value.status_code == 403
        assert exc_info.value.detail == "Tool access required: idc"

    @pytest.mark.asyncio
    async def test_forged_jwt_tools_claim_cannot_bypass_db_check(
        self,
        app: FastAPI,
        client: AsyncClient,
        clean_route_guard_users,
    ) -> None:
        academy_user = clean_route_guard_users(
            email="forged_claim_academy@example.com",
            tools=["academy"],
            role=UserRole.user,
        )
        forged_token = create_access_token(
            data={
                "sub": academy_user.email,
                "email": academy_user.email,
                "role": "user",
                "tools": ["idc", "academy"],
            }
        )

        res = await client.get(
            "/case_countries",
            headers={"Authorization": f"Bearer {forged_token}"},
        )
        assert res.status_code == 403
        assert res.json() == {"detail": "Tool access required: idc"}

    @pytest.mark.asyncio
    @pytest.mark.parametrize("tools_value", [["idc"], ["idc", "academy"]])
    async def test_authorized_idc_users_allowed(
        self,
        app: FastAPI,
        client: AsyncClient,
        clean_route_guard_users,
        tools_value,
    ) -> None:
        idc_user = clean_route_guard_users(
            email=f"authorized_{'_'.join(tools_value)}@example.com",
            tools=tools_value,
            role=UserRole.user,
        )
        token = generate_user_token(idc_user)

        res = await client.get(
            "/case_countries",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    @pytest.mark.asyncio
    async def test_academy_and_shared_endpoints_remain_accessible(
        self,
        app: FastAPI,
        client: AsyncClient,
        clean_route_guard_users,
    ) -> None:
        academy_user = clean_route_guard_users(
            email="academy_allowed@example.com",
            tools=["academy"],
            role=UserRole.user,
        )
        token = generate_user_token(academy_user)
        headers = {"Authorization": f"Bearer {token}"}

        res_academy = await client.get("/academy/tags", headers=headers)
        assert res_academy.status_code == 200

        res_me = await client.get("/user/me", headers=headers)
        assert res_me.status_code == 200
        assert res_me.json()["tools"] == ["academy"]

        # Public world_map asset remains reachable without auth
        res_map = await client.get("/map/static/world_map.js")
        assert res_map.status_code == 200

    @pytest.mark.asyncio
    @pytest.mark.parametrize(
        "role,user_type",
        [
            (UserRole.user, UserType.external_advanced),
            (UserRole.admin, UserType.internal),
        ],
    )
    async def test_academy_only_user_post_case_rejected_zero_db_mutation(
        self,
        app: FastAPI,
        client: AsyncClient,
        session: Session,
        clean_route_guard_users,
        clean_route_guard_cases,
        role: UserRole,
        user_type: UserType,
    ) -> None:
        academy_user = clean_route_guard_users(
            email=f"academy_post_{role.value}@test.akvo.org",
            tools=["academy"],
            role=role,
            user_type=user_type,
        )
        token = generate_user_token(academy_user)
        payload = build_valid_case_payload(
            country_id=clean_route_guard_cases["country_id"],
            focus_commodity_id=clean_route_guard_cases["commodity_id"],
        )

        case_count_before = session.query(Case).count()
        res = await client.post(
            "/case",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
        )
        session.expire_all()
        case_count_after = session.query(Case).count()

        assert res.status_code == 403
        assert res.json() == {"detail": "Tool access required: idc"}
        assert case_count_after == case_count_before

    @pytest.mark.asyncio
    async def test_post_case_positive_control_for_authorized_idc_user(
        self,
        app: FastAPI,
        client: AsyncClient,
        session: Session,
        clean_route_guard_users,
        clean_route_guard_cases,
    ) -> None:
        idc_admin = clean_route_guard_users(
            email="idc_post_control@test.akvo.org",
            tools=["idc"],
            role=UserRole.admin,
            user_type=UserType.internal,
        )
        token = generate_user_token(idc_admin)
        payload = build_valid_case_payload(
            country_id=clean_route_guard_cases["country_id"],
            focus_commodity_id=clean_route_guard_cases["commodity_id"],
        )

        case_count_before = session.query(Case).count()
        res = await client.post(
            "/case",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
        )
        session.expire_all()
        case_count_after = session.query(Case).count()

        assert res.status_code == 200
        body = res.json()
        assert isinstance(body.get("id"), int)
        assert body["name"] == payload["name"]
        assert case_count_after == case_count_before + 1

    @pytest.mark.asyncio
    async def test_super_admin_academy_only_cannot_bypass_idc_guard(
        self,
        app: FastAPI,
        client: AsyncClient,
        session: Session,
        clean_route_guard_users,
        clean_route_guard_cases,
    ) -> None:
        super_admin_academy = clean_route_guard_users(
            email="superadmin_academy@test.akvo.org",
            tools=["academy"],
            role=UserRole.super_admin,
            user_type=UserType.internal,
        )
        seed_owner = clean_route_guard_users(
            email="seed_owner_sa@test.akvo.org",
            tools=["idc"],
            role=UserRole.admin,
            user_type=UserType.internal,
        )
        seeded_case = clean_route_guard_cases["create_case"](seed_owner.id)
        token = generate_user_token(super_admin_academy)
        headers = {"Authorization": f"Bearer {token}"}
        valid_payload = build_valid_case_payload(
            country_id=clean_route_guard_cases["country_id"],
            focus_commodity_id=clean_route_guard_cases["commodity_id"],
        )

        case_count_before = session.query(Case).count()
        requests = [
            client.post("/case", json=valid_payload, headers=headers),
            client.delete(f"/case/{seeded_case.id}", headers=headers),
            client.put(
                f"/update_case_owner/{seeded_case.id}"
                f"?user_id={super_admin_academy.id}",
                headers=headers,
            ),
            client.get("/case/options", headers=headers),
        ]
        for req in requests:
            res = await req
            assert res.status_code == 403
            assert res.json() == {"detail": "Tool access required: idc"}

        session.expire_all()
        assert session.query(Case).count() == case_count_before
        refreshed = (
            session.query(Case).filter(Case.id == seeded_case.id).first()
        )
        assert refreshed is not None
        assert refreshed.created_by == seed_owner.id

    @pytest.mark.asyncio
    async def test_academy_only_blocked_across_idc_write_matrix(
        self,
        app: FastAPI,
        client: AsyncClient,
        session: Session,
        clean_route_guard_users,
        clean_route_guard_cases,
    ) -> None:
        academy_super = clean_route_guard_users(
            email="academy_write_matrix@test.akvo.org",
            tools=["academy"],
            role=UserRole.super_admin,
            user_type=UserType.internal,
        )
        idc_owner = clean_route_guard_users(
            email="idc_matrix_owner@test.akvo.org",
            tools=["idc"],
            role=UserRole.admin,
            user_type=UserType.internal,
        )
        seeded_case = clean_route_guard_cases["create_case"](idc_owner.id)
        cid = seeded_case.id
        token = generate_user_token(academy_super)
        headers = {"Authorization": f"Bearer {token}"}
        valid_payload = build_valid_case_payload(
            country_id=clean_route_guard_cases["country_id"],
            focus_commodity_id=clean_route_guard_cases["commodity_id"],
        )

        counts_before = (
            session.query(Case).count(),
            session.query(Segment).count(),
            session.query(SegmentAnswer).count(),
            session.query(Visualization).count(),
            session.query(UserCaseAccess).count(),
        )

        guarded_requests = [
            ("POST", "/case", {"json": valid_payload}),
            ("PUT", f"/case/{cid}", {"json": valid_payload}),
            ("PUT", f"/case/update-status/{cid}?status=1", {}),
            ("DELETE", f"/case/{cid}", {}),
            (
                "POST",
                f"/case_access/{cid}",
                {"json": {"user": academy_super.id, "permission": "edit"}},
            ),
            ("DELETE", f"/case_access/{cid}?access_id=1", {}),
            (
                "PUT",
                f"/update_case_owner/{cid}?user_id={academy_super.id}",
                {},
            ),
            ("POST", "/case-import", {}),
            ("POST", "/case-import/generate-segment-values", {}),
            ("POST", "/case-import/recalculate-segmentation", {}),
            ("DELETE", "/case-import/nonexistent-id", {}),
            (
                "POST",
                "/segment",
                {
                    "json": {
                        "case": cid,
                        "name": "Unauthorized Segment",
                        "number_of_farmers": 10,
                    }
                },
            ),
            (
                "PUT",
                "/segment",
                {
                    "json": {
                        "id": 1,
                        "case": cid,
                        "name": "Unauthorized Segment",
                        "number_of_farmers": 10,
                    }
                },
            ),
            ("DELETE", "/segment/1", {}),
            ("POST", "/segment-answer/1", {"json": []}),
            ("PUT", "/segment-answer/1", {"json": []}),
            (
                "POST",
                "/visualization",
                {"json": {"case": cid, "tab": "income_driver", "config": {}}},
            ),
            (
                "POST",
                f"/optimize/run-model/{cid}/1",
                {"json": {"percentages": [10.0], "editable_indices": ["0"]}},
            ),
            ("GET", "/map/case-by-country", {}),
            ("GET", "/map/case-by-country-and-company", {}),
        ]

        for method, path, kwargs in guarded_requests:
            res = await client.request(method, path, headers=headers, **kwargs)
            assert res.status_code == 403, (
                f"Expected 403 for {method} {path}, got {res.status_code}"
            )
            assert res.json() == {"detail": "Tool access required: idc"}

        session.expire_all()
        counts_after = (
            session.query(Case).count(),
            session.query(Segment).count(),
            session.query(SegmentAnswer).count(),
            session.query(Visualization).count(),
            session.query(UserCaseAccess).count(),
        )
        assert counts_after == counts_before

    @pytest.mark.asyncio
    async def test_revoked_user_with_case_ownership_and_uca_is_blocked(
        self,
        app: FastAPI,
        client: AsyncClient,
        session: Session,
        clean_route_guard_users,
        clean_route_guard_cases,
    ) -> None:
        revoked_user = clean_route_guard_users(
            email="revoked_owner_uca@test.akvo.org",
            tools=["academy"],
            role=UserRole.user,
            user_type=UserType.external_advanced,
        )
        owned_case = clean_route_guard_cases["create_case"](revoked_user.id)
        clean_route_guard_cases["grant_access"](
            user_id=revoked_user.id,
            case_id=owned_case.id,
            permission=PermissionType.edit,
        )
        token = generate_user_token(revoked_user)
        headers = {"Authorization": f"Bearer {token}"}
        valid_payload = build_valid_case_payload(
            country_id=clean_route_guard_cases["country_id"],
            focus_commodity_id=clean_route_guard_cases["commodity_id"],
        )

        for method, path, kwargs in [
            ("GET", f"/case/{owned_case.id}", {}),
            ("PUT", f"/case/{owned_case.id}", {"json": valid_payload}),
            ("DELETE", f"/case/{owned_case.id}", {}),
            (
                "POST",
                f"/case_access/{owned_case.id}",
                {"json": {"user": revoked_user.id, "permission": "view"}},
            ),
        ]:
            res = await client.request(method, path, headers=headers, **kwargs)
            assert res.status_code == 403
            assert res.json() == {"detail": "Tool access required: idc"}

        session.expire_all()
        persisted = (
            session.query(Case).filter(Case.id == owned_case.id).first()
        )
        assert persisted is not None
        assert persisted.name == "Route Guard Seeded Case"

    @pytest.mark.asyncio
    async def test_live_mid_session_tool_revocation_blocks_cached_jwt(
        self,
        app: FastAPI,
        client: AsyncClient,
        session: Session,
        clean_route_guard_users,
        clean_route_guard_cases,
    ) -> None:
        user = clean_route_guard_users(
            email="live_revocation@test.akvo.org",
            tools=["idc", "academy"],
            role=UserRole.admin,
            user_type=UserType.internal,
        )
        token = generate_user_token(user)
        headers = {"Authorization": f"Bearer {token}"}
        valid_payload = build_valid_case_payload(
            country_id=clean_route_guard_cases["country_id"],
            focus_commodity_id=clean_route_guard_cases["commodity_id"],
        )

        # While IDC tool is active, endpoint succeeds
        res_before = await client.get("/case_countries", headers=headers)
        assert res_before.status_code == 200

        # Admin revokes IDC tool mid-session in DB
        user.tools = ["academy"]
        session.add(user)
        session.commit()

        case_count_before = session.query(Case).count()
        for method, path, kwargs in [
            ("GET", "/case_countries", {}),
            ("GET", "/case", {}),
            ("POST", "/case", {"json": valid_payload}),
        ]:
            res_after = await client.request(
                method, path, headers=headers, **kwargs
            )
            assert res_after.status_code == 403
            assert res_after.json() == {"detail": "Tool access required: idc"}

        session.expire_all()
        assert session.query(Case).count() == case_count_before

    @pytest.mark.asyncio
    @pytest.mark.parametrize(
        "malformed_tools",
        [
            ["IDC"],
            ["Idc"],
            ["academy", "idc_admin"],
            ["academy", " idc "],
        ],
    )
    async def test_case_sensitive_and_malformed_tools_fail_closed(
        self,
        app: FastAPI,
        client: AsyncClient,
        session: Session,
        clean_route_guard_users,
        clean_route_guard_cases,
        malformed_tools,
    ) -> None:
        suffix = abs(hash(tuple(malformed_tools))) % 100000
        user = clean_route_guard_users(
            email=f"malformed_tools_{suffix}@test.akvo.org",
            tools=malformed_tools,
            role=UserRole.admin,
            user_type=UserType.internal,
        )
        token = generate_user_token(user)
        headers = {"Authorization": f"Bearer {token}"}
        valid_payload = build_valid_case_payload(
            country_id=clean_route_guard_cases["country_id"],
            focus_commodity_id=clean_route_guard_cases["commodity_id"],
        )

        case_count_before = session.query(Case).count()
        res_get = await client.get("/case_countries", headers=headers)
        res_post = await client.post(
            "/case", json=valid_payload, headers=headers
        )
        session.expire_all()

        assert res_get.status_code == 403
        assert res_get.json() == {"detail": "Tool access required: idc"}
        assert res_post.status_code == 403
        assert res_post.json() == {"detail": "Tool access required: idc"}
        assert session.query(Case).count() == case_count_before

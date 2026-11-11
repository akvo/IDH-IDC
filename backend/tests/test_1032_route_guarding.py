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

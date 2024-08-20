import sys
import os
import pytest
import json
from datetime import timedelta
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy.orm import Session
from tests.test_000_main import Acc
from db.crud_user import get_user_by_email
from models.user import UserRole, User
from models.user_business_unit import UserBusinessUnitRole, UserBusinessUnit
from models.reset_password import ResetPassword

sys.path.append("..")

account = Acc(email="super_admin@akvo.org", token=None)

CLIENT_ID = os.environ.get("CLIENT_ID", None)
CLIENT_SECRET = os.environ.get("CLIENT_SECRET", None)


class TestUserEndpoint:
    @pytest.mark.asyncio
    async def test_invite_user_with_no_cred(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        user_payload = {
            "fullname": "Test User",
            "email": "test_user@akvo.org",
            "password": None,
            "role": UserRole.viewer.value,
            "organisation": 1,
            "business_units": json.dumps(
                [
                    {
                        "business_unit": 1,
                        "role": UserBusinessUnitRole.member.value,
                    }
                ]
            ),
        }
        # without credential
        res = await client.post(
            app.url_path_for("user:register"),
            params={"invitation_id": 1},
            data=user_payload,
            headers={
                "content-type": "application/x-www-form-urlencoded",
            },
        )
        assert res.status_code == 403

    @pytest.mark.asyncio
    async def test_get_all_user_by_not_admin_cred(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # without credential
        res = await client.get(app.url_path_for("user:get_all"))
        assert res.status_code == 403
        # with credential but not an admin
        res = await client.get(
            app.url_path_for("user:get_all"),
            headers={"Authorization": f"Bearer {account.token}"},
        )
        assert res.status_code == 403

    @pytest.mark.asyncio
    async def test_get_user_by_id_by_not_admin_cred(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # without credential
        res = await client.get(app.url_path_for("user:get_by_id", user_id=1))
        assert res.status_code == 403
        # with credential but not an admin
        res = await client.get(
            app.url_path_for("user:get_by_id", user_id=1),
            headers={"Authorization": f"Bearer {account.token}"},
        )
        assert res.status_code == 403

    @pytest.mark.asyncio
    async def test_delete_user_by_not_admin_cred(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # add user to delete
        user_payload = {
            "fullname": "Normal User",
            "email": "support@akvo.org",
            "password": None,
            "organisation": 1,
        }
        res = await client.post(
            app.url_path_for("user:register"),
            data=user_payload,
            headers={
                "content-type": "application/x-www-form-urlencoded",
                "Authorization": f"Bearer {account.token}",
            },
        )
        assert res.status_code == 200
        res = res.json()
        user_id = res["id"]
        # delete user without cred
        res = await client.delete(
            app.url_path_for("user:delete", user_id=user_id)
        )
        assert res.status_code == 403
        # delete user by not admin
        res = await client.delete(
            app.url_path_for("user:delete", user_id=user_id),
            headers={"Authorization": f"Bearer {account.token}"},
        )
        assert res.status_code == 403

    @pytest.mark.asyncio
    async def test_update_user_wihtout_cred(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        user = get_user_by_email(session=session, email="super_admin@akvo.org")
        assert user.email == "super_admin@akvo.org"
        update_payload = {
            "fullname": user.fullname,
            "organisation": user.organisation,
            "role": UserRole.super_admin.value,
            "is_active": True,
        }
        # without cred
        res = await client.put(
            app.url_path_for("user:update", user_id=user.id),
            data=update_payload,
        )
        assert res.status_code == 403

    @pytest.mark.asyncio
    async def test_update_user_to_an_admin_without_business_units(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        user = get_user_by_email(session=session, email="super_admin@akvo.org")
        assert user.email == "super_admin@akvo.org"
        update_payload = {
            "fullname": user.fullname,
            "organisation": user.organisation,
            "role": UserRole.admin.value,
            "is_active": True,
        }
        # with cred
        res = await client.put(
            app.url_path_for("user:update", user_id=user.id),
            data=update_payload,
            headers={
                "content-type": "application/x-www-form-urlencoded",
                "Authorization": f"Bearer {account.token}",
            },
        )
        assert res.status_code == 422
        res = res.json()
        assert res == {"detail": "business_units required for admin role"}

    @pytest.mark.asyncio
    async def test_update_user_to_a_super_admin(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        user = get_user_by_email(session=session, email="super_admin@akvo.org")
        assert user.email == "super_admin@akvo.org"
        update_payload = {
            "fullname": user.fullname,
            "organisation": user.organisation,
            "role": UserRole.super_admin.value,
            "is_active": True,
        }
        # with cred
        res = await client.put(
            app.url_path_for("user:update", user_id=user.id),
            data=update_payload,
            headers={
                "content-type": "application/x-www-form-urlencoded",
                "Authorization": f"Bearer {account.token}",
            },
        )
        assert res.status_code == 200
        res = res.json()
        assert res["role"] == UserRole.super_admin.value
        assert res["active"] is True

    @pytest.mark.asyncio
    async def test_invite_editor_without_business_units_by_super_admin(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        user_payload = {
            "fullname": "Editor User",
            "email": "editor@akvo.org",
            "password": None,
            "role": UserRole.editor.value,
            "organisation": 1,
        }
        # without credential
        res = await client.post(
            app.url_path_for("user:register"),
            params={"invitation_id": 1},
            data=user_payload,
            headers={
                "content-type": "application/x-www-form-urlencoded",
                "Authorization": f"Bearer {account.token}",
            },
        )
        assert res.status_code == 422

    @pytest.mark.asyncio
    async def test_invite_viewer_without_business_units_by_super_admin(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        user_payload = {
            "fullname": "Viewer User",
            "email": "viewer@akvo.org",
            "password": None,
            "role": UserRole.viewer.value,
            "organisation": 1,
        }
        # with credential
        res = await client.post(
            app.url_path_for("user:register"),
            params={"invitation_id": 1},
            data=user_payload,
            headers={
                "content-type": "application/x-www-form-urlencoded",
                "Authorization": f"Bearer {account.token}",
            },
        )
        assert res.status_code == 422

    @pytest.mark.asyncio
    async def test_update_user_to_an_external_user_without_business_units(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        user = get_user_by_email(session=session, email="support@akvo.org")
        assert user.email == "support@akvo.org"
        update_payload = {
            "fullname": user.fullname,
            "organisation": user.organisation,
            "role": UserRole.user.value,
            "is_active": True,
        }
        # with cred
        res = await client.put(
            app.url_path_for("user:update", user_id=user.id),
            data=update_payload,
            headers={
                "content-type": "application/x-www-form-urlencoded",
                "Authorization": f"Bearer {account.token}",
            },
        )
        assert res.status_code == 200

    @pytest.mark.asyncio
    async def test_get_user_by_id_by_super_admin_cred(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # with admin credential
        res = await client.get(
            app.url_path_for("user:get_by_id", user_id=1),
            headers={"Authorization": f"Bearer {account.token}"},
        )
        assert res.status_code == 200
        res = res.json()
        assert res == {
            "id": 1,
            "email": "super_admin@akvo.org",
            "fullname": "John Doe",
            "role": UserRole.super_admin.value,
            "all_cases": True,
            "active": True,
            "organisation": 1,
            "tags": [],
            "business_units": [],
            "cases": [],
        }

    @pytest.mark.asyncio
    async def test_invite_admin_role_by_super_admin_without_business_unit(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        user_payload = {
            "fullname": "Invited Admin",
            "email": "admin@akvo.org",
            "role": UserRole.admin.value,
            "password": None,
            "organisation": 1,
        }
        # with credential
        res = await client.post(
            app.url_path_for("user:register"),
            params={"invitation_id": 1},
            data=user_payload,
            headers={
                "content-type": "application/x-www-form-urlencoded",
                "Authorization": f"Bearer {account.token}",
            },
        )
        assert res.status_code == 422
        res = res.json()
        assert res == {"detail": "business_units required for admin role"}

    @pytest.mark.asyncio
    async def test_invite_admin_role_by_super_admin_with_business_unit(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        user_payload = {
            "fullname": "Invited Admin",
            "email": "admin@akvo.org",
            "role": UserRole.admin.value,
            "password": None,
            "organisation": 1,
            "business_units": json.dumps(
                [
                    {
                        "business_unit": 1,
                        "role": UserBusinessUnitRole.admin.value,
                    }
                ]
            ),
        }
        # with credential
        res = await client.post(
            app.url_path_for("user:register"),
            params={"invitation_id": 1},
            data=user_payload,
            headers={
                "content-type": "application/x-www-form-urlencoded",
                "Authorization": f"Bearer {account.token}",
            },
        )
        assert res.status_code == 200
        res = res.json()
        assert res == {
            "id": 3,
            "fullname": "Invited Admin",
            "email": "admin@akvo.org",
            "organisation": 1,
            "role": UserRole.admin.value,
            "active": True,
        }
        user = get_user_by_email(session=session, email=user_payload["email"])
        assert user.invitation_id is not None
        assert user.password is None
        user_bu = (
            session.query(UserBusinessUnit)
            .filter(UserBusinessUnit.user == user.id)
            .all()
        )
        for ub in user_bu:
            assert ub.user == user.id
            assert ub.role.value == UserBusinessUnitRole.admin.value

    @pytest.mark.asyncio
    async def test_get_user_by_invitation_id(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        user = get_user_by_email(session=session, email="admin@akvo.org")
        res = await client.get(
            app.url_path_for(
                "user:invitation", invitation_id=user.invitation_id
            )
        )
        assert res.status_code == 200
        res = res.json()
        assert res == {
            "id": 3,
            "email": "admin@akvo.org",
            "fullname": "Invited Admin",
            "invitation_id": user.invitation_id,
            "role": UserRole.admin.value,
        }

    @pytest.mark.asyncio
    async def test_register_password_by_invitation_id(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        user = get_user_by_email(session=session, email="admin@akvo.org")
        res = await client.post(
            app.url_path_for(
                "user:invitation", invitation_id=user.invitation_id
            ),
            data={"password": "secret"},
        )
        assert res.status_code == 200
        res = res.json()
        assert res == {
            "access_token": res["access_token"],
            "token_type": "bearer",
            "user": {
                "id": 3,
                "fullname": "Invited Admin",
                "email": "admin@akvo.org",
                "role": UserRole.admin.value,
                "all_cases": True,
                "active": True,
                "business_unit_detail": [
                    {
                        "id": 1,
                        "name": "Acme Technologies Sales Division",
                        "role": UserBusinessUnitRole.admin.value,
                    }
                ],
                "organisation_detail": {"id": 1, "name": "Akvo"},
                "tags_count": 0,
                "cases_count": 0,
                "case_access": [],
                "internal_user": True,
            },
        }

    @pytest.mark.asyncio
    async def test_invite_editor_without_business_units_by_admin(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        account = Acc(email="admin@akvo.org", token=None)
        user_payload = {
            "fullname": "Editor User",
            "email": "editor@akvo.org",
            "password": None,
            "role": UserRole.editor.value,
            "organisation": 1,
        }
        # without credential
        res = await client.post(
            app.url_path_for("user:register"),
            params={"invitation_id": 1},
            data=user_payload,
            headers={
                "content-type": "application/x-www-form-urlencoded",
                "Authorization": f"Bearer {account.token}",
            },
        )
        assert res.status_code == 200
        res = res.json()
        # get user detail
        res = await client.get(
            app.url_path_for("user:get_by_id", user_id=res["id"]),
            headers={"Authorization": f"Bearer {account.token}"},
        )
        assert res.status_code == 200
        res = res.json()
        assert res == {
            "id": 4,
            "fullname": "Editor User",
            "organisation": 1,
            "email": "editor@akvo.org",
            "role": "editor",
            "all_cases": True,
            "active": True,
            "tags": [],
            "business_units": [{"business_unit": 1, "role": "member"}],
            "cases": [],
        }

    @pytest.mark.asyncio
    async def test_invite_viewer_without_business_units_by_admin(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        account = Acc(email="admin@akvo.org", token=None)
        user_payload = {
            "fullname": "Viewer User",
            "email": "viewer@akvo.org",
            "password": None,
            "role": UserRole.viewer.value,
            "organisation": 1,
        }
        # with credential
        res = await client.post(
            app.url_path_for("user:register"),
            params={"invitation_id": 1},
            data=user_payload,
            headers={
                "content-type": "application/x-www-form-urlencoded",
                "Authorization": f"Bearer {account.token}",
            },
        )
        assert res.status_code == 200
        res = res.json()
        # get user detail
        res = await client.get(
            app.url_path_for("user:get_by_id", user_id=res["id"]),
            headers={"Authorization": f"Bearer {account.token}"},
        )
        assert res.status_code == 200
        res = res.json()
        assert res == {
            "id": 5,
            "fullname": "Viewer User",
            "organisation": 1,
            "email": "viewer@akvo.org",
            "role": "viewer",
            "all_cases": True,
            "active": True,
            "tags": [],
            "business_units": [{"business_unit": 1, "role": "member"}],
            "cases": [],
        }

    @pytest.mark.asyncio
    async def test_get_all_not_approved_user_by_super_admin_cred(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # with admin credential
        res = await client.get(
            app.url_path_for("user:get_all"),
            params={"approved": False},
            headers={"Authorization": f"Bearer {account.token}"},
        )
        assert res.status_code == 404

    @pytest.mark.asyncio
    async def test_update_user_password(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        account = Acc(email="viewer@akvo.org", token=None)
        user = get_user_by_email(session=session, email="viewer@akvo.org")
        assert user.email == "viewer@akvo.org"
        update_payload = {
            "fullname": "Viewer User",
            "organisation": user.organisation,
            "is_active": True,
            "password": "secret",
        }
        # with cred
        res = await client.put(
            app.url_path_for("user:update", user_id=user.id),
            data=update_payload,
            headers={
                "content-type": "application/x-www-form-urlencoded",
                "Authorization": f"Bearer {account.token}",
            },
        )
        assert res.status_code == 200
        res = res.json()
        assert res["fullname"] == "Viewer User"
        assert res["role"] == user.role.value
        assert res["active"] is True
        # test login with new password
        res = await client.post(
            app.url_path_for("user:login"),
            headers={"content-type": "application/x-www-form-urlencoded"},
            data={
                "username": user.email,
                "password": "secret",
                "grant_type": "password",
                "scopes": ["openid", "email"],
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
            },
        )
        assert res.status_code == 200
        res = res.json()
        assert res["access_token"] is not None
        assert res["user"]["email"] == user.email

    @pytest.mark.asyncio
    async def test_update_user_to_an_editor_without_business_units(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        user = get_user_by_email(session=session, email="editor@akvo.org")
        assert user.email == "editor@akvo.org"
        update_payload = {
            "fullname": user.fullname,
            "organisation": user.organisation,
            "role": UserRole.editor.value,
            "is_active": True,
        }
        # with cred
        res = await client.put(
            app.url_path_for("user:update", user_id=user.id),
            data=update_payload,
            headers={
                "content-type": "application/x-www-form-urlencoded",
                "Authorization": f"Bearer {account.token}",
            },
        )
        assert res.status_code == 200

    @pytest.mark.asyncio
    async def test_update_user_to_a_viewer_without_business_units(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        user = get_user_by_email(session=session, email="viewer@akvo.org")
        assert user.email == "viewer@akvo.org"
        update_payload = {
            "fullname": user.fullname,
            "organisation": user.organisation,
            "role": UserRole.viewer.value,
            "is_active": True,
        }
        # with cred
        res = await client.put(
            app.url_path_for("user:update", user_id=user.id),
            data=update_payload,
            headers={
                "content-type": "application/x-www-form-urlencoded",
                "Authorization": f"Bearer {account.token}",
            },
        )
        assert res.status_code == 200

    @pytest.mark.asyncio
    async def test_get_all_approved_user_by_super_admin_cred(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # with admin credential
        res = await client.get(
            app.url_path_for("user:get_all"),
            headers={"Authorization": f"Bearer {account.token}"},
        )
        assert res.status_code == 200
        res = res.json()
        assert res == {
            "current": 1,
            "data": [
                {
                    "id": 5,
                    "organisation": 1,
                    "email": "viewer@akvo.org",
                    "fullname": "Viewer User",
                    "role": "viewer",
                    "active": True,
                    "tags_count": 0,
                    "cases_count": 0,
                    "business_unit_count": 0,
                },
                {
                    "id": 4,
                    "organisation": 1,
                    "email": "editor@akvo.org",
                    "fullname": "Editor User",
                    "role": "editor",
                    "active": True,
                    "tags_count": 0,
                    "cases_count": 0,
                    "business_unit_count": 0,
                },
                {
                    "id": 3,
                    "organisation": 1,
                    "email": "admin@akvo.org",
                    "fullname": "Invited Admin",
                    "role": "admin",
                    "active": True,
                    "tags_count": 0,
                    "cases_count": 0,
                    "business_unit_count": 1,
                },
                {
                    "id": 2,
                    "organisation": 1,
                    "email": "support@akvo.org",
                    "fullname": "Normal User",
                    "role": "user",
                    "active": True,
                    "tags_count": 0,
                    "cases_count": 0,
                    "business_unit_count": 0,
                },
                {
                    "id": 1,
                    "organisation": 1,
                    "email": "super_admin@akvo.org",
                    "fullname": "John Doe",
                    "role": "super_admin",
                    "active": True,
                    "tags_count": 0,
                    "cases_count": 0,
                    "business_unit_count": 0,
                },
            ],
            "total": 5,
            "total_page": 1,
        }

    @pytest.mark.asyncio
    async def test_get_all_user_by_super_admin_cred_with_filter(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # with admin credential
        res = await client.get(
            app.url_path_for("user:get_all"),
            params={"organisation": 1, "search": "Wayan"},
            headers={"Authorization": f"Bearer {account.token}"},
        )
        assert res.status_code == 404
        # user role filter
        res = await client.get(
            app.url_path_for("user:get_all"),
            params={"role": "super_admin"},
            headers={"Authorization": f"Bearer {account.token}"},
        )
        assert res.status_code == 200
        res = await client.get(
            app.url_path_for("user:get_all"),
            params={"role": "admin"},
            headers={"Authorization": f"Bearer {account.token}"},
        )
        assert res.status_code == 200
        res = await client.get(
            app.url_path_for("user:get_all"),
            params={"role": "internal"},
            headers={"Authorization": f"Bearer {account.token}"},
        )
        assert res.status_code == 404
        res = await client.get(
            app.url_path_for("user:get_all"),
            params={"role": "external"},
            headers={"Authorization": f"Bearer {account.token}"},
        )
        assert res.status_code == 200

    @pytest.mark.asyncio
    async def test_delete_user_by_super_admin_cred(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        user_payload = {
            "fullname": "User to delete",
            "email": "user@test.com",
            "password": None,
            "organisation": 1,
        }
        res = await client.post(
            app.url_path_for("user:register"),
            data=user_payload,
            headers={
                "content-type": "application/x-www-form-urlencoded",
                "Authorization": f"Bearer {account.token}",
            },
        )
        assert res.status_code == 200
        res = res.json()
        user_id = res["id"]
        # delete user by admin
        res = await client.delete(
            app.url_path_for("user:delete", user_id=user_id),
            headers={"Authorization": f"Bearer {account.token}"},
        )
        assert res.status_code == 204

    @pytest.mark.asyncio
    async def test_update_user_to_a_normal_user(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        user = get_user_by_email(session=session, email="support@akvo.org")
        assert user.email == "support@akvo.org"
        update_payload = {
            "fullname": user.fullname,
            "organisation": user.organisation,
            "role": UserRole.user.value,
            "is_active": True,
        }
        # with cred
        res = await client.put(
            app.url_path_for("user:update", user_id=user.id),
            data=update_payload,
            headers={
                "content-type": "application/x-www-form-urlencoded",
                "Authorization": f"Bearer {account.token}",
            },
        )
        assert res.status_code == 200
        res = res.json()
        assert res["role"] == UserRole.user.value
        assert res["active"] is True

    @pytest.mark.asyncio
    async def test_get_all_user_by_admin_cred(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        account = Acc(email="admin@akvo.org", token=None)
        # with admin credential
        res = await client.get(
            app.url_path_for("user:get_all"),
            headers={"Authorization": f"Bearer {account.token}"},
        )
        assert res.status_code == 200
        res = res.json()
        assert res == {
            "current": 1,
            "data": [
                # {
                #     "id": 5,
                #     "organisation": 1,
                #     "email": "viewer@akvo.org",
                #     "fullname": "Viewer User",
                #     "role": "viewer",
                #     "active": True,
                #     "tags_count": 0,
                #     "cases_count": 0,
                # },
                # {
                #     "id": 4,
                #     "organisation": 1,
                #     "email": "editor@akvo.org",
                #     "fullname": "Editor User",
                #     "role": "editor",
                #     "active": True,
                #     "tags_count": 0,
                #     "cases_count": 0,
                # },
                {
                    "id": 3,
                    "organisation": 1,
                    "email": "admin@akvo.org",
                    "fullname": "Invited Admin",
                    "role": "admin",
                    "active": True,
                    "tags_count": 0,
                    "cases_count": 0,
                    "business_unit_count": 1,
                },
            ],
            "total": 1,
            "total_page": 1,
        }

    @pytest.mark.asyncio
    async def test_user_forgot_password(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        user_payload = {"email": "support@akvo.org"}
        user = (
            session.query(User)
            .filter(User.email == user_payload["email"])
            .first()
        )
        assert user.invitation_id is None
        res = await client.post(
            app.url_path_for("user:forgot-password"),
            headers={"content-type": "application/x-www-form-urlencoded"},
            data={
                "email": "support@akvo.org",
                "client_id": os.environ["CLIENT_ID"],
                "client_secret": os.environ["CLIENT_SECRET"],
            },
        )
        assert res.status_code == 201
        reset_password = (
            session.query(ResetPassword)
            .filter(ResetPassword.user == user.id)
            .first()
        )
        res = await client.get(
            app.url_path_for("user:reset-password", url=reset_password.url)
        )
        assert res.status_code == 200
        reset_password.valid -= timedelta(minutes=30)
        session.commit()
        session.flush()
        session.refresh(reset_password)
        res = await client.get(
            app.url_path_for("user:reset-password", url=reset_password.url)
        )
        assert res.status_code == 410

    @pytest.mark.asyncio
    async def test_forgot_password_then_change_and_login(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        user_payload = {"email": "support@akvo.org"}
        user = (
            session.query(User)
            .filter(User.email == user_payload["email"])
            .first()
        )
        assert user.invitation_id is None
        res = await client.post(
            app.url_path_for("user:forgot-password"),
            headers={"content-type": "application/x-www-form-urlencoded"},
            data={
                "email": "support@akvo.org",
                "client_id": os.environ["CLIENT_ID"],
                "client_secret": os.environ["CLIENT_SECRET"],
            },
        )
        assert res.status_code == 201
        reset_password = (
            session.query(ResetPassword)
            .filter(ResetPassword.user == user.id)
            .first()
        )
        res = await client.post(
            app.url_path_for("user:reset-password", url=reset_password.url),
            data={"password": "test"},
        )
        assert res.status_code == 200
        res = await client.get(
            app.url_path_for("user:reset-password", url=reset_password.url)
        )
        assert res.status_code == 404
        # test login with new password
        res = await client.post(
            app.url_path_for("user:login"),
            headers={"content-type": "application/x-www-form-urlencoded"},
            data={
                "username": user.email,
                "password": "test",
                "grant_type": "password",
                "scopes": ["openid", "email"],
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
            },
        )
        assert res.status_code == 200
        res = res.json()
        assert res["access_token"] is not None
        assert res["user"]["email"] == user.email

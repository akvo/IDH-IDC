import sys
import pytest
import json

from sqlalchemy.orm import Session
from sqlalchemy import and_
from fastapi import FastAPI
from httpx import AsyncClient

from tests.test_000_main import Acc
from models.user import User, UserRole
from models.case import Case, LivingIncomeStudyEnum
from models.user_business_unit import UserBusinessUnit, UserBusinessUnitRole
from models.enum_type import PermissionType
from models.user_case_access import UserCaseAccess
from models.case_commodity import CaseCommodity
from models.case_tag import CaseTag
from models.visualization import Visualization
from models.segment import Segment


from seeder.fake_seeder.fake_user import seed_fake_user
from seeder.fake_seeder.fake_case import seed_fake_case

pytestmark = pytest.mark.asyncio
sys.path.append("..")


account = Acc(email="super_admin@akvo.org", token=None)
non_admin_account = Acc(email="support@akvo.org", token=None)


def find_external_internal_user(session: Session):
    user_case_access = session.query(UserCaseAccess).all()
    user_business_unit = session.query(UserBusinessUnit).all()
    exclude_user_ids = [ubu.user for ubu in user_business_unit]
    user = session.query(User).filter(User.role == UserRole.user)
    ex_user = user.filter(
        ~User.id.in_(exclude_user_ids + [uca.user for uca in user_case_access])
    ).first()
    in_user = user.filter(User.id.in_(exclude_user_ids)).first()
    return ex_user, in_user


def find_editor_viewer_user(session: Session):
    user_case_access = session.query(UserCaseAccess)
    viewer = user_case_access.filter(
        UserCaseAccess.permission == PermissionType.view
    ).first()
    editor = user_case_access.filter(
        UserCaseAccess.permission == PermissionType.edit
    ).first()
    user = session.query(User)
    viewer_user = user.filter(User.id == viewer.user).first()
    editor_user = user.filter(User.id == editor.user).first()
    # case owner
    case = session.query(Case).filter(Case.id == editor.case).first()
    case_owner = user.filter(User.id == case.created_by).first()
    # user without permission
    all_case_owner = session.query(Case).all()
    user_no_permission = user.filter(
        and_(
            User.role == UserRole.user,
            ~User.id.in_(
                [viewer_user.id, editor_user.id, case_owner.id]
                + [c.created_by for c in all_case_owner]
            ),
        )
    ).first()
    return (
        viewer,
        viewer_user,
        editor,
        editor_user,
        case,
        case_owner,
        user_no_permission,
    )


class TestPermissionOveriding:
    @pytest.mark.asyncio
    async def test_seeder_fake_user(self, session: Session) -> None:
        seed_fake_user(session=session)
        users = session.query(User).all()
        for user in users:
            user_detail = user.to_user_detail
            # BU admin
            if user.role == UserRole.admin and user.all_cases:
                assert len(user_detail["business_units"]) > 0
            # Regular/Internal user (user with BU)
            if user.role == UserRole.user and user.all_cases:
                assert len(user_detail["business_units"]) > 0
            # External user (user without BU)
            if user.role == UserRole.admin and not user.all_cases:
                assert len(user_detail["business_units"]) == 0

    @pytest.mark.asyncio
    async def test_search_user_dropdown(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        res = await client.get(
            app.url_path_for("user:search_user_dropdown"),
            params={"search": "Wayan"},
            headers={"Authorization": f"Bearer {account.token}"},
        )
        res = res.json()
        assert res == []

        res = await client.get(
            app.url_path_for("user:search_user_dropdown"),
            params={"search": "super_admin"},
            headers={"Authorization": f"Bearer {account.token}"},
        )
        res = res.json()
        assert res == [
            {"label": "John Doe <super_admin@akvo.org>", "value": 1}
        ]

    @pytest.mark.asyncio
    async def test_seeder_fake_case(self, session: Session) -> None:
        cases = session.query(Case).count()
        assert cases == 3

        seed_fake_case(session=session)
        cases = session.query(Case).count()
        assert cases == 9

    @pytest.mark.asyncio
    async def test_create_case_by_external_user(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # find external/internal user
        ex_user, in_user = find_external_internal_user(session=session)
        external_user_acc = Acc(email=ex_user.email, token=None)

        payload = {
            "name": "Case by External user",
            "description": "This is a description",
            "date": "2023-10-03",
            "year": 2023,
            "country": 2,
            "focus_commodity": 2,
            "currency": "USD",
            "area_size_unit": "hectare",
            "volume_measurement_unit": "liters",
            "cost_of_production_unit": "Per-area",
            "reporting_period": "Per-season",
            "segmentation": False,
            "living_income_study": LivingIncomeStudyEnum.better_income.value,
            "multiple_commodities": False,
            "other_commodities": [],
            "private": True,
            "tags": [1],
        }

        # external user
        res = await client.post(
            app.url_path_for("case:create"),
            headers={"Authorization": f"Bearer {external_user_acc.token}"},
            json=payload,
        )
        assert res.status_code == 403
        res = res.json()
        assert res["detail"] == "You don't have access to create a case"

        # internal user
        internal_user_acc = Acc(email=in_user.email, token=None)
        res = await client.post(
            app.url_path_for("case:create"),
            headers={"Authorization": f"Bearer {internal_user_acc.token}"},
            json=payload,
        )
        assert res.status_code == 200
        res = res.json()
        assert res["created_by"] == in_user.id

    @pytest.mark.asyncio
    async def test_assign_case_access(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # find external/internal user
        ex_user, in_user = find_external_internal_user(session=session)
        payloads = []
        permissions = [PermissionType.edit.value, PermissionType.view.value]
        for index, user in enumerate([ex_user, in_user]):
            payloads.append(
                {"user": user.id, "permission": permissions[index]}
            )

        # not case owner
        case = session.query(Case).all()
        exclude_user = [c.created_by for c in case]
        not_case_owner = (
            session.query(User)
            .filter(
                and_(User.role == UserRole.user, ~User.id.in_(exclude_user))
            )
            .first()
        )
        not_case_owner_acc = Acc(email=not_case_owner.email, token=None)

        # assign access by not case owner
        res = await client.post(
            app.url_path_for("case:add_user_case_access", case_id=9),
            headers={"Authorization": f"Bearer {not_case_owner_acc.token}"},
            json=payloads[0],
        )
        assert res.status_code == 403

        # find case owner
        case = session.query(Case).order_by(Case.id.desc()).first()
        case_owner = case.created_by_user
        case_owner_acc = Acc(email=case_owner.email, token=None)

        # assign access by case owner
        res = await client.post(
            app.url_path_for("case:add_user_case_access", case_id=case.id),
            headers={"Authorization": f"Bearer {case_owner_acc.token}"},
            json=payloads[0],
        )
        assert res.status_code == 200
        res = res.json()
        assert res == {
            "id": 3,
            "case": 10,
            "label": res["label"],
            "value": 17,
            "permission": "edit",
        }

        # assign access by case owner
        res = await client.post(
            app.url_path_for("case:add_user_case_access", case_id=case.id),
            headers={"Authorization": f"Bearer {case_owner_acc.token}"},
            json=payloads[1],
        )
        assert res.status_code == 200
        res = res.json()
        assert res == {
            "id": 4,
            "case": 10,
            "label": res["label"],
            "value": 7,
            "permission": "view",
        }

    @pytest.mark.asyncio
    async def test_edit_case_permission(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        (
            viewer,
            viewer_user,
            editor,
            editor_user,
            case,
            case_owner,
            user_no_permission,
        ) = find_editor_viewer_user(session=session)

        payload = {
            "name": "Case by External user Updated",
            "description": "This is a description",
            "date": "2023-10-03",
            "year": 2023,
            "country": 2,
            "focus_commodity": 2,
            "currency": "USD",
            "area_size_unit": "hectare",
            "volume_measurement_unit": "liters",
            "cost_of_production_unit": "Per-area",
            "reporting_period": "Per-season",
            "segmentation": False,
            "living_income_study": LivingIncomeStudyEnum.better_income.value,
            "multiple_commodities": False,
            "other_commodities": [],
            "private": True,
            "tags": [1],
        }

        # no permission user
        user_no_permission_acc = Acc(
            email=user_no_permission.email, token=None
        )
        res = await client.put(
            app.url_path_for("case:update", case_id=case.id),
            headers={
                "Authorization": f"Bearer {user_no_permission_acc.token}"
            },
            json=payload,
        )
        assert res.status_code == 403

        # viewer user
        viewer_user_acc = Acc(email=viewer_user.email, token=None)
        res = await client.put(
            app.url_path_for("case:update", case_id=viewer.case),
            headers={"Authorization": f"Bearer {viewer_user_acc.token}"},
            json=payload,
        )
        assert res.status_code == 403

        # editor user
        editor_user_acc = Acc(email=editor_user.email, token=None)
        res = await client.put(
            app.url_path_for("case:update", case_id=editor.case),
            headers={"Authorization": f"Bearer {editor_user_acc.token}"},
            json=payload,
        )
        assert res.status_code == 200
        res = res.json()
        assert res["name"] == "Case by External user Updated"

        # edit by case creator
        payload["name"] = "Case by External user Updated by Owner"
        case_owner_acc = Acc(email=case_owner.email, token=None)
        res = await client.put(
            app.url_path_for("case:update", case_id=case.id),
            headers={"Authorization": f"Bearer {case_owner_acc.token}"},
            json=payload,
        )
        assert res.status_code == 200
        res = res.json()
        assert res["name"] == "Case by External user Updated by Owner"

    @pytest.mark.asyncio
    async def test_view_case_permission(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        (
            viewer,
            viewer_user,
            editor,
            editor_user,
            case,
            case_owner,
            user_no_permission,
        ) = find_editor_viewer_user(session=session)

        # no permission user
        user_no_permission_acc = Acc(
            email=user_no_permission.email, token=None
        )
        res = await client.get(
            app.url_path_for("case:get_by_id", case_id=case.id),
            headers={
                "Authorization": f"Bearer {user_no_permission_acc.token}"
            },
        )
        assert res.status_code == 403

        # viewer user
        viewer_user_acc = Acc(email=viewer_user.email, token=None)
        res = await client.get(
            app.url_path_for("case:get_by_id", case_id=viewer.case),
            headers={"Authorization": f"Bearer {viewer_user_acc.token}"},
        )
        assert res.status_code == 200

        # editor user
        editor_user_acc = Acc(email=editor_user.email, token=None)
        res = await client.get(
            app.url_path_for("case:get_by_id", case_id=editor.case),
            headers={"Authorization": f"Bearer {editor_user_acc.token}"},
        )
        assert res.status_code == 200

        # edit by case creator
        case_owner_acc = Acc(email=case_owner.email, token=None)
        res = await client.get(
            app.url_path_for("case:get_by_id", case_id=case.id),
            headers={"Authorization": f"Bearer {case_owner_acc.token}"},
        )
        assert res.status_code == 200

    @pytest.mark.asyncio
    async def test_get_all_case(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        (
            viewer,
            viewer_user,
            editor,
            editor_user,
            case,
            case_owner,
            user_no_permission,
        ) = find_editor_viewer_user(session=session)
        ex_user, in_user = find_external_internal_user(session=session)

        # external user
        external_user_acc = Acc(email=ex_user.email, token=None)
        res = await client.get(
            app.url_path_for(
                "case:get_all",
            ),
            headers={"Authorization": f"Bearer {external_user_acc.token}"},
        )
        assert res.status_code == 404

        # internal user
        internal_user_acc = Acc(email=in_user.email, token=None)
        res = await client.get(
            app.url_path_for(
                "case:get_all",
            ),
            headers={"Authorization": f"Bearer {internal_user_acc.token}"},
        )
        assert res.status_code == 200

        # viewer user
        viewer_user_acc = Acc(email=viewer_user.email, token=None)
        res = await client.get(
            app.url_path_for("case:get_all"),
            headers={"Authorization": f"Bearer {viewer_user_acc.token}"},
        )
        assert res.status_code == 200

        # editor user
        editor_user_acc = Acc(email=editor_user.email, token=None)
        res = await client.get(
            app.url_path_for("case:get_all"),
            headers={"Authorization": f"Bearer {editor_user_acc.token}"},
        )
        assert res.status_code == 200

        # case owner
        case_owner_acc = Acc(email=case_owner.email, token=None)
        res = await client.get(
            app.url_path_for("case:get_all"),
            headers={"Authorization": f"Bearer {case_owner_acc.token}"},
        )
        assert res.status_code == 200

    @pytest.mark.asyncio
    async def test_update_case_owner(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        (
            viewer,
            viewer_user,
            editor,
            editor_user,
            case,
            case_owner,
            user_no_permission,
        ) = find_editor_viewer_user(session=session)
        ex_user, in_user = find_external_internal_user(session=session)

        # user_no_permission user
        user_no_permission_acc = Acc(
            email=user_no_permission.email, token=None
        )
        res = await client.put(
            app.url_path_for("case:update_case_owner", case_id=case.id),
            headers={
                "Authorization": f"Bearer {user_no_permission_acc.token}"
            },
            params={"user_id": editor_user.id},
        )
        assert res.status_code == 403

        # case owner
        case_owner_acc = Acc(email=case_owner.email, token=None)
        res = await client.put(
            app.url_path_for("case:update_case_owner", case_id=case.id),
            headers={"Authorization": f"Bearer {case_owner_acc.token}"},
            params={"user_id": editor_user.id},
        )
        assert res.status_code == 200
        res = res.json()
        assert res["created_by"] != case.created_by
        assert res["created_by"] == editor_user.id

    @pytest.mark.asyncio
    async def test_user_register_with_default_organisation(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        user_payload = {
            "fullname": "Test User",
            "email": "default_organisation_user@test.org",
            "password": None,
            "role": UserRole.user.value,
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
            data=user_payload,
            headers={
                "content-type": "application/x-www-form-urlencoded",
            },
        )
        assert res.status_code == 200
        res = res.json()
        assert res == {
            "id": 22,
            "organisation": 2,
            "email": "default_organisation_user@test.org",
            "fullname": "Test User",
            "role": "user",
            "active": False,
            "company": None,
        }

    @pytest.mark.asyncio
    async def test_user_register_with_company(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        user_payload = {
            "fullname": "Company User",
            "email": "company_user@test.org",
            "password": None,
            "role": UserRole.user.value,
            "company": 1,
        }
        # without credential
        res = await client.post(
            app.url_path_for("user:register"),
            data=user_payload,
            headers={
                "content-type": "application/x-www-form-urlencoded",
            },
        )
        assert res.status_code == 200
        res = res.json()
        assert res == {
            "id": 23,
            "fullname": "Company User",
            "email": "company_user@test.org",
            "organisation": 2,
            "active": False,
            "role": "user",
            "company": 1,
        }

    @pytest.mark.asyncio
    async def test_delete_user_access_by_access_id(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # find case owner
        case = session.query(Case).order_by(Case.id.desc()).first()
        case_owner = case.created_by_user
        case_owner_acc = Acc(email=case_owner.email, token=None)
        # get all access by case id
        res = await client.get(
            app.url_path_for("case:get_user_case_access", case_id=case.id),
            headers={"Authorization": f"Bearer {case_owner_acc.token}"},
        )
        assert res.status_code == 200
        res = res.json()
        for r in res:
            assert "id" in r
            assert "label" in r
            assert "value" in r
            assert "case" in r
            assert "permission" in r

        # delete
        res = await client.delete(
            app.url_path_for("case:delete_user_case_access", case_id=case.id),
            headers={"Authorization": f"Bearer {case_owner_acc.token}"},
            params={"access_id": 4},
        )
        assert res.status_code == 204


class TestDelete:
    @pytest.mark.asyncio
    async def test_delete_user_access_by_access_id(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # delete case without cred
        res = await client.delete(app.url_path_for("case:delete", case_id=1))
        assert res.status_code == 403
        # delete user by admin
        res = await client.delete(
            app.url_path_for("case:delete", case_id=1),
            headers={"Authorization": f"Bearer {non_admin_account.token}"},
        )
        assert res.status_code == 403
        # delete user by admin
        res = await client.delete(
            app.url_path_for("case:delete", case_id=1000),
            headers={"Authorization": f"Bearer {account.token}"},
        )
        assert res.status_code == 404
        # delete user by admin
        res = await client.delete(
            app.url_path_for("case:delete", case_id=1),
            headers={"Authorization": f"Bearer {account.token}"},
        )
        assert res.status_code == 204
        # assert
        case_id = 1
        segment = (
            session.query(Segment).filter(Segment.case == case_id).count()
        )
        assert segment == 0
        # visualization
        visualization = (
            session.query(Visualization)
            .filter(Visualization.case == case_id)
            .count()
        )
        assert visualization == 0
        # case_commodity
        case_commodity = (
            session.query(CaseCommodity)
            .filter(CaseCommodity.case == case_id)
            .count()
        )
        assert case_commodity == 0
        # case tag
        case_tag = (
            session.query(CaseTag).filter(CaseTag.case == case_id).count()
        )
        assert case_tag == 0
        # user case
        user_case_access = (
            session.query(UserCaseAccess)
            .filter(UserCaseAccess.case == case_id)
            .count()
        )
        assert user_case_access == 0

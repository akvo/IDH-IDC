import sys
import pytest

from sqlalchemy.orm import Session
from fastapi import FastAPI
from httpx import AsyncClient

from tests.test_000_main import Acc
from models.case import Case
from models.user_case_access import UserCaseAccess
from models.user_business_unit import UserBusinessUnit
from models.tag import Tag


pytestmark = pytest.mark.asyncio
sys.path.append("..")


account = Acc(email="super_admin@akvo.org", token=None)
non_admin_account = Acc(email="support@akvo.org", token=None)


class TestUserDeletion:
    @pytest.mark.asyncio
    async def test_deleting_a_user_who_has_cases(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # delete not found user
        res = await client.delete(
            app.url_path_for("user:delete", user_id=1001),
            headers={"Authorization": f"Bearer {account.token}"},
        )
        assert res.status_code == 404

        case = session.query(Case).filter(Case.updated_by.is_not(None)).first()
        assert case is not None

        # delete user
        res = await client.delete(
            app.url_path_for("user:delete", user_id=case.created_by),
            headers={"Authorization": f"Bearer {account.token}"},
        )
        assert res.status_code == 409

    @pytest.mark.asyncio
    async def test_deleting_a_user_who_doesnt_have_cases(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        uca = session.query(UserCaseAccess).first()
        assert uca is not None

        deleted_user = uca.user

        # make sure deleted_user doesn't have a case
        cases = (
            session.query(Case).filter(Case.created_by == deleted_user).all()
        )
        assert cases is not None

        # make sure deleted user has updated a case
        updated_case_by_deleted_user = (
            session.query(Case).filter(Case.updated_by == deleted_user).first()
        )
        assert updated_case_by_deleted_user is None
        case = (
            session.query(Case).filter(Case.created_by != deleted_user).first()
        )
        assert case is not None
        # create a case updated by deleted user
        case.updated_by = deleted_user
        session.commit()
        session.flush()
        session.refresh(case)
        assert case.updated_by == deleted_user
        assert case.created_by != deleted_user

        # add business unit
        bu = UserBusinessUnit(
            business_unit=1, role="member", user=deleted_user
        )
        session.add(bu)
        session.commit()
        session.flush()
        session.refresh(bu)
        assert bu is not None
        assert bu.user == deleted_user

        # add tag
        tag_id = 1000
        tag = Tag(
            id=tag_id,
            name="Test Tag",
            description="Lorem ipsum",
            created_by=deleted_user,
        )
        session.add(tag)
        session.commit()
        session.flush()
        session.refresh(tag)
        assert tag is not None
        assert tag.created_by == deleted_user

        # delete user
        res = await client.delete(
            app.url_path_for("user:delete", user_id=deleted_user),
            headers={"Authorization": f"Bearer {account.token}"},
        )
        assert res.status_code == 204

        # make sure deleted user has updated a case
        updated_case_by_deleted_user = (
            session.query(Case).filter(Case.updated_by == deleted_user).first()
        )
        assert updated_case_by_deleted_user is None

        # make sure user case acess removed
        uca = (
            session.query(UserCaseAccess)
            .filter(UserCaseAccess.user == deleted_user)
            .count()
        )
        assert uca == 0

        # make sure business unit is deleted
        bu = (
            session.query(UserBusinessUnit)
            .filter(UserBusinessUnit.user == deleted_user)
            .count()
        )
        assert bu == 0

        # make sure tag created_by removed
        tag = session.query(Tag).filter(Tag.created_by == deleted_user).first()
        assert tag is None

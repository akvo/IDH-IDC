import os
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
from models.question import Question
from models.reference_data import ReferenceData
from models.user import User, UserRole
from db.crud_user import get_user_by_email

pytestmark = pytest.mark.asyncio
sys.path.append("..")


account = Acc(email="super_admin@akvo.org", token=None)
non_admin_account = Acc(email="support@akvo.org", token=None)

CLIENT_ID = os.environ.get("CLIENT_ID", None)
CLIENT_SECRET = os.environ.get("CLIENT_SECRET", None)


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
        res = res.json()
        assert res == {
            "detail": {
                "id": 1,
                "email": "super_admin@akvo.org",
                "cases": [
                    {"label": "Bali Coffee Production (Private)", "value": 2},
                    {"label": "Bali Rice and Corn with Segment", "value": 12},
                    {"label": "Case from spreadsheet import", "value": 13},
                ],
            }
        }

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

        # add question
        question_id = 1000
        question = Question(
            id=question_id, text="Test Question 1000", created_by=deleted_user
        )
        session.add(question)
        session.commit()
        session.flush()
        session.refresh(question)
        assert question is not None
        assert question.created_by == deleted_user

        # add reference_data
        reference_id = 10000
        reference = ReferenceData(
            id=reference_id,
            country=1,
            commodity=1,
            region="asia",
            currency="usd",
            year="2020",
            source="source",
            link="link",
            created_by=deleted_user,
        )
        session.add(reference)
        session.commit()
        session.flush()
        session.refresh(reference)
        assert reference is not None
        assert reference.created_by == deleted_user

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

        # make sure question created_by is None
        question = (
            session.query(Question).filter(Question.id == question_id).first()
        )
        assert question is not None
        assert question.id == question_id
        assert question.created_by is None

        # make sure reference data created by is None
        reference_data = (
            session.query(ReferenceData)
            .filter(ReferenceData.created_by == deleted_user)
            .all()
        )
        assert reference_data == []

        user = session.query(User).filter(User.id == deleted_user).first()
        assert user is None

    @pytest.mark.asyncio
    async def test_user_register_with_camel_case_email(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        user_payload = {
            "fullname": "Camel Case Email",
            "email": "Camel.Case@Test.com",
            "password": "test",
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
        assert res["email"] == "Camel.Case@Test.com"

    @pytest.mark.asyncio
    async def test_login_with_camel_case_but_typed_lowercase_email(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # approve user before login
        user = get_user_by_email(session=session, email="camel.case@test.com")
        assert user.email == "Camel.Case@Test.com"
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
        assert res["active"] is True

        # login
        res = await client.post(
            app.url_path_for("user:login"),
            headers={"content-type": "application/x-www-form-urlencoded"},
            data={
                "username": "camel.case@test.com",
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
        assert res["user"]["email"] == "Camel.Case@Test.com"

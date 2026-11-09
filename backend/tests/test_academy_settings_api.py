from datetime import date, datetime, timedelta
from unittest.mock import patch
from jose import jwt
import pytest
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy.orm import Session

from middleware import (
    ALGORITHM,
    SECRET_KEY,
    authenticate_user,
    create_access_token,
    get_password_hash,
    verify_password,
)
from models.academy.academy_models import (
    AcademyChapter,
    AcademyChapterProgressStatus,
    AcademyModule,
    AcademyUserChapterProgress,
)
from models.business_unit import BusinessUnit
from models.case import Case, LivingIncomeStudyEnum
from models.commodity import Commodity
from models.country import Country
from models.organisation import Organisation
from models.question import Question, QuestionType
from models.reference_data import ReferenceData
from models.tag import Tag
from models.user import User, UserRole
from models.user_business_unit import UserBusinessUnit, UserBusinessUnitRole
from models.user_case_access import PermissionType, UserCaseAccess
from models.user_profile import UserProfile


def get_or_create_org(session: Session, name: str = "Test Org") -> Organisation:
    org = session.query(Organisation).filter(Organisation.name == name).first()
    if not org:
        org = Organisation(id=None, name=name)
        session.add(org)
        session.commit()
        session.refresh(org)
    return org


def get_or_create_country(session: Session, name: str = "Testland") -> Country:
    country = session.query(Country).filter(Country.name == name).first()
    if not country:
        country = Country(name=name)
        session.add(country)
        session.commit()
        session.refresh(country)
    return country


def get_or_create_commodity(session: Session, name: str = "Cocoa") -> Commodity:
    commodity = session.query(Commodity).filter(Commodity.name == name).first()
    if not commodity:
        commodity = Commodity(name=name)
        session.add(commodity)
        session.commit()
        session.refresh(commodity)
    return commodity


def create_test_user(
    session: Session,
    email: str,
    password_plain: str = "initial_pass_123",
    fullname: str = "Test User",
) -> User:
    user = session.query(User).filter(User.email == email).first()
    if user:
        user.password = get_password_hash(password_plain)
        user.fullname = fullname
        session.commit()
        session.refresh(user)
        return user

    org = get_or_create_org(session)
    user = User(
        organisation=org.id,
        fullname=fullname,
        email=email,
        password=get_password_hash(password_plain),
        role=UserRole.user,
        is_active=1,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def get_auth_header(email: str) -> dict:
    token = create_access_token(data={"email": email})
    return {"Authorization": f"Bearer {token}"}


def get_expired_auth_header(email: str) -> dict:
    expire = datetime.utcnow() - timedelta(days=1)
    token = jwt.encode(
        {"email": email, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM
    )
    return {"Authorization": f"Bearer {token}"}


def get_tampered_auth_header(email: str) -> dict:
    expire = datetime.utcnow() + timedelta(days=1)
    token = jwt.encode(
        {"email": email, "exp": expire},
        "wrong_tampered_secret_key_999",
        algorithm=ALGORITHM,
    )
    return {"Authorization": f"Bearer {token}"}


class TestAcademySettingsAuth:
    """Security verification for Academy Settings endpoints."""

    @pytest.mark.asyncio
    async def test_change_password_unauthenticated(
        self, app: FastAPI, client: AsyncClient
    ):
        res = await client.post(
            app.url_path_for("academy:change_password"),
            json={
                "current_password": "current_pass",
                "new_password": "new_pass",
            },
        )
        assert res.status_code in (401, 403)

    @pytest.mark.asyncio
    async def test_delete_account_unauthenticated(
        self, app: FastAPI, client: AsyncClient
    ):
        res = await client.delete(app.url_path_for("academy:delete_account"))
        assert res.status_code in (401, 403)

    @pytest.mark.asyncio
    async def test_change_password_invalid_token(
        self, app: FastAPI, client: AsyncClient
    ):
        res = await client.post(
            app.url_path_for("academy:change_password"),
            json={
                "current_password": "current_pass",
                "new_password": "new_pass",
            },
            headers={"Authorization": "Bearer invalid_token_xyz"},
        )
        assert res.status_code == 401

    @pytest.mark.asyncio
    async def test_delete_account_invalid_token(
        self, app: FastAPI, client: AsyncClient
    ):
        res = await client.delete(
            app.url_path_for("academy:delete_account"),
            headers={"Authorization": "Bearer invalid_token_xyz"},
        )
        assert res.status_code == 401

    @pytest.mark.asyncio
    async def test_change_password_expired_jwt(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        email = "expired_pwd@test.org"
        create_test_user(session=session, email=email)
        headers = get_expired_auth_header(email)
        res = await client.post(
            app.url_path_for("academy:change_password"),
            json={"current_password": "pass", "new_password": "new_pass"},
            headers=headers,
        )
        assert res.status_code == 401

    @pytest.mark.asyncio
    async def test_delete_account_expired_jwt(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        email = "expired_del@test.org"
        create_test_user(session=session, email=email)
        headers = get_expired_auth_header(email)
        res = await client.delete(
            app.url_path_for("academy:delete_account"),
            headers=headers,
        )
        assert res.status_code == 401

    @pytest.mark.asyncio
    async def test_change_password_tampered_jwt_signature(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        email = "tampered_pwd@test.org"
        create_test_user(session=session, email=email)
        headers = get_tampered_auth_header(email)
        res = await client.post(
            app.url_path_for("academy:change_password"),
            json={"current_password": "pass", "new_password": "new_pass"},
            headers=headers,
        )
        assert res.status_code == 401

    @pytest.mark.asyncio
    async def test_delete_account_tampered_jwt_signature(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        email = "tampered_del@test.org"
        create_test_user(session=session, email=email)
        headers = get_tampered_auth_header(email)
        res = await client.delete(
            app.url_path_for("academy:delete_account"),
            headers=headers,
        )
        assert res.status_code == 401

    @pytest.mark.asyncio
    @pytest.mark.parametrize(
        "auth_header",
        [
            "Bearer",
            "Bearer ",
            "Basic dXNlcjpwYXNz",
            "Token some_arbitrary_token",
        ],
    )
    async def test_change_password_malformed_bearer_headers(
        self, app: FastAPI, client: AsyncClient, auth_header: str
    ):
        res = await client.post(
            app.url_path_for("academy:change_password"),
            json={"current_password": "pass", "new_password": "new_pass"},
            headers={"Authorization": auth_header},
        )
        assert res.status_code in (401, 403)

    @pytest.mark.asyncio
    @pytest.mark.parametrize(
        "auth_header",
        [
            "Bearer",
            "Bearer ",
            "Basic dXNlcjpwYXNz",
            "Token some_arbitrary_token",
        ],
    )
    async def test_delete_account_malformed_bearer_headers(
        self, app: FastAPI, client: AsyncClient, auth_header: str
    ):
        res = await client.delete(
            app.url_path_for("academy:delete_account"),
            headers={"Authorization": auth_header},
        )
        assert res.status_code in (401, 403)


class TestAcademyChangePassword:
    """Password modification workflow tests."""

    @pytest.mark.asyncio
    async def test_change_password_success(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        email = "pwd_success@test.org"
        initial_pass = "SecurePass_2026_A"
        new_pass = "UpdatedPass_2026_B"
        user = create_test_user(
            session=session, email=email, password_plain=initial_pass
        )

        headers = get_auth_header(email)
        res = await client.post(
            app.url_path_for("academy:change_password"),
            json={
                "current_password": initial_pass,
                "new_password": new_pass,
            },
            headers=headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["message"] == "Password changed successfully"

        # Verify old password no longer works
        session.refresh(user)
        assert not verify_password(initial_pass, user.password)
        assert not authenticate_user(session, email, initial_pass)

        # Verify new password works
        assert verify_password(new_pass, user.password)
        auth_user = authenticate_user(session, email, new_pass)
        assert auth_user is not None
        assert auth_user.id == user.id

    @pytest.mark.asyncio
    async def test_change_password_incorrect_current_password(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        email = "pwd_incorrect@test.org"
        initial_pass = "RightCurrentPass1"
        create_test_user(
            session=session, email=email, password_plain=initial_pass
        )

        headers = get_auth_header(email)
        res = await client.post(
            app.url_path_for("academy:change_password"),
            json={
                "current_password": "WrongCurrentPass1",
                "new_password": "BrandNewPass_123",
            },
            headers=headers,
        )
        assert res.status_code == 400
        assert res.json()["detail"] == "Incorrect current password"

    @pytest.mark.asyncio
    async def test_change_password_missing_fields(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        email = "pwd_missing@test.org"
        create_test_user(session=session, email=email)
        headers = get_auth_header(email)

        # Missing new_password
        res = await client.post(
            app.url_path_for("academy:change_password"),
            json={"current_password": "current_pass"},
            headers=headers,
        )
        assert res.status_code == 422

        # Empty body
        res = await client.post(
            app.url_path_for("academy:change_password"),
            json={},
            headers=headers,
        )
        assert res.status_code == 422

    @pytest.mark.asyncio
    async def test_change_password_empty_strings(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        email = "pwd_empty@test.org"
        create_test_user(session=session, email=email)
        headers = get_auth_header(email)

        res = await client.post(
            app.url_path_for("academy:change_password"),
            json={"current_password": "", "new_password": ""},
            headers=headers,
        )
        assert res.status_code == 422

    @pytest.mark.asyncio
    async def test_change_password_successive_transitions(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        email = "pwd_successive@test.org"
        p1 = "InitialPass_Stage1"
        p2 = "SecondPass_Stage2"
        p3 = "ThirdPass_Stage3"
        p4 = "FourthPass_Stage4"

        user = create_test_user(session=session, email=email, password_plain=p1)
        headers = get_auth_header(email)

        # Transition 1: P1 -> P2
        res1 = await client.post(
            app.url_path_for("academy:change_password"),
            json={"current_password": p1, "new_password": p2},
            headers=headers,
        )
        assert res1.status_code == 200
        session.refresh(user)
        assert not verify_password(p1, user.password)
        assert verify_password(p2, user.password)
        assert not authenticate_user(session, email, p1)
        assert authenticate_user(session, email, p2)

        # Transition 2: P2 -> P3
        res2 = await client.post(
            app.url_path_for("academy:change_password"),
            json={"current_password": p2, "new_password": p3},
            headers=headers,
        )
        assert res2.status_code == 200
        session.refresh(user)
        assert not verify_password(p2, user.password)
        assert verify_password(p3, user.password)
        assert not authenticate_user(session, email, p2)
        assert authenticate_user(session, email, p3)

        # Transition 3: P3 -> P4
        res3 = await client.post(
            app.url_path_for("academy:change_password"),
            json={"current_password": p3, "new_password": p4},
            headers=headers,
        )
        assert res3.status_code == 200
        session.refresh(user)
        assert not verify_password(p3, user.password)
        assert verify_password(p4, user.password)
        assert not authenticate_user(session, email, p3)
        assert authenticate_user(session, email, p4)

    @pytest.mark.asyncio
    async def test_change_password_special_characters_and_spaces(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        email = "pwd_special@test.org"
        initial_pass = "BasicPass_123"
        special_pass = " !@#$%^&*()_+~|}{[]:;?><,./ pass with space "
        user = create_test_user(
            session=session, email=email, password_plain=initial_pass
        )
        headers = get_auth_header(email)

        res = await client.post(
            app.url_path_for("academy:change_password"),
            json={
                "current_password": initial_pass,
                "new_password": special_pass,
            },
            headers=headers,
        )
        assert res.status_code == 200
        session.refresh(user)
        assert verify_password(special_pass, user.password)
        auth_user = authenticate_user(session, email, special_pass)
        assert auth_user is not None
        assert auth_user.id == user.id

        # Verify whitespace preservation (trimmed string must fail authentication)
        assert not authenticate_user(session, email, special_pass.strip())

    @pytest.mark.asyncio
    async def test_change_password_unicode_and_emojis(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        email = "pwd_unicode@test.org"
        initial_pass = "BasicPass_456"
        unicode_pass = "パスワード🔑123🔒ÜberSecret✨"
        user = create_test_user(
            session=session, email=email, password_plain=initial_pass
        )
        headers = get_auth_header(email)

        res = await client.post(
            app.url_path_for("academy:change_password"),
            json={
                "current_password": initial_pass,
                "new_password": unicode_pass,
            },
            headers=headers,
        )
        assert res.status_code == 200
        session.refresh(user)
        assert verify_password(unicode_pass, user.password)
        auth_user = authenticate_user(session, email, unicode_pass)
        assert auth_user is not None
        assert auth_user.id == user.id
        assert not authenticate_user(session, email, "パスワード🔑123")

    @pytest.mark.asyncio
    async def test_change_password_null_values(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        email = "pwd_null@test.org"
        create_test_user(session=session, email=email)
        headers = get_auth_header(email)

        # current_password is null
        res1 = await client.post(
            app.url_path_for("academy:change_password"),
            json={"current_password": None, "new_password": "NewValidPass_1"},
            headers=headers,
        )
        assert res1.status_code == 422

        # new_password is null
        res2 = await client.post(
            app.url_path_for("academy:change_password"),
            json={
                "current_password": "CurrentValidPass_1",
                "new_password": None,
            },
            headers=headers,
        )
        assert res2.status_code == 422

        # both are null
        res3 = await client.post(
            app.url_path_for("academy:change_password"),
            json={"current_password": None, "new_password": None},
            headers=headers,
        )
        assert res3.status_code == 422

    @pytest.mark.asyncio
    async def test_change_password_non_json_body(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        email = "pwd_nonjson@test.org"
        create_test_user(session=session, email=email)
        headers = get_auth_header(email)
        headers["Content-Type"] = "application/json"

        res = await client.post(
            app.url_path_for("academy:change_password"),
            content=b"not-a-valid-json-payload",
            headers=headers,
        )
        assert res.status_code == 422

    @pytest.mark.asyncio
    async def test_change_password_same_password(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        email = "pwd_same@test.org"
        same_pass = "IdenticalPass_123"
        user = create_test_user(
            session=session, email=email, password_plain=same_pass
        )
        headers = get_auth_header(email)

        res = await client.post(
            app.url_path_for("academy:change_password"),
            json={
                "current_password": same_pass,
                "new_password": same_pass,
            },
            headers=headers,
        )
        assert res.status_code == 200
        session.refresh(user)
        assert verify_password(same_pass, user.password)
        assert authenticate_user(session, email, same_pass) is not None


class TestAcademyDeleteAccount:
    """Self-service learner account deletion tests."""

    @pytest.mark.asyncio
    async def test_delete_account_blocked_if_user_owns_cases(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        email = "owner_learner@test.org"
        user = create_test_user(session=session, email=email)
        user_id = user.id

        country = get_or_create_country(session)
        commodity = get_or_create_commodity(session)

        # Create a case owned by this user
        owned_case = Case(
            name="Learner Blocked Case",
            date=date(2025, 1, 1),
            year=2025,
            country=country.id,
            focus_commodity=commodity.id,
            currency="USD",
            area_size_unit="hectare",
            volume_measurement_unit="liters",
            cost_of_production_unit="Per-area",
            segmentation=0,
            reporting_period="Per-season",
            living_income_study=LivingIncomeStudyEnum.better_income.value,
            description="Case blocking deletion",
            multiple_commodities=0,
            logo=None,
            created_by=user_id,
        )
        session.add(owned_case)
        session.commit()
        session.refresh(owned_case)

        headers = get_auth_header(email)
        res = await client.delete(
            app.url_path_for("academy:delete_account"), headers=headers
        )
        assert res.status_code == 409
        detail = res.json()["detail"]
        assert (
            "Cannot delete account: user owns existing cases"
            in detail["message"]
        )
        assert len(detail["cases"]) >= 1
        assert any(c["value"] == owned_case.id for c in detail["cases"])

        # Verify user still exists
        user_in_db = session.query(User).filter(User.id == user_id).first()
        assert user_in_db is not None

        # Clean up case so other tests are clean
        session.delete(owned_case)
        session.commit()

    @pytest.mark.asyncio
    async def test_delete_account_blocked_if_user_owns_multiple_cases(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        email = "owner_multi_case@test.org"
        user = create_test_user(session=session, email=email)
        user_id = user.id

        country = get_or_create_country(session)
        commodity = get_or_create_commodity(session)

        case_names = [
            "Case Multi 1 - Cocoa",
            "Case Multi 2 - Coffee",
            "Case Multi 3 - Tea",
        ]
        created_cases = []
        for name in case_names:
            c = Case(
                name=name,
                date=date(2025, 1, 1),
                year=2025,
                country=country.id,
                focus_commodity=commodity.id,
                currency="USD",
                area_size_unit="hectare",
                volume_measurement_unit="liters",
                cost_of_production_unit="Per-area",
                segmentation=0,
                reporting_period="Per-season",
                living_income_study=LivingIncomeStudyEnum.better_income.value,
                description="Multi case owner blocking test",
                multiple_commodities=0,
                logo=None,
                created_by=user_id,
            )
            session.add(c)
            created_cases.append(c)
        session.commit()
        for c in created_cases:
            session.refresh(c)

        headers = get_auth_header(email)
        res = await client.delete(
            app.url_path_for("academy:delete_account"), headers=headers
        )
        assert res.status_code == 409
        detail = res.json()["detail"]
        assert (
            "Cannot delete account: user owns existing cases"
            in detail["message"]
        )
        cases_payload = detail["cases"]
        assert len(cases_payload) >= 3

        returned_ids = {c["value"] for c in cases_payload}
        returned_labels = {c["label"] for c in cases_payload}
        for c in created_cases:
            assert c.id in returned_ids
            assert c.name in returned_labels

        # Verify user was not deleted
        session.expire_all()
        assert session.query(User).filter(User.id == user_id).first() is not None

        # Clean up cases
        for c in created_cases:
            session.delete(c)
        session.commit()

    @pytest.mark.asyncio
    async def test_delete_account_success_clean_user(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        email = "clean_delete_learner@test.org"
        user = create_test_user(session=session, email=email)
        user_id = user.id

        # Ensure user has a profile
        profile = (
            session.query(UserProfile)
            .filter(UserProfile.user_id == user_id)
            .first()
        )
        if not profile:
            profile = UserProfile(
                user_id=user_id,
                first_name="Clean",
                last_name="Learner",
            )
            session.add(profile)
            session.commit()

        # Ensure user has chapter progress
        module = session.query(AcademyModule).first()
        if not module:
            module = AcademyModule(title="Test Mod", order_index=1)
            session.add(module)
            session.commit()
            session.refresh(module)

        chapter = (
            session.query(AcademyChapter)
            .filter(AcademyChapter.module_id == module.id)
            .first()
        )
        if not chapter:
            chapter = AcademyChapter(
                module_id=module.id,
                chapter_number=1,
                title="Test Chap",
                estimated_minutes=10,
            )
            session.add(chapter)
            session.commit()
            session.refresh(chapter)

        progress = (
            session.query(AcademyUserChapterProgress)
            .filter(
                AcademyUserChapterProgress.user_id == user_id,
                AcademyUserChapterProgress.chapter_id == chapter.id,
            )
            .first()
        )
        if not progress:
            progress = AcademyUserChapterProgress(
                user_id=user_id,
                chapter_id=chapter.id,
                status=AcademyChapterProgressStatus.in_progress,
            )
            session.add(progress)
            session.commit()

        headers = get_auth_header(email)
        res = await client.delete(
            app.url_path_for("academy:delete_account"), headers=headers
        )
        assert res.status_code == 204

        # Verify user, profile, progress are deleted
        session.expire_all()
        assert session.query(User).filter(User.id == user_id).first() is None
        assert (
            session.query(UserProfile)
            .filter(UserProfile.user_id == user_id)
            .first()
            is None
        )
        assert (
            session.query(AcademyUserChapterProgress)
            .filter(AcademyUserChapterProgress.user_id == user_id)
            .count()
            == 0
        )

    @pytest.mark.asyncio
    async def test_delete_account_unlinks_secondary_fks(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user_owner = create_test_user(
            session=session, email="case_owner@test.org"
        )
        user_learner = create_test_user(
            session=session, email="secondary_fk@test.org"
        )
        user_owner_id = user_owner.id
        user_learner_id = user_learner.id

        country = get_or_create_country(session)
        commodity = get_or_create_commodity(session)

        # 1. Case updated_by learner
        case = Case(
            name="Secondary FK Case",
            date=date(2025, 1, 1),
            year=2025,
            country=country.id,
            focus_commodity=commodity.id,
            currency="USD",
            area_size_unit="hectare",
            volume_measurement_unit="liters",
            cost_of_production_unit="Per-area",
            segmentation=0,
            reporting_period="Per-season",
            living_income_study=LivingIncomeStudyEnum.better_income.value,
            description="Secondary FK test",
            multiple_commodities=0,
            logo=None,
            created_by=user_owner_id,
            updated_by=user_learner_id,
        )
        session.add(case)
        session.commit()
        session.refresh(case)

        # 2. Case access for learner
        uca = UserCaseAccess(
            case=case.id, user=user_learner_id, permission=PermissionType.view
        )
        session.add(uca)

        # 3. Business unit for learner
        bu = session.query(BusinessUnit).first()
        if not bu:
            bu = BusinessUnit(name="Test BU")
            session.add(bu)
            session.commit()
            session.refresh(bu)
        ubu = UserBusinessUnit(
            business_unit=bu.id,
            user=user_learner_id,
            role=UserBusinessUnitRole.member,
        )
        session.add(ubu)

        # 4. Tag created by learner
        tag = Tag(name="Learner Tag", created_by=user_learner_id)
        session.add(tag)

        # 5. Question created by learner
        q = Question(
            text="Learner Question",
            question_type=QuestionType.question,
            created_by=user_learner_id,
        )
        session.add(q)

        # 6. Reference data created by learner
        ref = ReferenceData(
            country=country.id,
            commodity=commodity.id,
            region="Region 1",
            currency="USD",
            year="2025",
            source="Source",
            link="http://example.com",
            created_by=user_learner_id,
        )
        session.add(ref)
        session.commit()
        session.refresh(case)
        session.refresh(tag)
        session.refresh(q)
        session.refresh(ref)

        headers = get_auth_header(user_learner.email)
        res = await client.delete(
            app.url_path_for("academy:delete_account"), headers=headers
        )
        assert res.status_code == 204

        session.expire_all()
        # Verify user is deleted
        assert (
            session.query(User).filter(User.id == user_learner_id).first()
            is None
        )

        # Verify case updated_by reverted to created_by
        refreshed_case = session.query(Case).filter(Case.id == case.id).first()
        assert refreshed_case is not None
        assert refreshed_case.updated_by == user_owner_id

        # Verify case access removed
        assert (
            session.query(UserCaseAccess)
            .filter(UserCaseAccess.user == user_learner_id)
            .count()
            == 0
        )

        # Verify user business units removed
        assert (
            session.query(UserBusinessUnit)
            .filter(UserBusinessUnit.user == user_learner_id)
            .count()
            == 0
        )

        # Verify tag created_by is None
        refreshed_tag = session.query(Tag).filter(Tag.id == tag.id).first()
        assert refreshed_tag.created_by is None

        # Verify question created_by is None
        refreshed_q = (
            session.query(Question).filter(Question.id == q.id).first()
        )
        assert refreshed_q.created_by is None

        # Verify reference created_by is None
        refreshed_ref = (
            session.query(ReferenceData)
            .filter(ReferenceData.id == ref.id)
            .first()
        )
        assert refreshed_ref.created_by is None

        # Cleanup case
        session.delete(refreshed_case)
        session.commit()

    @pytest.mark.asyncio
    async def test_delete_account_multi_fk_comprehensive_matrix(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        owner = create_test_user(
            session=session,
            email="matrix_owner@test.org",
            fullname="Matrix Owner",
        )
        learner = create_test_user(
            session=session,
            email="matrix_learner@test.org",
            fullname="Matrix Learner",
        )
        owner_id = owner.id
        learner_id = learner.id

        country = get_or_create_country(session)
        commodity = get_or_create_commodity(session)

        # 1. UserProfile for learner
        profile = (
            session.query(UserProfile)
            .filter(UserProfile.user_id == learner_id)
            .first()
        )
        if not profile:
            profile = UserProfile(
                user_id=learner_id,
                first_name="Matrix",
                last_name="Learner",
            )
            session.add(profile)
            session.commit()

        # 2. Modules & Chapters progress (multi-chapter, multi-module)
        m1 = AcademyModule(title="Matrix Mod 1", order_index=90)
        m2 = AcademyModule(title="Matrix Mod 2", order_index=91)
        session.add_all([m1, m2])
        session.commit()
        session.refresh(m1)
        session.refresh(m2)

        ch1 = AcademyChapter(
            module_id=m1.id, chapter_number=1, title="M1C1", estimated_minutes=5
        )
        ch2 = AcademyChapter(
            module_id=m1.id, chapter_number=2, title="M1C2", estimated_minutes=5
        )
        ch3 = AcademyChapter(
            module_id=m2.id, chapter_number=1, title="M2C1", estimated_minutes=5
        )
        session.add_all([ch1, ch2, ch3])
        session.commit()
        session.refresh(ch1)
        session.refresh(ch2)
        session.refresh(ch3)

        prog1 = AcademyUserChapterProgress(
            user_id=learner_id,
            chapter_id=ch1.id,
            status=AcademyChapterProgressStatus.completed,
        )
        prog2 = AcademyUserChapterProgress(
            user_id=learner_id,
            chapter_id=ch2.id,
            status=AcademyChapterProgressStatus.in_progress,
        )
        prog3 = AcademyUserChapterProgress(
            user_id=learner_id,
            chapter_id=ch3.id,
            status=AcademyChapterProgressStatus.completed,
        )
        session.add_all([prog1, prog2, prog3])

        # 3. Multiple Cases owned by owner, updated_by learner
        c1 = Case(
            name="Matrix Owner Case 1",
            date=date(2025, 1, 1),
            year=2025,
            country=country.id,
            focus_commodity=commodity.id,
            currency="USD",
            area_size_unit="hectare",
            volume_measurement_unit="liters",
            cost_of_production_unit="Per-area",
            segmentation=0,
            reporting_period="Per-season",
            living_income_study=LivingIncomeStudyEnum.better_income.value,
            description="Matrix case 1",
            multiple_commodities=0,
            logo=None,
            created_by=owner_id,
            updated_by=learner_id,
        )
        c2 = Case(
            name="Matrix Owner Case 2",
            date=date(2025, 1, 1),
            year=2025,
            country=country.id,
            focus_commodity=commodity.id,
            currency="USD",
            area_size_unit="hectare",
            volume_measurement_unit="liters",
            cost_of_production_unit="Per-area",
            segmentation=0,
            reporting_period="Per-season",
            living_income_study=LivingIncomeStudyEnum.better_income.value,
            description="Matrix case 2",
            multiple_commodities=0,
            logo=None,
            created_by=owner_id,
            updated_by=learner_id,
        )
        session.add_all([c1, c2])
        session.commit()
        session.refresh(c1)
        session.refresh(c2)

        # 4. UserCaseAccess (view & edit)
        uca1 = UserCaseAccess(
            case=c1.id, user=learner_id, permission=PermissionType.view
        )
        uca2 = UserCaseAccess(
            case=c2.id, user=learner_id, permission=PermissionType.edit
        )
        session.add_all([uca1, uca2])

        # 5. UserBusinessUnit (admin & member)
        bu1 = BusinessUnit(name="Matrix BU 1")
        bu2 = BusinessUnit(name="Matrix BU 2")
        session.add_all([bu1, bu2])
        session.commit()
        session.refresh(bu1)
        session.refresh(bu2)

        ubu1 = UserBusinessUnit(
            business_unit=bu1.id,
            user=learner_id,
            role=UserBusinessUnitRole.admin,
        )
        ubu2 = UserBusinessUnit(
            business_unit=bu2.id,
            user=learner_id,
            role=UserBusinessUnitRole.member,
        )
        session.add_all([ubu1, ubu2])

        # 6. Multiple Tags created by learner
        tag1 = Tag(name="Matrix Tag 1", created_by=learner_id)
        tag2 = Tag(name="Matrix Tag 2", created_by=learner_id)
        session.add_all([tag1, tag2])

        # 7. Multiple Questions created by learner
        q1 = Question(
            text="Matrix Question 1",
            question_type=QuestionType.question,
            created_by=learner_id,
        )
        q2 = Question(
            text="Matrix Question 2",
            question_type=QuestionType.question,
            created_by=learner_id,
        )
        session.add_all([q1, q2])

        # 8. Multiple ReferenceData created by learner
        r1 = ReferenceData(
            country=country.id,
            commodity=commodity.id,
            region="Reg 1",
            currency="USD",
            year="2025",
            source="Source 1",
            link="http://example.com/1",
            created_by=learner_id,
        )
        r2 = ReferenceData(
            country=country.id,
            commodity=commodity.id,
            region="Reg 2",
            currency="USD",
            year="2025",
            source="Source 2",
            link="http://example.com/2",
            created_by=learner_id,
        )
        session.add_all([r1, r2])
        session.commit()

        session.refresh(tag1)
        session.refresh(tag2)
        session.refresh(q1)
        session.refresh(q2)
        session.refresh(r1)
        session.refresh(r2)

        # Perform deletion
        headers = get_auth_header(learner.email)
        res = await client.delete(
            app.url_path_for("academy:delete_account"), headers=headers
        )
        assert res.status_code == 204

        session.expire_all()
        # Verify learner user and user profile are deleted
        assert session.query(User).filter(User.id == learner_id).first() is None
        assert (
            session.query(UserProfile)
            .filter(UserProfile.user_id == learner_id)
            .first()
            is None
        )

        # Verify all chapter progress for learner purged
        assert (
            session.query(AcademyUserChapterProgress)
            .filter(AcademyUserChapterProgress.user_id == learner_id)
            .count()
            == 0
        )

        # Verify all case access records purged
        assert (
            session.query(UserCaseAccess)
            .filter(UserCaseAccess.user == learner_id)
            .count()
            == 0
        )

        # Verify all business unit memberships purged
        assert (
            session.query(UserBusinessUnit)
            .filter(UserBusinessUnit.user == learner_id)
            .count()
            == 0
        )

        # Verify cases updated_by reverted to owner
        refreshed_c1 = session.query(Case).filter(Case.id == c1.id).first()
        refreshed_c2 = session.query(Case).filter(Case.id == c2.id).first()
        assert refreshed_c1.updated_by == owner_id
        assert refreshed_c2.updated_by == owner_id

        # Verify tags, questions, and reference data created_by safely set to None
        assert (
            session.query(Tag).filter(Tag.id == tag1.id).first().created_by
            is None
        )
        assert (
            session.query(Tag).filter(Tag.id == tag2.id).first().created_by
            is None
        )
        assert (
            session.query(Question).filter(Question.id == q1.id).first().created_by
            is None
        )
        assert (
            session.query(Question).filter(Question.id == q2.id).first().created_by
            is None
        )
        assert (
            session.query(ReferenceData)
            .filter(ReferenceData.id == r1.id)
            .first()
            .created_by
            is None
        )
        assert (
            session.query(ReferenceData)
            .filter(ReferenceData.id == r2.id)
            .first()
            .created_by
            is None
        )

        # Clean up cases, modules, chapters
        session.delete(refreshed_c1)
        session.delete(refreshed_c2)
        session.delete(ch1)
        session.delete(ch2)
        session.delete(ch3)
        session.delete(m1)
        session.delete(m2)
        session.commit()

    @pytest.mark.asyncio
    async def test_subsequent_request_with_deleted_user_token_rejected(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        email = "token_rejected_learner@test.org"
        create_test_user(session=session, email=email)
        headers = get_auth_header(email)

        # Delete account
        del_res = await client.delete(
            app.url_path_for("academy:delete_account"), headers=headers
        )
        assert del_res.status_code == 204

        # Subsequent authenticated requests should fail (user no longer exists in DB)
        profile_res = await client.get(
            app.url_path_for("academy:get_profile"), headers=headers
        )
        assert profile_res.status_code in (401, 404)
        assert profile_res.json()["detail"] == "Could not validate credentials"

        change_pwd_res = await client.post(
            app.url_path_for("academy:change_password"),
            json={"current_password": "pass", "new_password": "new_pass"},
            headers=headers,
        )
        assert change_pwd_res.status_code in (401, 404)
        assert change_pwd_res.json()["detail"] == "Could not validate credentials"

    @pytest.mark.asyncio
    async def test_post_deletion_lockdown_all_academy_endpoints(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        email = "lockdown_learner@test.org"
        user = create_test_user(session=session, email=email)
        headers = get_auth_header(email)

        # Add profile
        profile = (
            session.query(UserProfile)
            .filter(UserProfile.user_id == user.id)
            .first()
        )
        if not profile:
            profile = UserProfile(
                user_id=user.id,
                first_name="Lockdown",
                last_name="Learner",
            )
            session.add(profile)
            session.commit()

        # Delete account
        del_res = await client.delete(
            app.url_path_for("academy:delete_account"), headers=headers
        )
        assert del_res.status_code == 204

        # Verify all authenticated academy routes lock out the deleted user token
        endpoints_to_test = [
            ("DELETE", app.url_path_for("academy:delete_account"), None),
            (
                "POST",
                app.url_path_for("academy:change_password"),
                {"current_password": "pass", "new_password": "new"},
            ),
            ("GET", app.url_path_for("academy:get_profile"), None),
            (
                "PUT",
                app.url_path_for("academy:update_profile"),
                {"first_name": "Ghost"},
            ),
            ("GET", app.url_path_for("academy:get_overview"), None),
            ("GET", app.url_path_for("academy:get_reading_history"), None),
            (
                "POST",
                app.url_path_for("academy:update_chapter_progress", chapter_id=1),
                {"status": "completed"},
            ),
        ]

        for method, path, payload in endpoints_to_test:
            if method == "GET":
                res = await client.get(path, headers=headers)
            elif method == "DELETE":
                res = await client.delete(path, headers=headers)
            elif method == "POST":
                res = await client.post(path, json=payload, headers=headers)
            elif method == "PUT":
                res = await client.put(path, json=payload, headers=headers)

            assert res.status_code in (401, 404), (
                f"Endpoint {method} {path} returned {res.status_code} "
                "instead of 401/404"
            )
            assert res.json()["detail"] == "Could not validate credentials"

    @pytest.mark.asyncio
    async def test_delete_account_db_error_resilience_and_rollback(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        email = "resilience_learner@test.org"
        user = create_test_user(session=session, email=email)
        user_id = user.id
        headers = get_auth_header(email)

        profile = (
            session.query(UserProfile)
            .filter(UserProfile.user_id == user_id)
            .first()
        )
        if not profile:
            profile = UserProfile(
                user_id=user_id,
                first_name="Resilience",
                last_name="Tester",
            )
            session.add(profile)
            session.commit()

        # Simulate unexpected DB failure during user deletion
        with patch(
            "db.academy.crud_settings.crud_user.delete_user",
            side_effect=RuntimeError("Simulated DB connection failure"),
        ):
            try:
                res = await client.delete(
                    app.url_path_for("academy:delete_account"), headers=headers
                )
                assert res.status_code == 500
            except RuntimeError as exc:
                assert "Simulated DB connection failure" in str(exc)

        # Verify transaction rollback: user and profile remain completely intact
        session.expire_all()
        assert session.query(User).filter(User.id == user_id).first() is not None
        assert (
            session.query(UserProfile)
            .filter(UserProfile.user_id == user_id)
            .first()
            is not None
        )

        # Successful deletion after failure recovered
        res_recovered = await client.delete(
            app.url_path_for("academy:delete_account"), headers=headers
        )
        assert res_recovered.status_code == 204

        session.expire_all()
        assert session.query(User).filter(User.id == user_id).first() is None
        assert (
            session.query(UserProfile)
            .filter(UserProfile.user_id == user_id)
            .first()
            is None
        )

from datetime import datetime, timedelta
from jose import jwt
import pytest
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy.orm import Session

from middleware import create_access_token, SECRET_KEY, ALGORITHM
from db.academy import crud_course
from models.academy import (
    AcademyChapter,
    AcademyChapterProgressStatus,
    AcademyModule,
    AcademyTag,
    AcademyUserChapterProgress,
)
from models.organisation import Organisation
from models.user import User, UserRole
from models.user_profile import UserProfile
from seeder.academy import seed_academy


@pytest.fixture(autouse=True)
def ensure_academy_seeded(app: FastAPI, session: Session):
    """Ensure academy curriculum data is seeded prior to test runs."""
    tag_count = session.query(AcademyTag).count()
    module_count = session.query(AcademyModule).count()
    if tag_count == 0 or module_count == 0:
        seed_academy(session=session)
    yield
    session.rollback()


def get_or_create_test_user(
    session: Session,
    email: str = "academy_learner@test.org",
    fullname: str = "Learner One",
) -> User:
    """Helper to retrieve or instantiate an active test learner."""
    user = session.query(User).filter(User.email == email).first()
    if not user:
        org = session.query(Organisation).first()
        if not org:
            org = Organisation(id=None, name="Test Organisation")
            session.add(org)
            session.commit()
            session.refresh(org)
        user = User(
            organisation=org.id,
            fullname=fullname,
            email=email,
            password="test_hashed_password",
            role=UserRole.user,
            is_active=1,
        )
        session.add(user)
        session.commit()
        session.refresh(user)
    else:
        user.fullname = fullname
        session.commit()
    return user


def get_auth_header(email: str) -> dict:
    """Generate bearer auth header for the given email."""
    token = create_access_token(data={"email": email})
    return {"Authorization": f"Bearer {token}"}


class TestAcademyAuthGuard:
    """Verify all 6 endpoints reject unauthenticated requests with 401/403."""

    @pytest.mark.asyncio
    async def test_endpoints_reject_unauthenticated_access(
        self, app: FastAPI, client: AsyncClient
    ):
        endpoints = [
            ("GET", app.url_path_for("academy:get_tags")),
            ("GET", app.url_path_for("academy:get_overview")),
            ("GET", app.url_path_for("academy:get_modules")),
            ("GET", app.url_path_for("academy:get_chapter_detail",
                                     chapter_id=1)),
            ("POST", app.url_path_for("academy:update_chapter_progress",
                                      chapter_id=1)),
            ("GET", app.url_path_for("academy:get_reading_history")),
        ]

        for method, url in endpoints:
            if method == "GET":
                res = await client.get(url)
            else:
                res = await client.post(url, json={"status": "in_progress"})
            assert res.status_code in (401, 403), f"Failed auth guard on {url}"


class TestAcademyTagsApi:
    """Verify GET /academy/tags endpoint behaviour and count aggregations."""

    @pytest.mark.asyncio
    async def test_get_tags_success_and_structure(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(session, "tag_user@test.org")
        headers = get_auth_header(user.email)

        res = await client.get(
            app.url_path_for("academy:get_tags"), headers=headers
        )
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)
        assert len(data) == 10

        first_tag = data[0]
        expected_keys = {
            "id",
            "name",
            "slug",
            "order_index",
            "module_count",
            "chapter_count",
        }
        assert expected_keys.issubset(first_tag.keys())
        assert first_tag["name"] == "Income measurement"
        assert first_tag["slug"] == "income-measurement"

        # Verify module_count and chapter_count are non-negative integers
        for item in data:
            assert isinstance(item["module_count"], int)
            assert item["module_count"] >= 0
            assert isinstance(item["chapter_count"], int)
            assert item["chapter_count"] >= 0

        # Tag 1 should have linked modules or chapters from seeder
        tag1 = next(t for t in data if t["slug"] == "income-measurement")
        assert tag1["module_count"] >= 1


class TestAcademyOverviewApi:
    """Verify GET /academy/overview KPIs, greeting name, and zero-progress."""

    @pytest.mark.asyncio
    async def test_overview_zero_progress_registered_user(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        email = "fresh_learner@test.org"
        user = get_or_create_test_user(session, email, "Fresh Learner")
        # Ensure user has no progress rows
        session.query(AcademyUserChapterProgress).filter(
            AcademyUserChapterProgress.user_id == user.id
        ).delete()
        session.commit()

        headers = get_auth_header(user.email)
        res = await client.get(
            app.url_path_for("academy:get_overview"), headers=headers
        )
        assert res.status_code == 200
        data = res.json()

        # Check greeting
        assert data["greeting_name"] == "Fresh Learner"

        # Check metrics zero safe
        metrics = data["metrics"]
        assert metrics["academy_progress_pct"] == 0
        assert metrics["modules_completed"] == 0
        assert metrics["total_modules"] == 6
        assert metrics["modules_completed_pct"] == 0
        assert metrics["chapters_completed"] == 0
        assert metrics["total_chapters"] == 27
        assert metrics["chapters_completed_pct"] == 0

        # Check modules overview list
        modules = data["modules"]
        assert len(modules) == 6
        for mod in modules:
            assert mod["progress_pct"] == 0
            assert mod["status"] == "Not started"
            assert isinstance(mod["tags"], list)

        # Check continue chapter defaults to the first chapter in course
        first_chap = (
            session.query(AcademyChapter)
            .join(AcademyModule, AcademyChapter.module_id == AcademyModule.id)
            .order_by(
                AcademyModule.order_index.asc(),
                AcademyChapter.chapter_number.asc(),
            )
            .first()
        )
        assert data["continue_chapter_id"] == first_chap.id

        # Check recently_opened is empty
        assert data["recently_opened"] == []

    @pytest.mark.asyncio
    async def test_overview_greeting_name_priority(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        # 1. User with UserProfile first_name
        email = "profile_user@test.org"
        user = get_or_create_test_user(session, email, "Full User Name")
        profile = (
            session.query(UserProfile)
            .filter(UserProfile.user_id == user.id)
            .first()
        )
        if not profile:
            profile = UserProfile(
                user_id=user.id,
                first_name="Amelia",
                last_name="Earhart",
            )
            session.add(profile)
        else:
            profile.first_name = "Amelia"
            profile.last_name = "Earhart"
        session.commit()

        headers = get_auth_header(user.email)
        res = await client.get(
            app.url_path_for("academy:get_overview"), headers=headers
        )
        assert res.status_code == 200
        assert res.json()["greeting_name"] == "Amelia"

        # 2. User with no UserProfile fallback to user.fullname
        email2 = "no_profile@test.org"
        user2 = get_or_create_test_user(session, email2, "Bob Builder")
        session.query(UserProfile).filter(
            UserProfile.user_id == user2.id
        ).delete()
        session.commit()

        headers2 = get_auth_header(user2.email)
        res2 = await client.get(
            app.url_path_for("academy:get_overview"), headers=headers2
        )
        assert res2.status_code == 200
        assert res2.json()["greeting_name"] == "Bob Builder"

        # 3. User with empty fullname fallback to email prefix
        email3 = "empty_fullname@test.org"
        user3 = get_or_create_test_user(session, email3, "")
        headers3 = get_auth_header(user3.email)
        res3 = await client.get(
            app.url_path_for("academy:get_overview"), headers=headers3
        )
        assert res3.status_code == 200
        assert res3.json()["greeting_name"] == "empty_fullname"

    @pytest.mark.asyncio
    async def test_overview_all_chapters_completed_100_percent(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        email = "completed_all_learner@test.org"
        user = get_or_create_test_user(session, email, "Completed All")
        headers = get_auth_header(user.email)

        # Clear existing progress for user
        session.query(AcademyUserChapterProgress).filter(
            AcademyUserChapterProgress.user_id == user.id
        ).delete()
        session.commit()

        chapters = (
            session.query(AcademyChapter)
            .join(AcademyModule, AcademyChapter.module_id == AcademyModule.id)
            .order_by(
                AcademyModule.order_index.asc(),
                AcademyChapter.chapter_number.asc(),
            )
            .all()
        )
        assert len(chapters) == 27

        now = datetime.utcnow()
        for chap in chapters:
            prog = AcademyUserChapterProgress(
                user_id=user.id,
                chapter_id=chap.id,
                status=AcademyChapterProgressStatus.completed,
                last_opened_at=now,
                completed_at=now,
            )
            session.add(prog)
        session.commit()

        res = await client.get(
            app.url_path_for("academy:get_overview"), headers=headers
        )
        assert res.status_code == 200
        data = res.json()
        metrics = data["metrics"]

        assert metrics["academy_progress_pct"] == 100
        assert metrics["modules_completed"] == 6
        assert metrics["total_modules"] == 6
        assert metrics["modules_completed_pct"] == 100
        assert metrics["chapters_completed"] == 27
        assert metrics["total_chapters"] == 27
        assert metrics["chapters_completed_pct"] == 100

        # All module statuses are "Completed"
        assert len(data["modules"]) == 6
        for mod in data["modules"]:
            assert mod["status"] == "Completed"
            assert mod["progress_pct"] == 100

        # continue_chapter_id cleanly falls back to chapter 1
        first_chap = chapters[0]
        assert data["continue_chapter_id"] == first_chap.id


class TestAcademyModulesApi:
    """Verify GET /academy/modules listing, nested chapters, and filters."""

    @pytest.mark.asyncio
    async def test_get_modules_unfiltered(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(session, "mod_user@test.org")
        headers = get_auth_header(user.email)

        res = await client.get(
            app.url_path_for("academy:get_modules"), headers=headers
        )
        assert res.status_code == 200
        data = res.json()
        assert data["total_modules"] == 6
        assert data["course_summary_html"] is not None
        assert len(data["modules"]) == 6

        # Verify module 1 chapters
        mod1 = data["modules"][0]
        assert mod1["order_index"] == 1
        assert len(mod1["chapters"]) > 0
        chap1 = mod1["chapters"][0]
        assert chap1["chapter_number"] == 1
        assert "id" in chap1
        assert "title" in chap1
        assert "estimated_minutes" in chap1
        assert "status" in chap1
        assert "tags" in chap1

    @pytest.mark.asyncio
    async def test_get_modules_search_filter(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(session, "mod_search_user@test.org")
        headers = get_auth_header(user.email)

        # Match existing keyword
        res = await client.get(
            app.url_path_for("academy:get_modules"),
            params={"search": "Living Income"},
            headers=headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["total_modules"] >= 1

        # Non-matching keyword
        res2 = await client.get(
            app.url_path_for("academy:get_modules"),
            params={"search": "xyznonexistentkeyword123"},
            headers=headers,
        )
        assert res2.status_code == 200
        data2 = res2.json()
        assert data2["total_modules"] == 0
        assert data2["modules"] == []

    @pytest.mark.asyncio
    async def test_get_modules_tag_filter(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(session, "mod_tag_user@test.org")
        headers = get_auth_header(user.email)

        # Filter by tag slug
        res = await client.get(
            app.url_path_for("academy:get_modules"),
            params={"tag": "income-measurement"},
            headers=headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["total_modules"] >= 1

        # Filter by invalid tag
        res2 = await client.get(
            app.url_path_for("academy:get_modules"),
            params={"tag": "invalid-slug-999"},
            headers=headers,
        )
        assert res2.status_code == 200
        data2 = res2.json()
        assert data2["total_modules"] == 0
        assert data2["modules"] == []

    @pytest.mark.asyncio
    async def test_get_modules_tag_id_filter(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(session, "mod_tag_id_user@test.org")
        headers = get_auth_header(user.email)

        # 1. Valid tag ID
        tag_1 = session.query(AcademyTag).filter(AcademyTag.id == 1).first()
        assert tag_1 is not None

        res = await client.get(
            app.url_path_for("academy:get_modules"),
            params={"tag_id": tag_1.id},
            headers=headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["total_modules"] >= 1
        for mod in data["modules"]:
            mod_tag_ids = [t["id"] for t in mod["tags"]]
            chap_tag_ids = [
                t["id"] for c in mod["chapters"] for t in c["tags"]
            ]
            assert tag_1.id in mod_tag_ids or tag_1.id in chap_tag_ids

        # 2. Nonexistent / unrelated tag ID
        res_none = await client.get(
            app.url_path_for("academy:get_modules"),
            params={"tag_id": 999999},
            headers=headers,
        )
        assert res_none.status_code == 200
        data_none = res_none.json()
        assert data_none["total_modules"] == 0
        assert data_none["modules"] == []

    @pytest.mark.asyncio
    async def test_get_modules_search_by_tag_name(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(session, "mod_tag_name_user@test.org")
        headers = get_auth_header(user.email)

        res = await client.get(
            app.url_path_for("academy:get_modules"),
            params={"search": "Income measurement"},
            headers=headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["total_modules"] >= 1

        found_tag = False
        for mod in data["modules"]:
            for t in mod["tags"]:
                if t["name"].lower() == "income measurement":
                    found_tag = True
            for c in mod["chapters"]:
                for t in c["tags"]:
                    if t["name"].lower() == "income measurement":
                        found_tag = True
        assert found_tag is True


class TestAcademyChapterDetailApi:
    """Verify GET /academy/chapters/{chapter_id} and cross-module navigation."""

    @pytest.mark.asyncio
    async def test_get_chapter_detail_success(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(session, "reader_user@test.org")
        headers = get_auth_header(user.email)

        first_chap = session.query(AcademyChapter).filter(
            AcademyChapter.chapter_number == 1
        ).first()

        res = await client.get(
            app.url_path_for(
                "academy:get_chapter_detail", chapter_id=first_chap.id
            ),
            headers=headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["id"] == first_chap.id
        assert data["title"] == first_chap.title
        assert data["content_html"] == first_chap.content_html
        assert data["estimated_minutes"] == first_chap.estimated_minutes
        assert data["status"] == "Not started"
        assert isinstance(data["tags"], list)

    @pytest.mark.asyncio
    async def test_get_chapter_detail_404_not_found(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(session, "reader_404@test.org")
        headers = get_auth_header(user.email)

        res = await client.get(
            app.url_path_for(
                "academy:get_chapter_detail", chapter_id=999999
            ),
            headers=headers,
        )
        assert res.status_code == 404
        assert res.json()["detail"] == "Chapter not found"

    @pytest.mark.asyncio
    async def test_cross_module_relative_navigation(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(session, "nav_user@test.org")
        headers = get_auth_header(user.email)

        # Get all chapters in curriculum order
        ordered_chapters = (
            session.query(AcademyChapter)
            .join(AcademyModule, AcademyChapter.module_id == AcademyModule.id)
            .order_by(
                AcademyModule.order_index.asc(),
                AcademyChapter.chapter_number.asc(),
            )
            .all()
        )

        first_chap = ordered_chapters[0]
        last_chap = ordered_chapters[-1]

        # 1. First chapter in course has prev_chapter_id = None
        res_first = await client.get(
            app.url_path_for(
                "academy:get_chapter_detail", chapter_id=first_chap.id
            ),
            headers=headers,
        )
        assert res_first.status_code == 200
        data_first = res_first.json()
        assert data_first["prev_chapter_id"] is None
        assert data_first["next_chapter_id"] == ordered_chapters[1].id

        # 2. Last chapter in course has next_chapter_id = None
        res_last = await client.get(
            app.url_path_for(
                "academy:get_chapter_detail", chapter_id=last_chap.id
            ),
            headers=headers,
        )
        assert res_last.status_code == 200
        data_last = res_last.json()
        assert data_last["next_chapter_id"] is None
        assert data_last["prev_chapter_id"] == ordered_chapters[-2].id

        # 3. Cross-module boundary check:
        # Find the last chapter of Module 1
        mod1 = (
            session.query(AcademyModule)
            .filter(AcademyModule.order_index == 1)
            .first()
        )
        mod2 = (
            session.query(AcademyModule)
            .filter(AcademyModule.order_index == 2)
            .first()
        )
        mod1_last_chap = (
            session.query(AcademyChapter)
            .filter(AcademyChapter.module_id == mod1.id)
            .order_by(AcademyChapter.chapter_number.desc())
            .first()
        )
        mod2_first_chap = (
            session.query(AcademyChapter)
            .filter(AcademyChapter.module_id == mod2.id)
            .order_by(AcademyChapter.chapter_number.asc())
            .first()
        )

        res_boundary = await client.get(
            app.url_path_for(
                "academy:get_chapter_detail", chapter_id=mod1_last_chap.id
            ),
            headers=headers,
        )
        assert res_boundary.status_code == 200
        assert res_boundary.json()["next_chapter_id"] == mod2_first_chap.id

        res_boundary2 = await client.get(
            app.url_path_for(
                "academy:get_chapter_detail", chapter_id=mod2_first_chap.id
            ),
            headers=headers,
        )
        assert res_boundary2.status_code == 200
        assert res_boundary2.json()["prev_chapter_id"] == mod1_last_chap.id

    @pytest.mark.asyncio
    async def test_chapter_detail_reflects_user_progress(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        email = "reader_progress_user@test.org"
        user = get_or_create_test_user(session, email, "Reader Progress")
        headers = get_auth_header(user.email)

        chap1 = session.query(AcademyChapter).filter(
            AcademyChapter.chapter_number == 1
        ).first()

        # Clear progress for this chapter
        session.query(AcademyUserChapterProgress).filter(
            AcademyUserChapterProgress.user_id == user.id,
            AcademyUserChapterProgress.chapter_id == chap1.id,
        ).delete()
        session.commit()

        # 1. Initial state: Not started
        res1 = await client.get(
            app.url_path_for(
                "academy:get_chapter_detail", chapter_id=chap1.id
            ),
            headers=headers,
        )
        assert res1.status_code == 200
        assert res1.json()["status"] == "Not started"

        # 2. Update to in_progress
        res_post1 = await client.post(
            app.url_path_for(
                "academy:update_chapter_progress", chapter_id=chap1.id
            ),
            json={"status": "in_progress"},
            headers=headers,
        )
        assert res_post1.status_code == 200

        res2 = await client.get(
            app.url_path_for(
                "academy:get_chapter_detail", chapter_id=chap1.id
            ),
            headers=headers,
        )
        assert res2.status_code == 200
        assert res2.json()["status"] == "In progress"

        # 3. Update to completed
        res_post2 = await client.post(
            app.url_path_for(
                "academy:update_chapter_progress", chapter_id=chap1.id
            ),
            json={"status": "completed"},
            headers=headers,
        )
        assert res_post2.status_code == 200

        res3 = await client.get(
            app.url_path_for(
                "academy:get_chapter_detail", chapter_id=chap1.id
            ),
            headers=headers,
        )
        assert res3.status_code == 200
        assert res3.json()["status"] == "Completed"


class TestAcademyProgressUpdateApi:
    """Verify POST /academy/chapters/{id}/progress and KPI recalculation."""

    @pytest.mark.asyncio
    async def test_update_progress_404_not_found(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(session, "prog_404@test.org")
        headers = get_auth_header(user.email)

        res = await client.post(
            app.url_path_for(
                "academy:update_chapter_progress", chapter_id=999999
            ),
            json={"status": "in_progress"},
            headers=headers,
        )
        assert res.status_code == 404
        assert res.json()["detail"] == "Chapter not found"

    @pytest.mark.asyncio
    async def test_update_progress_flow_and_recalculations(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        email = "flow_learner@test.org"
        user = get_or_create_test_user(session, email, "Flow Learner")
        headers = get_auth_header(user.email)

        # Clear existing progress
        session.query(AcademyUserChapterProgress).filter(
            AcademyUserChapterProgress.user_id == user.id
        ).delete()
        session.commit()

        mod1 = (
            session.query(AcademyModule)
            .filter(AcademyModule.order_index == 1)
            .first()
        )
        mod1_chapters = (
            session.query(AcademyChapter)
            .filter(AcademyChapter.module_id == mod1.id)
            .order_by(AcademyChapter.chapter_number.asc())
            .all()
        )
        chap1 = mod1_chapters[0]

        # 1. Mark opened
        res1 = await client.post(
            app.url_path_for(
                "academy:update_chapter_progress", chapter_id=chap1.id
            ),
            json={"status": "not_started", "mark_opened": True},
            headers=headers,
        )
        assert res1.status_code == 200
        data1 = res1.json()
        assert data1["chapter_id"] == chap1.id
        assert data1["status"] == "Not started"
        assert data1["last_opened_at"] is not None
        assert data1["completed_at"] is None

        # 2. Update to in_progress
        res2 = await client.post(
            app.url_path_for(
                "academy:update_chapter_progress", chapter_id=chap1.id
            ),
            json={"status": "in_progress"},
            headers=headers,
        )
        assert res2.status_code == 200
        data2 = res2.json()
        assert data2["status"] == "In progress"
        assert data2["module_status"] == "In progress"

        # 3. Update to completed
        res3 = await client.post(
            app.url_path_for(
                "academy:update_chapter_progress", chapter_id=chap1.id
            ),
            json={"status": "completed"},
            headers=headers,
        )
        assert res3.status_code == 200
        data3 = res3.json()
        assert data3["status"] == "Completed"
        assert data3["completed_at"] is not None
        assert data3["chapters_completed"] == 1
        assert data3["module_progress_pct"] > 0
        assert data3["course_progress_pct"] > 0

        # Verify overview reflects this chapter completion
        res_ov = await client.get(
            app.url_path_for("academy:get_overview"), headers=headers
        )
        ov_data = res_ov.json()
        assert ov_data["metrics"]["chapters_completed"] == 1
        # Continue chapter should now advance to chapter 2
        assert ov_data["continue_chapter_id"] == mod1_chapters[1].id
        # Recently opened should contain chapter 1
        assert len(ov_data["recently_opened"]) >= 1
        assert ov_data["recently_opened"][0]["id"] == chap1.id

        # 4. Complete all remaining chapters of Module 1
        for chap in mod1_chapters[1:]:
            res_comp = await client.post(
                app.url_path_for(
                    "academy:update_chapter_progress", chapter_id=chap.id
                ),
                json={"status": "completed"},
                headers=headers,
            )
            assert res_comp.status_code == 200

        # Check final chapter of module 1 response
        final_mod1_res = res_comp.json()
        assert final_mod1_res["module_status"] == "Completed"
        assert final_mod1_res["module_progress_pct"] == 100
        assert final_mod1_res["modules_completed"] == 1

    @pytest.mark.asyncio
    async def test_update_progress_invalid_status_enum_422(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(session, "invalid_enum_user@test.org")
        headers = get_auth_header(user.email)
        chap1 = session.query(AcademyChapter).first()

        res = await client.post(
            app.url_path_for(
                "academy:update_chapter_progress", chapter_id=chap1.id
            ),
            json={"status": "flying"},
            headers=headers,
        )
        assert res.status_code == 422

    @pytest.mark.asyncio
    async def test_update_progress_status_transitions_and_timestamp_retention(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(session, "timestamp_tester@test.org")
        headers = get_auth_header(user.email)
        chap1 = session.query(AcademyChapter).first()

        session.query(AcademyUserChapterProgress).filter(
            AcademyUserChapterProgress.user_id == user.id,
            AcademyUserChapterProgress.chapter_id == chap1.id,
        ).delete()
        session.commit()

        # 1. Mark chapter completed
        res1 = await client.post(
            app.url_path_for(
                "academy:update_chapter_progress", chapter_id=chap1.id
            ),
            json={"status": "completed"},
            headers=headers,
        )
        assert res1.status_code == 200
        d1 = res1.json()
        assert d1["status"] == "Completed"
        completed_at_orig = d1["completed_at"]
        assert completed_at_orig is not None
        assert d1["last_opened_at"] is not None

        # 2. Re-open with mark_opened=True while staying completed
        res2 = await client.post(
            app.url_path_for(
                "academy:update_chapter_progress", chapter_id=chap1.id
            ),
            json={"status": "completed", "mark_opened": True},
            headers=headers,
        )
        assert res2.status_code == 200
        d2 = res2.json()
        assert d2["completed_at"] == completed_at_orig

        # 3. Transition backwards to in_progress -> completed_at must clear
        res3 = await client.post(
            app.url_path_for(
                "academy:update_chapter_progress", chapter_id=chap1.id
            ),
            json={"status": "in_progress"},
            headers=headers,
        )
        assert res3.status_code == 200
        d3 = res3.json()
        assert d3["status"] == "In progress"
        assert d3["completed_at"] is None


class TestAcademyHistoryApi:
    """Verify GET /academy/history ordering and pagination."""

    @pytest.mark.asyncio
    async def test_history_lifecycle_and_pagination(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        email = "history_tester@test.org"
        user = get_or_create_test_user(session, email, "History Tester")
        headers = get_auth_header(user.email)

        # Clear progress
        session.query(AcademyUserChapterProgress).filter(
            AcademyUserChapterProgress.user_id == user.id
        ).delete()
        session.commit()

        # 1. Empty initially
        res_empty = await client.get(
            app.url_path_for("academy:get_reading_history"), headers=headers
        )
        assert res_empty.status_code == 200
        empty_data = res_empty.json()
        assert empty_data["total"] == 0
        assert empty_data["total_pages"] == 0
        assert empty_data["data"] == []

        # 2. Open 3 chapters with distinct timestamps
        chapters = session.query(AcademyChapter).limit(3).all()
        now = datetime.utcnow()
        for i, chap in enumerate(chapters):
            prog = AcademyUserChapterProgress(
                user_id=user.id,
                chapter_id=chap.id,
                status=AcademyChapterProgressStatus.in_progress,
                last_opened_at=now - timedelta(minutes=10 * (3 - i)),
            )
            session.add(prog)
        session.commit()

        # 3. Request page 1 with page_size=2
        res_p1 = await client.get(
            app.url_path_for("academy:get_reading_history"),
            params={"page": 1, "page_size": 2},
            headers=headers,
        )
        assert res_p1.status_code == 200
        data_p1 = res_p1.json()
        assert data_p1["total"] == 3
        assert data_p1["total_pages"] == 2
        assert data_p1["page"] == 1
        assert data_p1["page_size"] == 2
        assert len(data_p1["data"]) == 2
        # Most recently opened chapter should be first
        assert data_p1["data"][0]["chapter_id"] == chapters[2].id
        assert data_p1["data"][1]["chapter_id"] == chapters[1].id

        # 4. Request page 2 with page_size=2
        res_p2 = await client.get(
            app.url_path_for("academy:get_reading_history"),
            params={"page": 2, "page_size": 2},
            headers=headers,
        )
        assert res_p2.status_code == 200
        data_p2 = res_p2.json()
        assert len(data_p2["data"]) == 1
        assert data_p2["data"][0]["chapter_id"] == chapters[0].id

    @pytest.mark.asyncio
    async def test_history_pagination_out_of_bounds(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(session, "oob_history@test.org")
        headers = get_auth_header(user.email)

        res = await client.get(
            app.url_path_for("academy:get_reading_history"),
            params={"page": 999, "page_size": 10},
            headers=headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["page"] == 999
        assert data["page_size"] == 10
        assert data["data"] == []


class TestAcademyCrossUserIsolationApi:
    """Verify hermetic user data isolation across all academy endpoints."""

    @pytest.mark.asyncio
    async def test_cross_user_progress_isolation(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        email_a = "learner_a@test.org"
        email_b = "learner_b@test.org"
        user_a = get_or_create_test_user(session, email_a, "User Alpha")
        user_b = get_or_create_test_user(session, email_b, "User Beta")
        headers_a = get_auth_header(user_a.email)
        headers_b = get_auth_header(user_b.email)

        # Clear progress for both users
        session.query(AcademyUserChapterProgress).filter(
            AcademyUserChapterProgress.user_id.in_([user_a.id, user_b.id])
        ).delete()
        session.commit()

        # User A completes chapters 1, 2, 3
        chaps = session.query(AcademyChapter).limit(3).all()
        for c in chaps:
            res_a = await client.post(
                app.url_path_for(
                    "academy:update_chapter_progress", chapter_id=c.id
                ),
                json={"status": "completed"},
                headers=headers_a,
            )
            assert res_a.status_code == 200

        # Assert User B endpoints remain 100% pristine and isolated
        # 1. Overview
        res_b_ov = await client.get(
            app.url_path_for("academy:get_overview"), headers=headers_b
        )
        assert res_b_ov.status_code == 200
        data_b_ov = res_b_ov.json()
        assert data_b_ov["metrics"]["chapters_completed"] == 0
        assert data_b_ov["metrics"]["modules_completed"] == 0
        assert data_b_ov["metrics"]["academy_progress_pct"] == 0
        assert data_b_ov["recently_opened"] == []

        # 2. Modules
        res_b_mod = await client.get(
            app.url_path_for("academy:get_modules"), headers=headers_b
        )
        assert res_b_mod.status_code == 200
        data_b_mod = res_b_mod.json()
        for mod in data_b_mod["modules"]:
            assert mod["progress_pct"] == 0
            assert mod["status"] == "Not started"
            for chap in mod["chapters"]:
                assert chap["status"] == "Not started"

        # 3. Chapter detail
        res_b_chap = await client.get(
            app.url_path_for(
                "academy:get_chapter_detail", chapter_id=chaps[0].id
            ),
            headers=headers_b,
        )
        assert res_b_chap.status_code == 200
        assert res_b_chap.json()["status"] == "Not started"

        # 4. History
        res_b_hist = await client.get(
            app.url_path_for("academy:get_reading_history"), headers=headers_b
        )
        assert res_b_hist.status_code == 200
        data_b_hist = res_b_hist.json()
        assert data_b_hist["total"] == 0
        assert data_b_hist["data"] == []


class TestAcademyCourseEdgeCasesAndCoverage:
    """Test suite covering edge cases, fallbacks, and boundary conditions."""

    @pytest.mark.asyncio
    async def test_reading_history_negative_and_zero_pagination(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(session, "page_fallback@test.org")
        headers = get_auth_header(user.email)
        url = app.url_path_for("academy:get_reading_history")

        # FastAPI ge=1 validation rejects page=0 with 422
        res = await client.get(
            url, headers=headers, params={"page": 0, "page_size": 10}
        )
        assert res.status_code == 422

        res_neg = await client.get(
            url, headers=headers, params={"page": 1, "page_size": -5}
        )
        assert res_neg.status_code == 422

        # Direct CRUD call verifies internal defense fallbacks for page < 1
        crud_res = crud_course.get_user_reading_history(
            session=session, user_id=user.id, page=0, page_size=0
        )
        assert crud_res.page == 1
        assert crud_res.page_size == 10

    def test_greeting_name_lastname_only_fallback(self, session: Session):
        user = get_or_create_test_user(
            session, "lastname_only@test.org", fullname=""
        )
        profile = (
            session.query(UserProfile)
            .filter(UserProfile.user_id == user.id)
            .first()
        )
        if not profile:
            profile = UserProfile(
                user_id=user.id, first_name="", last_name="Skywalker"
            )
            session.add(profile)
        else:
            profile.first_name = ""
            profile.last_name = "Skywalker"
        session.commit()

        greeting = crud_course.get_user_greeting_name(session, user)
        assert greeting == "Skywalker"

    def test_greeting_name_learner_fallback(self, session: Session):
        user = get_or_create_test_user(
            session, "no_name_no_email@test.org", fullname=""
        )
        # Clear profile
        session.query(UserProfile).filter(
            UserProfile.user_id == user.id
        ).delete()
        user.fullname = ""
        user.email = ""
        session.commit()

        greeting = crud_course.get_user_greeting_name(session, user)
        assert greeting == "Learner"

    def test_resolve_prev_next_nonexistent_chapter_direct(
        self, session: Session
    ):
        chapters = session.query(AcademyChapter).limit(3).all()
        prev_id, next_id = crud_course.get_chapter_navigation_ids(
            chapters, target_chapter_id=999999
        )
        assert prev_id is None
        assert next_id is None

    def test_determine_continue_empty_chapters_direct(self):
        result = crud_course.determine_continue_chapter_id([], {}, [])
        assert result is None

    def test_determine_continue_with_in_progress_opened_records(
        self, session: Session
    ):
        chapters = session.query(AcademyChapter).limit(5).all()
        user = get_or_create_test_user(session, "continue_test@test.org")

        opened_rec = AcademyUserChapterProgress(
            user_id=user.id,
            chapter_id=chapters[2].id,
            status=AcademyChapterProgressStatus.in_progress,
            last_opened_at=datetime.utcnow(),
        )
        res = crud_course.determine_continue_chapter_id(
            chapters, {}, [opened_rec]
        )
        assert res == chapters[2].id

    @pytest.mark.asyncio
    async def test_update_progress_status_not_started_without_mark_opened(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(session, "not_started_test@test.org")
        headers = get_auth_header(user.email)
        chapter = session.query(AcademyChapter).first()

        res = await client.post(
            app.url_path_for(
                "academy:update_chapter_progress", chapter_id=chapter.id
            ),
            json={"status": "not_started", "mark_opened": False},
            headers=headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "Not started"
        assert data["module_status"] == "Not started"

    @pytest.mark.asyncio
    async def test_modules_query_module_progress_statuses(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        user = get_or_create_test_user(session, "mod_status_test@test.org")
        headers = get_auth_header(user.email)

        # Mark all chapters of Module 1 completed
        mod1 = (
            session.query(AcademyModule)
            .filter(AcademyModule.order_index == 1)
            .first()
        )
        mod1_chapters = (
            session.query(AcademyChapter)
            .filter(AcademyChapter.module_id == mod1.id)
            .all()
        )
        for c in mod1_chapters:
            crud_course.upsert_chapter_progress(
                session, c.id, user.id,
                AcademyChapterProgressStatus.completed,
                mark_opened=True
            )

        # Mark one chapter of Module 2 in progress
        mod2 = (
            session.query(AcademyModule)
            .filter(AcademyModule.order_index == 2)
            .first()
        )
        mod2_chap = (
            session.query(AcademyChapter)
            .filter(AcademyChapter.module_id == mod2.id)
            .first()
        )
        crud_course.upsert_chapter_progress(
            session, mod2_chap.id, user.id,
            AcademyChapterProgressStatus.in_progress,
            mark_opened=True
        )

        res = await client.get(
            app.url_path_for("academy:get_modules"), headers=headers
        )
        assert res.status_code == 200
        data = res.json()
        m1_data = next(m for m in data["modules"] if m["id"] == mod1.id)
        m2_data = next(m for m in data["modules"] if m["id"] == mod2.id)
        assert m1_data["status"] == "Completed"
        assert m1_data["progress_pct"] == 100
        assert m2_data["status"] == "In progress"


class TestAcademyCourseDeepEdgeCases:
    """Deep test verification for boundary, structure, edge cases and security."""

    @pytest.mark.asyncio
    async def test_history_negative_and_zero_page_size_query_validation(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        """FastAPI query validation ge=1, le=100 returns 422 for invalid page/page_size."""
        user = get_or_create_test_user(session, "history_param_user@test.org")
        headers = get_auth_header(user.email)
        url = app.url_path_for("academy:get_reading_history")

        invalid_params = [
            {"page": -1, "page_size": 10},
            {"page": 0, "page_size": 10},
            {"page": 1, "page_size": 0},
            {"page": 1, "page_size": -5},
            {"page": 1, "page_size": 101},
            {"page": 1, "page_size": 10000},
        ]
        for params in invalid_params:
            res = await client.get(url, params=params, headers=headers)
            assert res.status_code == 422, f"Expected 422 for params {params}, got {res.status_code}"

    @pytest.mark.asyncio
    async def test_history_extreme_page_number_out_of_bounds(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        """Extremely high page numbers safely return empty data list with 200 OK."""
        user = get_or_create_test_user(session, "history_extreme_page@test.org")
        headers = get_auth_header(user.email)
        res = await client.get(
            app.url_path_for("academy:get_reading_history"),
            params={"page": 999999, "page_size": 50},
            headers=headers,
        )
        assert res.status_code == 200
        body = res.json()
        assert body["page"] == 999999
        assert body["page_size"] == 50
        assert body["data"] == []

    @pytest.mark.asyncio
    async def test_modules_search_sql_injection_and_wildcards_resilience(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        """Search query strings with SQL wildcards, escapes, quotes are handled safely."""
        user = get_or_create_test_user(session, "modules_sql_test@test.org")
        headers = get_auth_header(user.email)
        url = app.url_path_for("academy:get_modules")

        payloads = [
            "%",
            "%%",
            "_",
            "' OR '1'='1",
            "\" OR \"1\"=\"1",
            "1; DROP TABLE academy_chapter; --",
            "\\0",
            "/* comment */",
            "UNION SELECT * FROM user",
        ]
        for q in payloads:
            res = await client.get(url, params={"search": q}, headers=headers)
            assert res.status_code == 200, f"Failed on SQL payload: {q}"
            data = res.json()
            assert "modules" in data
            assert isinstance(data["modules"], list)

    @pytest.mark.asyncio
    async def test_modules_search_unicode_and_emojis(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        """Search supports multi-byte Unicode, accents, and emojis."""
        user = get_or_create_test_user(session, "modules_unicode_test@test.org")
        headers = get_auth_header(user.email)
        url = app.url_path_for("academy:get_modules")

        for term in ["🌾 Cacao Academy 🍫", "café", "Español", "Côte d'Ivoire", "日本語"]:
            res = await client.get(url, params={"search": term}, headers=headers)
            assert res.status_code == 200, f"Failed on unicode term: {term}"
            assert "modules" in res.json()

    @pytest.mark.asyncio
    async def test_modules_search_whitespace_variations(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        """Whitespace-only search terms are stripped and return full modules list."""
        user = get_or_create_test_user(session, "modules_ws_test@test.org")
        headers = get_auth_header(user.email)
        url = app.url_path_for("academy:get_modules")

        res_unfiltered = await client.get(url, headers=headers)
        unfiltered_count = res_unfiltered.json()["total_modules"]

        for ws in ["   ", "\t", "\n", " \t \n "]:
            res = await client.get(url, params={"search": ws}, headers=headers)
            assert res.status_code == 200
            assert res.json()["total_modules"] == unfiltered_count

    @pytest.mark.asyncio
    async def test_modules_cross_filter_combinations(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        """Cross-filtering with search + tag + tag_id evaluates correctly."""
        user = get_or_create_test_user(session, "modules_cross_filter@test.org")
        headers = get_auth_header(user.email)
        url = app.url_path_for("academy:get_modules")

        # 1. Contradictory tag search that matches nothing
        res_empty = await client.get(
            url,
            params={"search": "Introduction", "tag": "non_existent_tag_slug_xyz"},
            headers=headers,
        )
        assert res_empty.status_code == 200
        assert res_empty.json()["total_modules"] == 0
        assert res_empty.json()["modules"] == []

        # 2. Non-existent tag_id returns 0 modules
        res_no_tag_id = await client.get(
            url,
            params={"tag_id": 999999},
            headers=headers,
        )
        assert res_no_tag_id.status_code == 200
        assert res_no_tag_id.json()["total_modules"] == 0

        # 3. Matching tag slug
        first_tag = session.query(AcademyTag).first()
        if first_tag:
            res_tag = await client.get(
                url,
                params={"tag": first_tag.slug},
                headers=headers,
            )
            assert res_tag.status_code == 200
            assert "modules" in res_tag.json()

    @pytest.mark.asyncio
    async def test_chapter_progress_invalid_payloads_and_boundaries(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        """Malformed progress payloads, non-existent or negative chapter IDs fail safely."""
        user = get_or_create_test_user(session, "progress_invalid_test@test.org")
        headers = get_auth_header(user.email)

        # 1. Non-existent chapter ID returns 404
        res_404 = await client.post(
            app.url_path_for("academy:update_chapter_progress", chapter_id=999999),
            json={"status": "in_progress"},
            headers=headers,
        )
        assert res_404.status_code == 404

        # 2. Negative chapter ID returns 404
        res_neg = await client.post(
            app.url_path_for("academy:update_chapter_progress", chapter_id=-1),
            json={"status": "in_progress"},
            headers=headers,
        )
        assert res_neg.status_code == 404

        # 3. Invalid enum status string returns 422
        chapter = session.query(AcademyChapter).first()
        res_invalid_enum = await client.post(
            app.url_path_for("academy:update_chapter_progress", chapter_id=chapter.id),
            json={"status": "SUPER_COMPLETED"},
            headers=headers,
        )
        assert res_invalid_enum.status_code == 422

        # 4. Invalid non-dict/null status payload returns 422
        res_null_status = await client.post(
            app.url_path_for("academy:update_chapter_progress", chapter_id=chapter.id),
            json={"status": None},
            headers=headers,
        )
        assert res_null_status.status_code == 422

    @pytest.mark.asyncio
    async def test_chapter_detail_invalid_id_boundaries(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        """Chapter detail returns 404 for missing/negative IDs and 422 for non-integer."""
        user = get_or_create_test_user(session, "chap_detail_bound@test.org")
        headers = get_auth_header(user.email)

        res_404 = await client.get(
            app.url_path_for("academy:get_chapter_detail", chapter_id=999999),
            headers=headers,
        )
        assert res_404.status_code == 404

        res_neg = await client.get(
            app.url_path_for("academy:get_chapter_detail", chapter_id=-1),
            headers=headers,
        )
        assert res_neg.status_code == 404

        res_str = await client.get(
            "/academy/chapters/not-a-number",
            headers=headers,
        )
        assert res_str.status_code == 422

    @pytest.mark.asyncio
    async def test_overview_and_modules_with_empty_module_having_zero_chapters(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        """Modules without chapters are handled gracefully in overview and module listings."""
        user = get_or_create_test_user(session, "empty_mod_test@test.org")
        headers = get_auth_header(user.email)

        # Create an orphan module with zero chapters
        orphan_mod = AcademyModule(
            order_index=99,
            title="Empty Test Module",
            description="A module with no chapters",
            estimated_minutes=0,
        )
        session.add(orphan_mod)
        session.commit()
        session.refresh(orphan_mod)

        try:
            # 1. Overview handles 0 chapters module
            res_ov = await client.get(
                app.url_path_for("academy:get_overview"),
                headers=headers,
            )
            assert res_ov.status_code == 200
            ov_data = res_ov.json()
            ov_orphan = next((m for m in ov_data["modules"] if m["id"] == orphan_mod.id), None)
            assert ov_orphan is not None
            assert ov_orphan["progress_pct"] == 0
            assert ov_orphan["status"] == "Not started"

            # 2. Modules endpoint handles 0 chapters module
            res_mod = await client.get(
                app.url_path_for("academy:get_modules"),
                headers=headers,
            )
            assert res_mod.status_code == 200
            mod_data = res_mod.json()
            mod_orphan = next((m for m in mod_data["modules"] if m["id"] == orphan_mod.id), None)
            assert mod_orphan is not None
            assert len(mod_orphan["chapters"]) == 0
            assert mod_orphan["status"] == "Not started"
        finally:
            session.delete(orphan_mod)
            session.commit()

    def test_chapter_navigation_edge_cases_single_first_last(self):
        """Direct unit test for get_chapter_navigation_ids boundary cases."""
        c1 = AcademyChapter(id=101, module_id=1, chapter_number=1, title="Chap 1")
        c2 = AcademyChapter(id=102, module_id=1, chapter_number=2, title="Chap 2")
        c3 = AcademyChapter(id=103, module_id=1, chapter_number=3, title="Chap 3")

        # Single chapter curriculum
        prev_id, next_id = crud_course.get_chapter_navigation_ids([c1], 101)
        assert prev_id is None
        assert next_id is None

        # Chapter not in list
        prev_id, next_id = crud_course.get_chapter_navigation_ids([c1, c2, c3], 999)
        assert prev_id is None
        assert next_id is None

        # First chapter
        prev_id, next_id = crud_course.get_chapter_navigation_ids([c1, c2, c3], 101)
        assert prev_id is None
        assert next_id == 102

        # Middle chapter
        prev_id, next_id = crud_course.get_chapter_navigation_ids([c1, c2, c3], 102)
        assert prev_id == 101
        assert next_id == 103

        # Last chapter
        prev_id, next_id = crud_course.get_chapter_navigation_ids([c1, c2, c3], 103)
        assert prev_id == 102
        assert next_id is None

    @pytest.mark.asyncio
    async def test_chapter_with_null_optional_fields(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        """Chapter with null content_html and default estimated_minutes delivers cleanly."""
        user = get_or_create_test_user(session, "null_fields_user@test.org")
        headers = get_auth_header(user.email)

        first_module = session.query(AcademyModule).first()
        max_num = (
            session.query(AcademyChapter.chapter_number)
            .filter(AcademyChapter.module_id == first_module.id)
            .order_by(AcademyChapter.chapter_number.desc())
            .first()
        )[0]

        null_chap = AcademyChapter(
            module_id=first_module.id,
            chapter_number=max_num + 99,
            title="Minimal Chapter",
            content_html=None,
            estimated_minutes=5,
        )
        session.add(null_chap)
        session.commit()
        session.refresh(null_chap)

        try:
            res = await client.get(
                app.url_path_for("academy:get_chapter_detail", chapter_id=null_chap.id),
                headers=headers,
            )
            assert res.status_code == 200
            data = res.json()
            assert data["content_html"] is None
            assert data["title"] == "Minimal Chapter"
            assert data["estimated_minutes"] == 5
        finally:
            session.delete(null_chap)
            session.commit()

    @pytest.mark.asyncio
    async def test_course_endpoints_reject_expired_jwt(
        self, app: FastAPI, client: AsyncClient
    ):
        """Expired JWT token returns 401 across course endpoints."""
        expired_token = jwt.encode(
            {
                "email": "academy_learner@test.org",
                "exp": datetime.utcnow() - timedelta(hours=2),
            },
            SECRET_KEY,
            algorithm=ALGORITHM,
        )
        headers = {"Authorization": f"Bearer {expired_token}"}
        res = await client.get(app.url_path_for("academy:get_overview"), headers=headers)
        assert res.status_code in (401, 403)

    @pytest.mark.asyncio
    async def test_course_endpoints_reject_tampered_signature_jwt(
        self, app: FastAPI, client: AsyncClient
    ):
        """Tampered JWT signature is rejected with 401/403."""
        tampered_token = jwt.encode(
            {
                "email": "academy_learner@test.org",
                "exp": datetime.utcnow() + timedelta(hours=2),
            },
            "completely_wrong_secret_key_1234567890",
            algorithm=ALGORITHM,
        )
        headers = {"Authorization": f"Bearer {tampered_token}"}
        res = await client.get(app.url_path_for("academy:get_overview"), headers=headers)
        assert res.status_code in (401, 403)

    @pytest.mark.asyncio
    async def test_course_endpoints_reject_malformed_bearer_headers(
        self, app: FastAPI, client: AsyncClient
    ):
        """Malformed Authorization headers return 401/403."""
        malformed = [
            {"Authorization": "Bearer"},
            {"Authorization": "Bearer "},
            {"Authorization": "Basic dGVzdDp0ZXN0"},
            {"Authorization": "Token some_token"},
            {"Authorization": ""},
        ]
        for h in malformed:
            res = await client.get(app.url_path_for("academy:get_overview"), headers=h)
            assert res.status_code in (401, 403)

    @pytest.mark.asyncio
    async def test_course_endpoints_reject_user_not_found_in_db(
        self, app: FastAPI, client: AsyncClient
    ):
        """Valid JWT containing email that does not exist in DB is rejected with 401."""
        ghost_token = create_access_token(data={"email": "non_existent_ghost_learner@test.org"})
        headers = {"Authorization": f"Bearer {ghost_token}"}
        res = await client.get(app.url_path_for("academy:get_overview"), headers=headers)
        assert res.status_code in (401, 403)

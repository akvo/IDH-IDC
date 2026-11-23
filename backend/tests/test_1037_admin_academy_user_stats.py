import os
import sys
from datetime import datetime, timedelta, timezone
from typing import Generator

import pytest
from httpx import AsyncClient
from sqlalchemy import text
from sqlalchemy.orm import Session

from db.crud_organisation import default_organisation
from middleware import generate_user_token, get_password_hash
from models.academy.academy_models import (
    AcademyChapter,
    AcademyChapterProgressStatus,
    AcademyModule,
    AcademyUserChapterProgress,
)
from models.company import Company
from models.user import ToolType, User, UserRole
from models.user_profile import UserProfile

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)


@pytest.fixture
def clean_academy_stats(session: Session) -> Generator:
    """Hermetic fixture tracking and cleaning created test entities."""
    created_user_ids = []
    created_company_ids = []
    created_profile_ids = []
    created_progress_ids = []
    created_module_ids = []
    created_chapter_ids = []

    def _track(
        user_id: int = None,
        company_id: int = None,
        profile_id: int = None,
        progress_id: int = None,
        module_id: int = None,
        chapter_id: int = None,
    ):
        if user_id and user_id not in created_user_ids:
            created_user_ids.append(user_id)
        if company_id and company_id not in created_company_ids:
            created_company_ids.append(company_id)
        if profile_id and profile_id not in created_profile_ids:
            created_profile_ids.append(profile_id)
        if progress_id and progress_id not in created_progress_ids:
            created_progress_ids.append(progress_id)
        if module_id and module_id not in created_module_ids:
            created_module_ids.append(module_id)
        if chapter_id and chapter_id not in created_chapter_ids:
            created_chapter_ids.append(chapter_id)

    # Ensure curriculum (modules 1..6 and chapters) exists for testing
    for mod_idx in range(1, 7):
        mod = (
            session.query(AcademyModule)
            .filter(AcademyModule.order_index == mod_idx)
            .first()
        )
        if not mod:
            mod = AcademyModule(
                order_index=mod_idx,
                title=f"Module {mod_idx}",
                description=f"Curriculum Module {mod_idx}",
                estimated_minutes=15,
            )
            session.add(mod)
            session.commit()
            session.refresh(mod)
            _track(module_id=mod.id)

        existing_chapters = (
            session.query(AcademyChapter)
            .filter(AcademyChapter.module_id == mod.id)
            .all()
        )
        if not existing_chapters:
            for ch_num in (1, 2):
                ch = AcademyChapter(
                    module_id=mod.id,
                    chapter_number=ch_num,
                    title=f"Mod {mod.order_index} Ch {ch_num}",
                    estimated_minutes=5,
                )
                session.add(ch)
                session.commit()
                session.refresh(ch)
                _track(chapter_id=ch.id)

    yield _track

    # 1. Cleanup Progress records
    for prog_id in reversed(created_progress_ids):
        prog = (
            session.query(AcademyUserChapterProgress)
            .filter(AcademyUserChapterProgress.id == prog_id)
            .first()
        )
        if prog:
            session.delete(prog)

    # 2. Cleanup User Profiles
    for pid in reversed(created_profile_ids):
        p = session.query(UserProfile).filter(UserProfile.id == pid).first()
        if p:
            session.delete(p)

    # 3. Cleanup Users
    for uid in reversed(created_user_ids):
        u = session.query(User).filter(User.id == uid).first()
        if u:
            session.delete(u)

    # 4. Cleanup Companies
    for cid in reversed(created_company_ids):
        c = session.query(Company).filter(Company.id == cid).first()
        if c:
            session.delete(c)

    # 5. Cleanup Chapters
    for ch_id in reversed(created_chapter_ids):
        ch = (
            session.query(AcademyChapter)
            .filter(AcademyChapter.id == ch_id)
            .first()
        )
        if ch:
            session.delete(ch)

    # 6. Cleanup Modules
    for m_id in reversed(created_module_ids):
        m = (
            session.query(AcademyModule)
            .filter(AcademyModule.id == m_id)
            .first()
        )
        if m:
            session.delete(m)

    session.commit()

    # 7. Reset sequence counters safely
    for seq, tbl in [
        ("user_id_seq", '"user"'),
        ("user_profile_id_seq", "user_profile"),
        ("company_id_seq", "company"),
        ("academy_user_chapter_progress_id_seq", "academy_user_chapter_progress"),
        ("academy_chapter_id_seq", "academy_chapter"),
        ("academy_module_id_seq", "academy_module"),
    ]:
        try:
            session.execute(
                text(
                    f"SELECT setval('{seq}', "
                    f"(SELECT COALESCE(MAX(id), 1) FROM {tbl}))"
                )
            )
            session.commit()
        except Exception:
            session.rollback()


def _create_user(
    session: Session,
    tracker,
    email: str,
    fullname: str,
    role: UserRole = UserRole.user,
    tools=None,
    company_id: int = None,
    is_active: int = 1,
    created_at: datetime = None,
) -> User:
    def_org = default_organisation(session=session, name="IDH")
    user = User(
        fullname=fullname,
        email=email,
        password=get_password_hash("Password123!"),
        role=role,
        is_active=is_active,
        tools=tools or [ToolType.academy.value],
        company=company_id,
        organisation=def_org.id if def_org else None,
    )
    if created_at:
        user.created_at = created_at
    session.add(user)
    session.commit()
    session.refresh(user)
    tracker(user_id=user.id)
    return user


def _create_profile(
    session: Session,
    tracker,
    user_id: int,
    company_name: str = None,
    sector: str = None,
    region_name: str = None,
) -> UserProfile:
    profile = UserProfile(
        user_id=user_id,
        company_name=company_name,
        sector=sector,
        region_name=region_name,
    )
    session.add(profile)
    session.commit()
    session.refresh(profile)
    tracker(profile_id=profile.id)
    return profile


def _create_company(
    session: Session,
    tracker,
    name: str,
) -> Company:
    # Use max id + 1 for clean sequence insertion
    max_id = session.execute(
        text("SELECT COALESCE(MAX(id), 0) + 1 FROM company")
    ).scalar()
    company = Company(id=max_id, name=name)
    session.add(company)
    session.commit()
    session.refresh(company)
    tracker(company_id=company.id)
    return company


def _record_progress(
    session: Session,
    tracker,
    user_id: int,
    chapter_id: int,
    status: AcademyChapterProgressStatus = AcademyChapterProgressStatus.completed,
    last_opened_at: datetime = None,
) -> AcademyUserChapterProgress:
    prog = AcademyUserChapterProgress(
        user_id=user_id,
        chapter_id=chapter_id,
        status=status,
        last_opened_at=last_opened_at or datetime.now(timezone.utc),
    )
    session.add(prog)
    session.commit()
    session.refresh(prog)
    tracker(progress_id=prog.id)
    return prog


@pytest.mark.asyncio
class TestAdminAcademyUserStatistics:

    async def test_unauthenticated_request_rejected(self, client: AsyncClient):
        """Unauthenticated request must return 401 or 403 status."""
        res = await client.get("/admin/academy-user-statistics")
        assert res.status_code in (401, 403)

    async def test_regular_user_forbidden(
        self,
        client: AsyncClient,
        session: Session,
        clean_academy_stats,
    ):
        """Regular users (non-admin) must be denied with 403 Forbidden."""
        reg_user = _create_user(
            session,
            clean_academy_stats,
            email="regular_stats@test.com",
            fullname="Regular Learner",
            role=UserRole.user,
        )
        token = generate_user_token(reg_user)
        res = await client.get(
            "/admin/academy-user-statistics",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 403

    async def test_admin_and_super_admin_allowed(
        self,
        client: AsyncClient,
        session: Session,
        clean_academy_stats,
    ):
        """Admin and Super Admin roles can access the statistics endpoint."""
        admin_user = _create_user(
            session,
            clean_academy_stats,
            email="admin_stats@test.com",
            fullname="Admin User",
            role=UserRole.admin,
        )
        token = generate_user_token(admin_user)
        res = await client.get(
            "/admin/academy-user-statistics",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 200
        data = res.json()
        assert "kpis" in data
        assert "module_distribution" in data
        assert "companies" in data
        assert "filter_options" in data
        assert len(data["module_distribution"]) == 7  # 0 to 6 bins

    async def test_kpis_and_active_users_window(
        self,
        client: AsyncClient,
        session: Session,
        clean_academy_stats,
    ):
        """Calculates registered users, active (30d), companies count, and avg modules."""
        admin = _create_user(
            session,
            clean_academy_stats,
            email="admin_kpi@test.com",
            fullname="KPI Admin",
            role=UserRole.super_admin,
        )
        token = generate_user_token(admin)

        # Get existing first chapter
        chapter = session.query(AcademyChapter).first()
        assert chapter is not None, "Seeded chapters required for test"

        # 1. Active learner within 30 days
        u1 = _create_user(
            session,
            clean_academy_stats,
            email="learner_active@test.com",
            fullname="Active Learner",
            tools=["academy"],
        )
        _create_profile(
            session, clean_academy_stats, u1.id, company_name="Active Corp"
        )
        _record_progress(
            session,
            clean_academy_stats,
            user_id=u1.id,
            chapter_id=chapter.id,
            last_opened_at=datetime.now(timezone.utc) - timedelta(days=5),
        )

        # 2. Inactive learner (last opened 45 days ago)
        u2 = _create_user(
            session,
            clean_academy_stats,
            email="learner_old@test.com",
            fullname="Old Learner",
            tools=["academy"],
        )
        _create_profile(
            session, clean_academy_stats, u2.id, company_name="Old Corp"
        )
        _record_progress(
            session,
            clean_academy_stats,
            user_id=u2.id,
            chapter_id=chapter.id,
            last_opened_at=datetime.now(timezone.utc) - timedelta(days=45),
        )

        # 3. IDC-only user (should NOT be included in academy cohort)
        _create_user(
            session,
            clean_academy_stats,
            email="idc_only@test.com",
            fullname="IDC Only",
            tools=["idc"],
        )

        res = await client.get(
            "/admin/academy-user-statistics",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 200
        kpis = res.json()["kpis"]
        assert kpis["total_modules"] == 6
        assert kpis["registered_users"] >= 2
        assert kpis["active_users_30d"] >= 1

    async def test_module_distribution_bins(
        self,
        client: AsyncClient,
        session: Session,
        clean_academy_stats,
    ):
        """Verifies accurate binning from 0 to 6 completed modules."""
        admin = _create_user(
            session,
            clean_academy_stats,
            email="admin_bins@test.com",
            fullname="Bins Admin",
            role=UserRole.admin,
        )
        token = generate_user_token(admin)

        # Find module 1 chapters
        mod1 = (
            session.query(AcademyModule)
            .filter(AcademyModule.order_index == 1)
            .first()
        )
        assert mod1 is not None and len(mod1.chapters) > 0

        # Unique sector to isolate cohort in filter test
        test_sector = "BinsTestSector"
        user_mod1 = _create_user(
            session,
            clean_academy_stats,
            email="user_mod1@test.com",
            fullname="User Mod1 Done",
            tools=["academy"],
        )
        _create_profile(
            session, clean_academy_stats, user_mod1.id, sector=test_sector
        )

        for ch in mod1.chapters:
            _record_progress(
                session,
                clean_academy_stats,
                user_id=user_mod1.id,
                chapter_id=ch.id,
                status=AcademyChapterProgressStatus.completed,
            )

        # Query isolated by sector
        res = await client.get(
            f"/admin/academy-user-statistics?sector={test_sector}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["kpis"]["registered_users"] == 1
        assert data["kpis"]["avg_modules_completed"] == 1.0

        bins = {b["modules_completed"]: b for b in data["module_distribution"]}
        assert bins[1]["count"] == 1
        assert bins[1]["percentage"] == 100.0
        assert bins[0]["count"] == 0
        assert bins[2]["count"] == 0

    async def test_company_progress_and_sorting(
        self,
        client: AsyncClient,
        session: Session,
        clean_academy_stats,
    ):
        """Verifies company grouping, progress %, and descending user count order."""
        admin = _create_user(
            session,
            clean_academy_stats,
            email="admin_comp@test.com",
            fullname="Company Admin",
            role=UserRole.admin,
        )
        token = generate_user_token(admin)

        test_region = "CompTestRegion"
        comp_a = _create_company(
            session, clean_academy_stats, name="Alpha Global"
        )
        comp_b = _create_company(session, clean_academy_stats, name="Beta Ltd")

        # 2 users in Alpha Global
        u1 = _create_user(
            session,
            clean_academy_stats,
            email="u1_alpha@test.com",
            fullname="User Alpha 1",
            tools=["academy"],
            company_id=comp_a.id,
        )
        _create_profile(
            session, clean_academy_stats, u1.id, region_name=test_region
        )

        u2 = _create_user(
            session,
            clean_academy_stats,
            email="u2_alpha@test.com",
            fullname="User Alpha 2",
            tools=["academy"],
            company_id=comp_a.id,
        )
        _create_profile(
            session, clean_academy_stats, u2.id, region_name=test_region
        )

        # 1 user in Beta Ltd
        u3 = _create_user(
            session,
            clean_academy_stats,
            email="u3_beta@test.com",
            fullname="User Beta 1",
            tools=["academy"],
            company_id=comp_b.id,
        )
        _create_profile(
            session, clean_academy_stats, u3.id, region_name=test_region
        )

        res = await client.get(
            f"/admin/academy-user-statistics?region={test_region}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 200
        companies = res.json()["companies"]
        assert len(companies) == 2
        # Alpha Global has 2 users, Beta Ltd has 1 user -> Alpha Global must come first
        assert companies[0]["company"] == "Alpha Global"
        assert companies[0]["users_count"] == 2
        assert companies[1]["company"] == "Beta Ltd"
        assert companies[1]["users_count"] == 1

    async def test_filter_by_year(
        self,
        client: AsyncClient,
        session: Session,
        clean_academy_stats,
    ):
        """Verifies filtering by registration year."""
        admin = _create_user(
            session,
            clean_academy_stats,
            email="admin_year@test.com",
            fullname="Year Admin",
            role=UserRole.admin,
        )
        token = generate_user_token(admin)

        _create_user(
            session,
            clean_academy_stats,
            email="user_2024@test.com",
            fullname="Past User",
            tools=["academy"],
            created_at=datetime(2024, 6, 15, tzinfo=timezone.utc),
        )

        res_2024 = await client.get(
            "/admin/academy-user-statistics?year=2024",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res_2024.status_code == 200
        data_2024 = res_2024.json()
        assert data_2024["kpis"]["registered_users"] >= 1
        assert 2024 in data_2024["filter_options"]["years"]

        res_1999 = await client.get(
            "/admin/academy-user-statistics?year=1999",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res_1999.status_code == 200
        assert res_1999.json()["kpis"]["registered_users"] == 0

    async def test_filter_by_region_and_sector_case_insensitive(
        self,
        client: AsyncClient,
        session: Session,
        clean_academy_stats,
    ):
        """Verifies filtering by region and sector with case-insensitive matching."""
        admin = _create_user(
            session,
            clean_academy_stats,
            email="admin_filter@test.com",
            fullname="Filter Admin",
            role=UserRole.admin,
        )
        token = generate_user_token(admin)

        u = _create_user(
            session,
            clean_academy_stats,
            email="user_filter@test.com",
            fullname="Filtered User",
            tools=["academy"],
        )
        _create_profile(
            session,
            clean_academy_stats,
            u.id,
            company_name="Palm Corp",
            sector="Agriculture",
            region_name="Southeast Asia",
        )

        # Query with lowercase / uppercase variations
        res = await client.get(
            "/admin/academy-user-statistics?region=southeast%20asia&sector=AGRICULTURE",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["kpis"]["registered_users"] == 1
        assert len(data["companies"]) == 1
        assert data["companies"][0]["company"] == "Palm Corp"

        # Non-matching filter returns 0
        res_none = await client.get(
            "/admin/academy-user-statistics?region=non_existing_region",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res_none.status_code == 200
        assert res_none.json()["kpis"]["registered_users"] == 0

import os
import random
import sys
from datetime import datetime, timedelta, timezone

from faker import Faker
from sqlalchemy import func
from sqlalchemy.orm import Session

BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)
sys.path.append(BASE_DIR)

from db.connection import SessionLocal  # noqa: E402
from models.academy.academy_models import (  # noqa: E402
    AcademyChapterProgressStatus,
    AcademyModule,
    AcademyUserChapterProgress,
)
from models.company import Company  # noqa: E402
from models.user import User  # noqa: E402
from models.user_profile import UserProfile  # noqa: E402

fake = Faker()

ENTERPRISE_COMPANIES = [
    "Barry Callebaut",
    "Olam Agri",
    "Cargill",
    "Nestlé",
    "Unilever",
    "Ecom Agroindustrial",
    "Sucafina",
    "Touton",
    "Fairtrade International",
    "Rainforest Alliance",
    "Louis Dreyfus Company",
]

SECTORS = [
    "Cocoa",
    "Coffee",
    "Tea",
    "Palm Oil",
    "Spices",
    "Cotton",
    "Grains",
]

REGIONS = [
    "West Africa",
    "East Africa",
    "Southeast Asia",
    "Latin America",
    "Europe",
]


def get_or_create_companies(session: Session):
    company_map = {}
    for name in ENTERPRISE_COMPANIES:
        comp = (
            session.query(Company)
            .filter(func.lower(Company.name) == name.strip().lower())
            .first()
        )
        if not comp:
            comp = Company(id=None, name=name)
            session.add(comp)
            session.commit()
            session.refresh(comp)
        company_map[name] = comp
    return list(company_map.values())


def seed_academy_stats(session: Session, clean: bool = False):
    """Populate realistic Academy user profiles and chapter progress."""
    print("Starting Academy statistics faker seeder...")

    # 1. Fetch all curriculum modules & chapters in natural order
    modules = (
        session.query(AcademyModule)
        .order_by(AcademyModule.order_index.asc())
        .all()
    )
    if not modules:
        print("Error: No AcademyModule records found in database.")
        return

    # 2. Fetch all verified users having Academy in tools
    users = (
        session.query(User)
        .filter(User.tools.op("@>")(["academy"]))
        .filter(User.is_active == 1)
        .order_by(User.id.asc())
        .all()
    )
    if not users:
        print("Error: No active Academy users found to seed.")
        return

    print(f"Found {len(users)} active Academy users.")

    if clean:
        print("Cleaning existing academy chapter progress records...")
        user_ids = [u.id for u in users]
        session.query(AcademyUserChapterProgress).filter(
            AcademyUserChapterProgress.user_id.in_(user_ids)
        ).delete(synchronize_session=False)
        session.commit()

    companies = get_or_create_companies(session)
    now = datetime.now(timezone.utc)

    # 3. Setup distribution targets across cohorts (0 to 6 completed modules)
    # Approx weights: 0: 15%, 1: 20%, 2: 20%, 3: 20%, 4: 10%, 5: 8%, 6: 7%
    cohort_weights = [15, 20, 20, 20, 10, 8, 7]

    seeded_progress_count = 0
    updated_profiles_count = 0

    for idx, user in enumerate(users):
        # A. Assign Company & Profile
        assigned_comp = companies[idx % len(companies)]
        user.company = assigned_comp.id

        # Stagger registration dates (2024, 2025, 2026)
        reg_year = random.choices(
            [2024, 2025, 2026], weights=[30, 50, 20], k=1
        )[0]
        reg_month = random.randint(1, 12 if reg_year < 2026 else now.month)
        reg_day = random.randint(1, 28)
        user.created_at = datetime(
            reg_year, reg_month, reg_day, tzinfo=timezone.utc
        )

        profile = (
            session.query(UserProfile)
            .filter(UserProfile.user_id == user.id)
            .first()
        )
        assigned_sector = SECTORS[idx % len(SECTORS)]
        assigned_region = REGIONS[idx % len(REGIONS)]

        if not profile:
            profile = UserProfile(
                user_id=user.id,
                company_name=assigned_comp.name,
                company_type="Private Sector",
                sector=assigned_sector,
                region_name=assigned_region,
            )
            session.add(profile)
        else:
            profile.company_name = assigned_comp.name
            profile.sector = assigned_sector
            profile.region_name = assigned_region
        updated_profiles_count += 1

        # B. Assign module completion quota
        target_modules_completed = random.choices(
            range(7), weights=cohort_weights, k=1
        )[0]

        # Activity timestamp: 65% active within last 30 days
        is_active_recent = (idx % 100) < 65
        if is_active_recent:
            days_ago = random.randint(1, 27)
        else:
            days_ago = random.randint(35, 120)
        last_opened = now - timedelta(days=days_ago)

        # Complete target modules
        for m_idx in range(target_modules_completed):
            mod = modules[m_idx]
            for ch in mod.chapters:
                existing_prog = (
                    session.query(AcademyUserChapterProgress)
                    .filter_by(user_id=user.id, chapter_id=ch.id)
                    .first()
                )
                if not existing_prog:
                    prog = AcademyUserChapterProgress(
                        user_id=user.id,
                        chapter_id=ch.id,
                        status=AcademyChapterProgressStatus.completed,
                        last_opened_at=last_opened,
                    )
                    session.add(prog)
                    seeded_progress_count += 1
                else:
                    existing_prog.status = (
                        AcademyChapterProgressStatus.completed
                    )
                    existing_prog.last_opened_at = last_opened

        # For partial progress in the next module (if not finished all 6)
        if target_modules_completed < len(modules) and target_modules_completed > 0:
            next_mod = modules[target_modules_completed]
            if next_mod.chapters:
                partial_ch = next_mod.chapters[0]
                existing_prog = (
                    session.query(AcademyUserChapterProgress)
                    .filter_by(user_id=user.id, chapter_id=partial_ch.id)
                    .first()
                )
                if not existing_prog:
                    prog = AcademyUserChapterProgress(
                        user_id=user.id,
                        chapter_id=partial_ch.id,
                        status=AcademyChapterProgressStatus.in_progress,
                        last_opened_at=last_opened,
                    )
                    session.add(prog)
                    seeded_progress_count += 1
                else:
                    existing_prog.status = (
                        AcademyChapterProgressStatus.in_progress
                    )
                    existing_prog.last_opened_at = last_opened

    session.commit()
    print("Academy statistics seeding completed successfully!")
    print(f"- Updated {updated_profiles_count} user profiles.")
    print(f"- Seeded/Updated {seeded_progress_count} chapter progress entries.")


if __name__ == "__main__":
    db_session = SessionLocal()
    clean_flag = "--clean" in sys.argv
    try:
        seed_academy_stats(db_session, clean=clean_flag)
    finally:
        db_session.close()

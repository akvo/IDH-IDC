from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Set
from collections import defaultdict

from sqlalchemy import distinct, func
from sqlalchemy.orm import Session

from models.academy.academy_models import (
    AcademyChapterProgressStatus,
    AcademyModule,
    AcademyUserChapterProgress,
)
from models.company import Company
from models.user import User
from models.user_profile import UserProfile
from models.admin_academy_stats import (
    AcademyCompanyStatItem,
    AcademyKpiStats,
    AcademyModuleDistributionBin,
    AcademyStatsFilterOptions,
    AcademyUserStatsResponse,
)


def get_academy_user_statistics(
    session: Session,
    year: Optional[int] = None,
    region: Optional[str] = None,
    sector: Optional[str] = None,
) -> AcademyUserStatsResponse:
    """Calculates aggregated KPIs, module completion bins, company participation

    metrics, and filter options for the Living Income Academy.
    """
    # 1. Fetch Curriculum Structure (Modules and Chapters)
    modules = (
        session.query(AcademyModule)
        .order_by(AcademyModule.order_index)
        .all()
    )
    total_modules_count = len(modules) if modules else 6
    module_chapter_ids: Dict[int, List[int]] = {
        m.id: [c.id for c in m.chapters] for m in modules
    }
    total_chapters_count = sum(
        len(ch_ids) for ch_ids in module_chapter_ids.values()
    )

    # 2. Build Cohort Query
    cohort_q = session.query(User).filter(
        User.tools.contains(["academy"]),
        User.is_active == 1,
    )

    if year is not None:
        cohort_q = cohort_q.filter(
            func.extract("year", User.created_at) == year
        )

    has_profile_join = False
    if region is not None and region.strip():
        cohort_q = cohort_q.join(
            UserProfile, UserProfile.user_id == User.id
        ).filter(
            func.lower(UserProfile.region_name) == region.strip().lower()
        )
        has_profile_join = True

    if sector is not None and sector.strip():
        if not has_profile_join:
            cohort_q = cohort_q.join(
                UserProfile, UserProfile.user_id == User.id
            )
        cohort_q = cohort_q.filter(
            func.lower(UserProfile.sector) == sector.strip().lower()
        )

    cohort_users: List[User] = cohort_q.all()
    registered_users = len(cohort_users)
    cohort_user_ids = [u.id for u in cohort_users]

    # 3. Chapter Progress Aggregations
    user_completed_chapters: Dict[int, Set[int]] = {
        uid: set() for uid in cohort_user_ids
    }
    if cohort_user_ids:
        completed_records = (
            session.query(
                AcademyUserChapterProgress.user_id,
                AcademyUserChapterProgress.chapter_id,
            )
            .filter(
                AcademyUserChapterProgress.user_id.in_(cohort_user_ids),
                AcademyUserChapterProgress.status
                == AcademyChapterProgressStatus.completed,
            )
            .all()
        )
        for uid, ch_id in completed_records:
            user_completed_chapters[uid].add(ch_id)

    # 4. Module Completion per User & Distribution Bins
    user_completed_modules: Dict[int, int] = {}
    for uid in cohort_user_ids:
        completed_ch_set = user_completed_chapters[uid]
        mod_done = 0
        for m in modules:
            ch_ids = module_chapter_ids.get(m.id, [])
            if ch_ids and all(cid in completed_ch_set for cid in ch_ids):
                mod_done += 1
        user_completed_modules[uid] = mod_done

    bin_counts = {i: 0 for i in range(total_modules_count + 1)}
    for uid in cohort_user_ids:
        completed_count = user_completed_modules[uid]
        bounded = min(completed_count, total_modules_count)
        bin_counts[bounded] += 1

    module_distribution: List[AcademyModuleDistributionBin] = []
    for i in range(total_modules_count + 1):
        count = bin_counts[i]
        pct = (
            round((count / registered_users) * 100, 1)
            if registered_users > 0
            else 0.0
        )
        module_distribution.append(
            AcademyModuleDistributionBin(
                modules_completed=i,
                count=count,
                percentage=pct,
            )
        )

    # 5. Active Users (Last 30 Days)
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)
    active_users_30d = 0
    if cohort_user_ids:
        active_count = (
            session.query(
                func.count(distinct(AcademyUserChapterProgress.user_id))
            )
            .filter(
                AcademyUserChapterProgress.user_id.in_(cohort_user_ids),
                AcademyUserChapterProgress.last_opened_at >= cutoff,
            )
            .scalar()
        )
        active_users_30d = active_count or 0

    # 6. Company Participation Aggregation
    company_ids = [u.company for u in cohort_users if u.company]
    companies_by_id: Dict[int, str] = {}
    if company_ids:
        for comp in (
            session.query(Company)
            .filter(Company.id.in_(company_ids))
            .all()
        ):
            companies_by_id[comp.id] = comp.name

    profile_company_map: Dict[int, str] = {}
    if cohort_user_ids:
        for prof in (
            session.query(UserProfile.user_id, UserProfile.company_name)
            .filter(UserProfile.user_id.in_(cohort_user_ids))
            .all()
        ):
            if prof.company_name:
                profile_company_map[prof.user_id] = prof.company_name.strip()

    company_user_groups: Dict[str, List[int]] = defaultdict(list)
    for u in cohort_users:
        comp_name = "Unknown"
        if u.company and u.company in companies_by_id:
            comp_name = companies_by_id[u.company].strip()
        elif u.id in profile_company_map and profile_company_map[u.id]:
            comp_name = profile_company_map[u.id]
        company_user_groups[comp_name].append(u.id)

    companies_list: List[AcademyCompanyStatItem] = []
    distinct_companies_count = 0

    for c_name, uids in company_user_groups.items():
        if c_name != "Unknown":
            distinct_companies_count += 1
        u_count = len(uids)
        progress_percentages = [
            (len(user_completed_chapters[uid]) / total_chapters_count) * 100
            if total_chapters_count > 0
            else 0.0
            for uid in uids
        ]
        avg_prog = (
            round(sum(progress_percentages) / u_count, 1) if u_count > 0 else 0.0
        )
        completed_all = sum(
            1 for uid in uids if user_completed_modules[uid] >= total_modules_count
        )
        companies_list.append(
            AcademyCompanyStatItem(
                company=c_name,
                users_count=u_count,
                average_progress_pct=avg_prog,
                completed_all_modules_count=completed_all,
            )
        )

    # If only "Unknown" exists, companies_count is 0 or len(companies_list)
    if distinct_companies_count == 0 and companies_list:
        distinct_companies_count = len(companies_list)

    # Sort companies by user count descending, then alphabetical
    companies_list.sort(key=lambda x: (-x.users_count, x.company.lower()))

    # 7. Average Modules Completed
    avg_modules = (
        round(sum(user_completed_modules.values()) / registered_users, 1)
        if registered_users > 0
        else 0.0
    )

    kpis = AcademyKpiStats(
        registered_users=registered_users,
        active_users_30d=active_users_30d,
        companies_count=distinct_companies_count,
        avg_modules_completed=avg_modules,
        total_modules=total_modules_count,
    )

    # 8. Available Filter Options
    years_q = (
        session.query(func.distinct(func.extract("year", User.created_at)))
        .filter(User.tools.contains(["academy"]), User.is_active == 1)
        .all()
    )
    available_years = sorted(
        [int(y[0]) for y in years_q if y[0] is not None], reverse=True
    )

    regions_q = (
        session.query(func.distinct(UserProfile.region_name))
        .join(User, User.id == UserProfile.user_id)
        .filter(
            User.tools.contains(["academy"]),
            User.is_active == 1,
            UserProfile.region_name.isnot(None),
        )
        .all()
    )
    available_regions = sorted(
        [str(r[0]).strip() for r in regions_q if r[0] and str(r[0]).strip()]
    )

    sectors_q = (
        session.query(func.distinct(UserProfile.sector))
        .join(User, User.id == UserProfile.user_id)
        .filter(
            User.tools.contains(["academy"]),
            User.is_active == 1,
            UserProfile.sector.isnot(None),
        )
        .all()
    )
    available_sectors = sorted(
        [str(s[0]).strip() for s in sectors_q if s[0] and str(s[0]).strip()]
    )

    filter_options = AcademyStatsFilterOptions(
        years=available_years,
        regions=available_regions,
        sectors=available_sectors,
    )

    return AcademyUserStatsResponse(
        kpis=kpis,
        module_distribution=module_distribution,
        companies=companies_list,
        filter_options=filter_options,
    )

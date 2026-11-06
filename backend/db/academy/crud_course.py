from datetime import datetime
from math import ceil
from typing import Dict, List, Optional, Set, Tuple

from sqlalchemy import distinct, func, or_
from sqlalchemy.orm import Session

from models.academy import (
    AcademyChapter,
    AcademyChapterDetailResponse,
    AcademyChapterProgressStatus,
    AcademyChapterSummary,
    AcademyHistoryItem,
    AcademyHistoryResponse,
    AcademyMetricsResponse,
    AcademyModule,
    AcademyModuleDetailItem,
    AcademyModuleOverviewCard,
    AcademyModulesResponse,
    AcademyOverviewResponse,
    AcademyRecentlyOpenedChapter,
    AcademyTag,
    AcademyTagRelation,
    AcademyTagSummary,
    AcademyTagWithCounts,
    AcademyUserChapterProgress,
    ChapterProgressUpdateResponse,
)
from models.user import User
from models.user_profile import UserProfile


COURSE_SUMMARY_HTML = (
    "<p>Welcome to the Living Income Academy course modules. Explore each "
    "module to learn strategies and tools for closing the living income "
    "gap.</p>"
)


def format_status(status_val: Optional[object]) -> str:
    """Format an AcademyChapterProgressStatus enum or string into UI text."""
    if not status_val:
        return "Not started"
    s = str(status_val.value if hasattr(status_val, "value") else status_val)
    if s == "completed":
        return "Completed"
    if s == "in_progress":
        return "In progress"
    return "Not started"


def get_user_greeting_name(session: Session, user: User) -> str:
    """Determine greeting name for learner with profile and user fallbacks."""
    profile = (
        session.query(UserProfile)
        .filter(UserProfile.user_id == user.id)
        .first()
    )
    if profile:
        first = (profile.first_name or "").strip()
        last = (profile.last_name or "").strip()
        full = f"{first} {last}".strip()
        if first:
            return first
        if full:
            return full
    if user.fullname and user.fullname.strip():
        return user.fullname.strip()
    if user.email:
        return user.email.split("@")[0]
    return "Learner"


def get_course_tags(session: Session) -> List[AcademyTagWithCounts]:
    """Retrieve all academy tags with attached module and chapter counts."""
    tags = (
        session.query(AcademyTag)
        .order_by(AcademyTag.order_index.asc(), AcademyTag.name.asc())
        .all()
    )

    module_counts = dict(
        session.query(
            AcademyTagRelation.tag_id,
            func.count(distinct(AcademyTagRelation.module_id)),
        )
        .filter(AcademyTagRelation.module_id.isnot(None))
        .group_by(AcademyTagRelation.tag_id)
        .all()
    )

    chapter_counts = dict(
        session.query(
            AcademyTagRelation.tag_id,
            func.count(distinct(AcademyTagRelation.chapter_id)),
        )
        .filter(AcademyTagRelation.chapter_id.isnot(None))
        .group_by(AcademyTagRelation.tag_id)
        .all()
    )

    result = []
    for tag in tags:
        result.append(
            AcademyTagWithCounts(
                id=tag.id,
                name=tag.name,
                slug=tag.slug,
                order_index=tag.order_index,
                module_count=module_counts.get(tag.id, 0),
                chapter_count=chapter_counts.get(tag.id, 0),
            )
        )
    return result


def get_tag_summaries_maps(
    session: Session,
) -> Tuple[
    Dict[int, List[AcademyTagSummary]], Dict[int, List[AcademyTagSummary]]
]:
    """Pre-fetch all tag relations to map tags to module and chapter IDs."""
    relations = (
        session.query(AcademyTagRelation)
        .join(AcademyTag, AcademyTagRelation.tag_id == AcademyTag.id)
        .order_by(AcademyTag.order_index.asc(), AcademyTag.name.asc())
        .all()
    )
    module_tags: Dict[int, List[AcademyTagSummary]] = {}
    chapter_tags: Dict[int, List[AcademyTagSummary]] = {}

    for rel in relations:
        summary = AcademyTagSummary(
            id=rel.tag.id,
            name=rel.tag.name,
            slug=rel.tag.slug,
        )
        if rel.module_id is not None:
            module_tags.setdefault(rel.module_id, []).append(summary)
        if rel.chapter_id is not None:
            chapter_tags.setdefault(rel.chapter_id, []).append(summary)

    return module_tags, chapter_tags


def get_ordered_chapters_and_modules(
    session: Session,
) -> Tuple[List[AcademyModule], List[AcademyChapter]]:
    """Fetch all modules and chapters in canonical curriculum order."""
    modules = (
        session.query(AcademyModule)
        .order_by(AcademyModule.order_index.asc())
        .all()
    )
    chapters = (
        session.query(AcademyChapter)
        .join(AcademyModule, AcademyChapter.module_id == AcademyModule.id)
        .order_by(
            AcademyModule.order_index.asc(),
            AcademyChapter.chapter_number.asc(),
        )
        .all()
    )
    return modules, chapters


def get_chapter_navigation_ids(
    chapters: List[AcademyChapter], target_chapter_id: int
) -> Tuple[Optional[int], Optional[int]]:
    """Resolve previous and next chapter IDs across module boundaries."""
    for idx, chapter in enumerate(chapters):
        if chapter.id == target_chapter_id:
            prev_id = chapters[idx - 1].id if idx > 0 else None
            next_id = (
                chapters[idx + 1].id if idx < len(chapters) - 1 else None
            )
            return prev_id, next_id
    return None, None


def determine_continue_chapter_id(
    chapters: List[AcademyChapter],
    progress_map: Dict[int, AcademyUserChapterProgress],
    opened_records: List[AcademyUserChapterProgress],
) -> Optional[int]:
    """Find the best chapter for the learner to resume reading."""
    if not chapters:
        return None

    # 1. Check for most recently opened chapter that is NOT completed
    for rec in opened_records:
        if rec.status != AcademyChapterProgressStatus.completed:
            return rec.chapter_id

    # 2. If all opened are completed, find next incomplete in global order
    for chapter in chapters:
        prog = progress_map.get(chapter.id)
        if not prog or prog.status != AcademyChapterProgressStatus.completed:
            return chapter.id

    # 3. If everything is completed, fallback to first chapter for review
    return chapters[0].id if chapters else None


def get_user_course_overview(
    session: Session, user: User
) -> AcademyOverviewResponse:
    """Compute KPI metrics, roadmap cards, and history for overview."""
    modules, chapters = get_ordered_chapters_and_modules(session)
    greeting_name = get_user_greeting_name(session, user)

    progress_records = (
        session.query(AcademyUserChapterProgress)
        .filter(AcademyUserChapterProgress.user_id == user.id)
        .all()
    )
    progress_map: Dict[int, AcademyUserChapterProgress] = {
        p.chapter_id: p for p in progress_records
    }

    module_tags, chapter_tags = get_tag_summaries_maps(session)

    total_modules = len(modules)
    total_chapters = len(chapters)
    chapters_completed = sum(
        1
        for c in chapters
        if progress_map.get(c.id)
        and progress_map[c.id].status == AcademyChapterProgressStatus.completed
    )
    academy_progress_pct = (
        round((chapters_completed / total_chapters) * 100)
        if total_chapters > 0
        else 0
    )

    modules_completed = 0
    overview_modules: List[AcademyModuleOverviewCard] = []

    chapters_by_module: Dict[int, List[AcademyChapter]] = {}
    for c in chapters:
        chapters_by_module.setdefault(c.module_id, []).append(c)

    for mod in modules:
        mod_chapters = chapters_by_module.get(mod.id, [])
        mod_total = len(mod_chapters)
        mod_completed = sum(
            1
            for c in mod_chapters
            if progress_map.get(c.id)
            and progress_map[c.id].status
            == AcademyChapterProgressStatus.completed
        )
        mod_in_progress = sum(
            1
            for c in mod_chapters
            if progress_map.get(c.id)
            and progress_map[c.id].status
            == AcademyChapterProgressStatus.in_progress
        )
        mod_opened = sum(
            1
            for c in mod_chapters
            if progress_map.get(c.id)
            and progress_map[c.id].last_opened_at is not None
        )

        mod_progress_pct = (
            round((mod_completed / mod_total) * 100) if mod_total > 0 else 0
        )
        if mod_total > 0 and mod_completed == mod_total:
            mod_status = "Completed"
            modules_completed += 1
        elif mod_completed > 0 or mod_in_progress > 0 or mod_opened > 0:
            mod_status = "In progress"
        else:
            mod_status = "Not started"

        overview_modules.append(
            AcademyModuleOverviewCard(
                id=mod.id,
                order_index=mod.order_index,
                title=mod.title,
                description=mod.description,
                estimated_minutes=mod.estimated_minutes,
                icon_theme=mod.icon_theme,
                progress_pct=mod_progress_pct,
                status=mod_status,
                tags=module_tags.get(mod.id, []),
            )
        )

    modules_completed_pct = (
        round((modules_completed / total_modules) * 100)
        if total_modules > 0
        else 0
    )

    metrics = AcademyMetricsResponse(
        academy_progress_pct=academy_progress_pct,
        modules_completed=modules_completed,
        total_modules=total_modules,
        modules_completed_pct=modules_completed_pct,
        chapters_completed=chapters_completed,
        total_chapters=total_chapters,
        chapters_completed_pct=academy_progress_pct,
    )

    opened_records = [
        p for p in progress_records if p.last_opened_at is not None
    ]
    opened_records.sort(
        key=lambda x: x.last_opened_at or datetime.min, reverse=True
    )
    top_3_records = opened_records[:3]

    chapter_by_id = {c.id: c for c in chapters}
    module_by_id = {m.id: m for m in modules}

    recently_opened: List[AcademyRecentlyOpenedChapter] = []
    for rec in top_3_records:
        chap = chapter_by_id.get(rec.chapter_id)
        if chap:
            mod = module_by_id.get(chap.module_id)
            recently_opened.append(
                AcademyRecentlyOpenedChapter(
                    id=chap.id,
                    module_id=chap.module_id,
                    module_order_index=mod.order_index if mod else 0,
                    module_title=mod.title if mod else "",
                    chapter_number=chap.chapter_number,
                    title=chap.title,
                    estimated_minutes=chap.estimated_minutes,
                    status=format_status(rec.status),
                    last_opened_at=rec.last_opened_at,
                    tags=chapter_tags.get(chap.id, []),
                )
            )

    continue_chapter_id = determine_continue_chapter_id(
        chapters, progress_map, opened_records
    )

    return AcademyOverviewResponse(
        greeting_name=greeting_name,
        continue_chapter_id=continue_chapter_id,
        metrics=metrics,
        modules=overview_modules,
        recently_opened=recently_opened,
    )


def get_course_modules(
    session: Session,
    user_id: int,
    search: Optional[str] = None,
    tag: Optional[str] = None,
    tag_id: Optional[int] = None,
) -> AcademyModulesResponse:
    """List modules with nested chapters, search, and tag filtering."""
    modules, chapters = get_ordered_chapters_and_modules(session)

    progress_records = (
        session.query(AcademyUserChapterProgress)
        .filter(AcademyUserChapterProgress.user_id == user_id)
        .all()
    )
    progress_map: Dict[int, AcademyUserChapterProgress] = {
        p.chapter_id: p for p in progress_records
    }

    module_tags, chapter_tags = get_tag_summaries_maps(session)

    # Resolve tag filter
    target_tag_id = tag_id
    if target_tag_id is None and tag:
        tag_record = (
            session.query(AcademyTag)
            .filter(
                or_(
                    AcademyTag.slug.ilike(tag.strip()),
                    AcademyTag.name.ilike(tag.strip()),
                )
            )
            .first()
        )
        if tag_record:
            target_tag_id = tag_record.id
        else:
            # Tag was specified but does not exist -> return empty
            return AcademyModulesResponse(
                total_modules=0,
                course_summary_html=COURSE_SUMMARY_HTML,
                modules=[],
            )

    search_term = search.strip().lower() if search else None

    # Group chapters by module
    chapters_by_module: Dict[int, List[AcademyChapter]] = {}
    for c in chapters:
        chapters_by_module.setdefault(c.module_id, []).append(c)

    filtered_modules: List[AcademyModuleDetailItem] = []

    for mod in modules:
        mod_chapters = chapters_by_module.get(mod.id, [])
        mod_tag_ids: Set[int] = {t.id for t in module_tags.get(mod.id, [])}
        mod_tag_names = [t.name.lower() for t in module_tags.get(mod.id, [])]
        mod_matches_search = (
            search_term is None
            or search_term in mod.title.lower()
            or (mod.description and search_term in mod.description.lower())
            or any(search_term in tname for tname in mod_tag_names)
        )
        mod_matches_tag = (
            target_tag_id is None or target_tag_id in mod_tag_ids
        )

        matching_chapters: List[AcademyChapterSummary] = []
        for chap in mod_chapters:
            chap_tag_ids: Set[int] = {
                t.id for t in chapter_tags.get(chap.id, [])
            }
            chap_tag_names = [
                t.name.lower() for t in chapter_tags.get(chap.id, [])
            ]
            chap_matches_search = (
                search_term is None
                or search_term in chap.title.lower()
                or any(search_term in tname for tname in chap_tag_names)
                or mod_matches_search
            )
            chap_matches_tag = (
                target_tag_id is None
                or target_tag_id in chap_tag_ids
                or mod_matches_tag
            )

            if chap_matches_search and chap_matches_tag:
                prog = progress_map.get(chap.id)
                matching_chapters.append(
                    AcademyChapterSummary(
                        id=chap.id,
                        chapter_number=chap.chapter_number,
                        title=chap.title,
                        estimated_minutes=chap.estimated_minutes,
                        status=format_status(prog.status if prog else None),
                        tags=chapter_tags.get(chap.id, []),
                    )
                )

        # Include module if it matched or if any chapter matched
        if matching_chapters or (mod_matches_search and mod_matches_tag):
            mod_total = len(mod_chapters)
            mod_completed = sum(
                1
                for c in mod_chapters
                if progress_map.get(c.id)
                and progress_map[c.id].status
                == AcademyChapterProgressStatus.completed
            )
            mod_in_progress = sum(
                1
                for c in mod_chapters
                if progress_map.get(c.id)
                and progress_map[c.id].status
                == AcademyChapterProgressStatus.in_progress
            )
            mod_opened = sum(
                1
                for c in mod_chapters
                if progress_map.get(c.id)
                and progress_map[c.id].last_opened_at is not None
            )
            mod_progress_pct = (
                round((mod_completed / mod_total) * 100)
                if mod_total > 0
                else 0
            )

            if mod_total > 0 and mod_completed == mod_total:
                mod_status = "Completed"
            elif mod_completed > 0 or mod_in_progress > 0 or mod_opened > 0:
                mod_status = "In progress"
            else:
                mod_status = "Not started"

            filtered_modules.append(
                AcademyModuleDetailItem(
                    id=mod.id,
                    order_index=mod.order_index,
                    title=mod.title,
                    description=mod.description,
                    estimated_minutes=mod.estimated_minutes,
                    icon_theme=mod.icon_theme,
                    progress_pct=mod_progress_pct,
                    status=mod_status,
                    tags=module_tags.get(mod.id, []),
                    chapters=matching_chapters,
                )
            )

    return AcademyModulesResponse(
        total_modules=len(filtered_modules),
        course_summary_html=COURSE_SUMMARY_HTML,
        modules=filtered_modules,
    )


def get_chapter_details(
    session: Session, chapter_id: int, user_id: int
) -> Optional[AcademyChapterDetailResponse]:
    """Retrieve full chapter content with relative prev/next navigation."""
    chapter = (
        session.query(AcademyChapter)
        .filter(AcademyChapter.id == chapter_id)
        .first()
    )
    if not chapter:
        return None

    _, chapters = get_ordered_chapters_and_modules(session)
    prev_id, next_id = get_chapter_navigation_ids(chapters, chapter_id)

    progress = (
        session.query(AcademyUserChapterProgress)
        .filter(
            AcademyUserChapterProgress.user_id == user_id,
            AcademyUserChapterProgress.chapter_id == chapter_id,
        )
        .first()
    )

    _, chapter_tags = get_tag_summaries_maps(session)

    return AcademyChapterDetailResponse(
        id=chapter.id,
        module_id=chapter.module_id,
        module_title=chapter.module.title if chapter.module else None,
        chapter_number=chapter.chapter_number,
        title=chapter.title,
        content_html=chapter.content_html,
        estimated_minutes=chapter.estimated_minutes,
        status=format_status(progress.status if progress else None),
        tags=chapter_tags.get(chapter.id, []),
        prev_chapter_id=prev_id,
        next_chapter_id=next_id,
    )


def upsert_chapter_progress(
    session: Session,
    chapter_id: int,
    user_id: int,
    status: AcademyChapterProgressStatus,
    mark_opened: bool = False,
) -> Optional[ChapterProgressUpdateResponse]:
    """Update progress for a chapter and recompute module and course KPIs."""
    chapter = (
        session.query(AcademyChapter)
        .filter(AcademyChapter.id == chapter_id)
        .first()
    )
    if not chapter:
        return None

    progress = (
        session.query(AcademyUserChapterProgress)
        .filter(
            AcademyUserChapterProgress.user_id == user_id,
            AcademyUserChapterProgress.chapter_id == chapter_id,
        )
        .first()
    )

    now = datetime.utcnow()
    if not progress:
        progress = AcademyUserChapterProgress(
            user_id=user_id,
            chapter_id=chapter_id,
            status=status,
        )
        session.add(progress)

    if mark_opened or status in (
        AcademyChapterProgressStatus.in_progress,
        AcademyChapterProgressStatus.completed,
    ):
        progress.last_opened_at = now

    progress.status = status
    if status == AcademyChapterProgressStatus.completed:
        if not progress.completed_at:
            progress.completed_at = now
    else:
        progress.completed_at = None

    session.commit()
    session.refresh(progress)

    # Module recalculation
    mod_chapters = (
        session.query(AcademyChapter)
        .filter(AcademyChapter.module_id == chapter.module_id)
        .all()
    )
    mod_total = len(mod_chapters)
    mod_chapter_ids = [c.id for c in mod_chapters]

    mod_completed = (
        session.query(AcademyUserChapterProgress)
        .filter(
            AcademyUserChapterProgress.user_id == user_id,
            AcademyUserChapterProgress.chapter_id.in_(mod_chapter_ids),
            AcademyUserChapterProgress.status
            == AcademyChapterProgressStatus.completed,
        )
        .count()
    )
    mod_in_progress = (
        session.query(AcademyUserChapterProgress)
        .filter(
            AcademyUserChapterProgress.user_id == user_id,
            AcademyUserChapterProgress.chapter_id.in_(mod_chapter_ids),
            AcademyUserChapterProgress.status
            == AcademyChapterProgressStatus.in_progress,
        )
        .count()
    )
    mod_opened = (
        session.query(AcademyUserChapterProgress)
        .filter(
            AcademyUserChapterProgress.user_id == user_id,
            AcademyUserChapterProgress.chapter_id.in_(mod_chapter_ids),
            AcademyUserChapterProgress.last_opened_at.isnot(None),
        )
        .count()
    )

    mod_progress_pct = (
        round((mod_completed / mod_total) * 100) if mod_total > 0 else 0
    )
    if mod_total > 0 and mod_completed == mod_total:
        module_status = "Completed"
    elif mod_completed > 0 or mod_in_progress > 0 or mod_opened > 0:
        module_status = "In progress"
    else:
        module_status = "Not started"

    # Course recalculation (batch in-memory aggregation)
    chapter_rows = (
        session.query(AcademyChapter.module_id, AcademyChapter.id)
        .all()
    )
    total_chapters = len(chapter_rows)
    completed_chapter_ids = {
        r[0]
        for r in session.query(AcademyUserChapterProgress.chapter_id)
        .filter(
            AcademyUserChapterProgress.user_id == user_id,
            AcademyUserChapterProgress.status
            == AcademyChapterProgressStatus.completed,
        )
        .all()
    }
    chapters_completed = len(completed_chapter_ids)
    course_progress_pct = (
        round((chapters_completed / total_chapters) * 100)
        if total_chapters > 0
        else 0
    )

    module_chapters_map = {}
    for m_id, c_id in chapter_rows:
        module_chapters_map.setdefault(m_id, []).append(c_id)

    modules_completed_count = 0
    for m_id, c_ids in module_chapters_map.items():
        if c_ids and all(cid in completed_chapter_ids for cid in c_ids):
            modules_completed_count += 1

    return ChapterProgressUpdateResponse(
        chapter_id=chapter_id,
        status=format_status(progress.status),
        last_opened_at=progress.last_opened_at,
        completed_at=progress.completed_at,
        module_id=chapter.module_id,
        module_progress_pct=mod_progress_pct,
        module_status=module_status,
        course_progress_pct=course_progress_pct,
        modules_completed=modules_completed_count,
        chapters_completed=chapters_completed,
    )


def get_user_reading_history(
    session: Session, user_id: int, page: int = 1, page_size: int = 10
) -> AcademyHistoryResponse:
    """Retrieve paginated reading history ordered by last_opened_at DESC."""
    if page < 1:
        page = 1
    if page_size < 1:
        page_size = 10

    base_query = (
        session.query(AcademyUserChapterProgress)
        .join(
            AcademyChapter,
            AcademyUserChapterProgress.chapter_id == AcademyChapter.id,
        )
        .join(
            AcademyModule,
            AcademyChapter.module_id == AcademyModule.id,
        )
        .filter(
            AcademyUserChapterProgress.user_id == user_id,
            AcademyUserChapterProgress.last_opened_at.isnot(None),
        )
    )

    total = base_query.count()
    total_pages = ceil(total / page_size) if total > 0 else 0
    offset = (page - 1) * page_size

    records = (
        base_query.order_by(AcademyUserChapterProgress.last_opened_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )

    items: List[AcademyHistoryItem] = []
    for rec in records:
        items.append(
            AcademyHistoryItem(
                chapter_id=rec.chapter.id,
                chapter_title=rec.chapter.title,
                chapter_number=rec.chapter.chapter_number,
                module_id=rec.chapter.module_id,
                module_order_index=rec.chapter.module.order_index,
                module_title=rec.chapter.module.title,
                estimated_minutes=rec.chapter.estimated_minutes,
                status=format_status(rec.status),
                last_opened_at=rec.last_opened_at,
                completed_at=rec.completed_at,
            )
        )

    return AcademyHistoryResponse(
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        data=items,
    )

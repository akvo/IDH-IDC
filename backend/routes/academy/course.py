from typing import List, Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    Request,
    status,
)
from fastapi.security import HTTPBasicCredentials as credentials
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session

from db.academy import crud_course
from db.connection import get_session
from middleware import verify_user
from models.academy import (
    AcademyChapterDetailResponse,
    AcademyHistoryResponse,
    AcademyModulesResponse,
    AcademyOverviewResponse,
    AcademyTagWithCounts,
    ChapterProgressUpdateRequest,
    ChapterProgressUpdateResponse,
)

security = HTTPBearer()
academy_course_router = APIRouter(prefix="/academy", tags=["Academy - Course"])


@academy_course_router.get(
    "/tags",
    response_model=List[AcademyTagWithCounts],
    summary="Get all course tags with module and chapter counts",
    name="academy:get_tags",
)
def get_tags(
    req: Request,
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    """Retrieve all academy tags with attached module and chapter counts."""
    verify_user(session=session, authenticated=req.state.authenticated)
    return crud_course.get_course_tags(session=session)


@academy_course_router.get(
    "/overview",
    response_model=AcademyOverviewResponse,
    summary="Get learner course overview, KPIs, and roadmap modules",
    name="academy:get_overview",
)
def get_overview(
    req: Request,
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    """Retrieve overview metrics, roadmap modules, and reading history."""
    user = verify_user(session=session, authenticated=req.state.authenticated)
    return crud_course.get_user_course_overview(session=session, user=user)


@academy_course_router.get(
    "/modules",
    response_model=AcademyModulesResponse,
    summary="Get all curriculum modules with nested chapters and filters",
    name="academy:get_modules",
)
def get_modules(
    req: Request,
    search: Optional[str] = Query(None, description="Search keyword"),
    tag: Optional[str] = Query(None, description="Tag slug or name"),
    tag_id: Optional[int] = Query(None, description="Tag ID"),
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    """List modules with nested chapters, search, and tag filtering."""
    user = verify_user(session=session, authenticated=req.state.authenticated)
    return crud_course.get_course_modules(
        session=session,
        user_id=user.id,
        search=search,
        tag=tag,
        tag_id=tag_id,
    )


@academy_course_router.get(
    "/chapters/{chapter_id}",
    response_model=AcademyChapterDetailResponse,
    summary="Get chapter content with relative prev/next navigation",
    name="academy:get_chapter_detail",
)
def get_chapter(
    chapter_id: int,
    req: Request,
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    """Retrieve full chapter content with relative prev/next navigation."""
    user = verify_user(session=session, authenticated=req.state.authenticated)
    chapter_detail = crud_course.get_chapter_details(
        session=session, chapter_id=chapter_id, user_id=user.id
    )
    if not chapter_detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chapter not found",
        )
    return chapter_detail


@academy_course_router.post(
    "/chapters/{chapter_id}/progress",
    response_model=ChapterProgressUpdateResponse,
    summary="Update chapter progress and recompute course metrics",
    name="academy:update_chapter_progress",
)
def update_progress(
    chapter_id: int,
    payload: ChapterProgressUpdateRequest,
    req: Request,
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    """Update progress for a chapter and recompute module and course KPIs."""
    user = verify_user(session=session, authenticated=req.state.authenticated)
    result = crud_course.upsert_chapter_progress(
        session=session,
        chapter_id=chapter_id,
        user_id=user.id,
        status=payload.status,
        mark_opened=payload.mark_opened,
    )
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chapter not found",
        )
    return result


@academy_course_router.get(
    "/history",
    response_model=AcademyHistoryResponse,
    summary="Get paginated learner chapter reading history",
    name="academy:get_reading_history",
)
def get_history(
    req: Request,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Page size"),
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    """Retrieve paginated reading history ordered by last_opened_at DESC."""
    user = verify_user(session=session, authenticated=req.state.authenticated)
    return crud_course.get_user_reading_history(
        session=session,
        user_id=user.id,
        page=page,
        page_size=page_size,
    )

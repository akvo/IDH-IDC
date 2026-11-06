from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    Query,
    Request,
)
from fastapi.security import HTTPBasicCredentials as credentials
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session

from db.academy import crud_resource
from db.connection import get_session
from middleware import verify_user
from models.academy import (
    AcademyGlossaryListResponse,
    AcademyGlossaryTermType,
    AcademyResourceListResponse,
    AcademyResourceType,
)

security = HTTPBearer()
academy_resource_router = APIRouter(
    prefix="/academy",
    tags=["Academy - Resources & Glossary"],
)


@academy_resource_router.get(
    "/resources",
    response_model=AcademyResourceListResponse,
    summary="Get academy technical resources with search, filter, and sort",
    name="academy:get_resources",
)
def get_resources(
    req: Request,
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
    search: Optional[str] = Query(
        None, description="Search term across resource name and file URL"
    ),
    resource_type: Optional[AcademyResourceType] = Query(
        None, description="Filter by resource type enum"
    ),
    sort_by: Optional[str] = Query(
        "name",
        description="Field to sort by: name, type/resource_type, created_at",
    ),
    sort_order: Optional[str] = Query(
        "asc", description="Sort direction: asc or desc"
    ),
):
    """Retrieve filtered and sorted technical guidance and tool resources."""
    verify_user(session=session, authenticated=req.state.authenticated)
    return crud_resource.get_academy_resources(
        session=session,
        search=search,
        resource_type=resource_type,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@academy_resource_router.get(
    "/glossary",
    response_model=AcademyGlossaryListResponse,
    summary="Get living income glossary terms with search, filter, and sort",
    name="academy:get_glossary",
)
def get_glossary(
    req: Request,
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
    search: Optional[str] = Query(
        None, description="Search term across term name and definition"
    ),
    term_type: Optional[AcademyGlossaryTermType] = Query(
        None, description="Filter by glossary term type enum"
    ),
    sort_by: Optional[str] = Query(
        "name",
        description="Field to sort by: name/term, type/term_type, created_at",
    ),
    sort_order: Optional[str] = Query(
        "asc", description="Sort direction: asc or desc"
    ),
):
    """Retrieve filtered and sorted Living Income glossary definitions."""
    verify_user(session=session, authenticated=req.state.authenticated)
    return crud_resource.get_academy_glossary(
        session=session,
        search=search,
        term_type=term_type,
        sort_by=sort_by,
        sort_order=sort_order,
    )

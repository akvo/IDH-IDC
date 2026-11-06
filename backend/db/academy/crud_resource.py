from typing import List, Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session

from models.academy import (
    AcademyGlossaryItemResponse,
    AcademyGlossaryListResponse,
    AcademyGlossaryTerm,
    AcademyGlossaryTermType,
    AcademyResource,
    AcademyResourceItemResponse,
    AcademyResourceListResponse,
    AcademyResourceType,
)


def get_academy_resources(
    session: Session,
    search: Optional[str] = None,
    resource_type: Optional[AcademyResourceType] = None,
    sort_by: Optional[str] = "name",
    sort_order: Optional[str] = "asc",
) -> AcademyResourceListResponse:
    """Retrieve filtered and sorted technical resources."""
    query = session.query(AcademyResource)

    if isinstance(search, str) and search.strip():
        s = search.strip()
        query = query.filter(
            or_(
                AcademyResource.name.ilike(f"%{s}%"),
                AcademyResource.file_url.ilike(f"%{s}%"),
            )
        )

    if resource_type:
        query = query.filter(AcademyResource.resource_type == resource_type)

    sb = sort_by.strip().lower() if isinstance(sort_by, str) else "name"
    if sb in ("type", "resource_type"):
        sort_col = AcademyResource.resource_type
    elif sb in ("created_at", "date"):
        sort_col = AcademyResource.created_at
    else:
        sort_col = AcademyResource.name

    so = sort_order.strip().lower() if isinstance(sort_order, str) else "asc"
    order_expr = sort_col.desc() if so == "desc" else sort_col.asc()
    query = query.order_by(order_expr, AcademyResource.id.asc())

    total = query.count()
    records = query.all()

    items: List[AcademyResourceItemResponse] = [
        AcademyResourceItemResponse(
            id=r.id,
            name=r.name,
            type=r.resource_type,
            url=r.file_url,
            description=getattr(r, "description", None),
            created_at=r.created_at,
        )
        for r in records
    ]

    return AcademyResourceListResponse(total=total, data=items)


def get_academy_glossary(
    session: Session,
    search: Optional[str] = None,
    term_type: Optional[AcademyGlossaryTermType] = None,
    sort_by: Optional[str] = "name",
    sort_order: Optional[str] = "asc",
) -> AcademyGlossaryListResponse:
    """Retrieve filtered and sorted living income glossary terms."""
    query = session.query(AcademyGlossaryTerm)

    if isinstance(search, str) and search.strip():
        s = search.strip()
        query = query.filter(
            or_(
                AcademyGlossaryTerm.name.ilike(f"%{s}%"),
                AcademyGlossaryTerm.definition.ilike(f"%{s}%"),
            )
        )

    if term_type:
        query = query.filter(AcademyGlossaryTerm.term_type == term_type)

    sb = sort_by.strip().lower() if isinstance(sort_by, str) else "name"
    if sb in ("type", "term_type"):
        sort_col = AcademyGlossaryTerm.term_type
    elif sb in ("created_at", "date"):
        sort_col = AcademyGlossaryTerm.created_at
    else:
        sort_col = AcademyGlossaryTerm.name

    so = sort_order.strip().lower() if isinstance(sort_order, str) else "asc"
    order_expr = sort_col.desc() if so == "desc" else sort_col.asc()
    query = query.order_by(order_expr, AcademyGlossaryTerm.id.asc())

    total = query.count()
    records = query.all()

    items: List[AcademyGlossaryItemResponse] = [
        AcademyGlossaryItemResponse(
            id=g.id,
            term=g.name,
            type=g.term_type,
            definition=g.definition,
            created_at=g.created_at,
        )
        for g in records
    ]

    return AcademyGlossaryListResponse(total=total, data=items)

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, func
from typing import Optional

from models.procurement_library_v2.pl_models import (
    PLPracticeIntervention,
    PLPracticeInterventionTag,
    PLAttribute,
    PLPracticeInterventionIndicatorScore,
)


# ============================================================
# GET LIST OF PRACTICES WITH PAGINATION
# ============================================================
def get_practice_list(
    db: Session,
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None,
) -> dict:
    """Return paginated list of practices."""
    offset = (page - 1) * limit

    query = select(PLPracticeIntervention).options(
        joinedload(PLPracticeIntervention.tags)
        .joinedload(PLPracticeInterventionTag.attribute)
        .joinedload(PLAttribute.category),
        joinedload(PLPracticeIntervention.indicator_scores)
        .joinedload(PLPracticeInterventionIndicatorScore.indicator),
    )

    if search:
        query = query.filter(PLPracticeIntervention.label.ilike(f"%{search}%"))

    total = db.scalar(select(func.count()).select_from(query.subquery()))
    results = db.scalars(query.offset(offset).limit(limit)).unique().all()

    return {
        "current": page,
        "total": total,
        "total_page": (total + limit - 1) // limit if total else 0,
        "data": [p.serialize for p in results],
    }


# ============================================================
# GET DETAIL BY ID
# ============================================================
def get_practice_by_id(db: Session, practice_id: int) -> Optional[dict]:
    """Return single practice detail."""
    stmt = (
        select(PLPracticeIntervention)
        .where(PLPracticeIntervention.id == practice_id)
        .options(
            joinedload(PLPracticeIntervention.tags)
            .joinedload("attribute")
            .joinedload("category"),
            joinedload(PLPracticeIntervention.indicator_scores)
            .joinedload("indicator"),
        )
    )
    practice = db.scalars(stmt).unique().first()
    return practice.serialize if practice else None

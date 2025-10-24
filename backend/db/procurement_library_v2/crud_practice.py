from sqlalchemy.orm import Session
from sqlalchemy import select, func
from typing import Optional

from models.procurement_library_v2.pl_models import (
    PLPracticeIntervention,
    PLPracticeInterventionTag,
    PLAttribute,
    PLPracticeInterventionIndicatorScore,
    PLIndicator,
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
    """Return paginated list of practices (DB query-based)."""
    offset = (page - 1) * limit

    # --- Base query ---
    stmt = (
        select(PLPracticeIntervention)
        .order_by(PLPracticeIntervention.id)
        .offset(offset)
        .limit(limit)
    )

    # --- Apply search ---
    if search:
        stmt = stmt.where(PLPracticeIntervention.label.ilike(f"%{search}%"))

    # --- Count total ---
    total = db.scalar(
        select(func.count()).select_from(PLPracticeIntervention).where(
            PLPracticeIntervention.label.ilike(f"%{search}%")
        ) if search else select(func.count()).select_from(PLPracticeIntervention)
    )

    # --- Fetch results ---
    practices = db.scalars(stmt).all()

    # --- Preload related data efficiently ---
    # Get all related IDs
    practice_ids = [p.id for p in practices]
    if not practice_ids:
        return {"current": page, "total": 0, "total_page": 0, "data": []}

    # Load all attributes (tags) for these practices
    tags = (
        db.query(PLPracticeInterventionTag)
        .join(PLAttribute)
        .filter(PLPracticeInterventionTag.practice_intervention_id.in_(practice_ids))
        .all()
    )

    # Load all indicator scores
    scores = (
        db.query(PLPracticeInterventionIndicatorScore)
        .join(PLIndicator)
        .filter(PLPracticeInterventionIndicatorScore.practice_intervention_id.in_(practice_ids))
        .all()
    )

    # --- Group related data by practice ID ---
    tag_map = {}
    for t in tags:
        tag_map.setdefault(t.practice_intervention_id, []).append(t)

    score_map = {}
    for s in scores:
        score_map.setdefault(s.practice_intervention_id, []).append(s)

    # --- Serialize ---
    data = []
    for p in practices:
        p.tags = tag_map.get(p.id, [])
        p.indicator_scores = score_map.get(p.id, [])
        data.append(p.serialize)

    return {
        "current": page,
        "total": total,
        "total_page": (total + limit - 1) // limit if total else 0,
        "data": data,
    }


# ============================================================
# GET DETAIL BY ID
# ============================================================
def get_practice_by_id(db: Session, practice_id: int) -> Optional[dict]:
    """Return single practice detail (DB query-based)."""
    # --- Main record ---
    practice = db.get(PLPracticeIntervention, practice_id)
    if not practice:
        return None

    # --- Tags + attributes ---
    tags = (
        db.query(PLPracticeInterventionTag)
        .join(PLAttribute)
        .filter(PLPracticeInterventionTag.practice_intervention_id == practice_id)
        .all()
    )

    # --- Scores + indicators ---
    scores = (
        db.query(PLPracticeInterventionIndicatorScore)
        .join(PLIndicator)
        .filter(PLPracticeInterventionIndicatorScore.practice_intervention_id == practice_id)
        .all()
    )

    practice.tags = tags
    practice.indicator_scores = scores

    return practice.serialize

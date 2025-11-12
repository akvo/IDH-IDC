from sqlalchemy.orm import Session, joinedload, aliased
from sqlalchemy import select, func, and_
from typing import Optional

from models.procurement_library_v2.pl_models import (
    PLPracticeIntervention,
    PLPracticeInterventionTag,
    PLAttribute,
    PLPracticeInterventionIndicatorScore,
    PLIndicator,
)


# ============================================================
# GET LIST OF PRACTICES WITH PAGINATION & FILTERS
# ============================================================
def get_practice_list(
    db: Session,
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None,
    impact_area: Optional[str] = None,
    sourcing_strategy_cycle: Optional[int] = None,
    procurement_principles: Optional[int] = None,
) -> dict:
    """Return paginated list of practices with optional filters by impact area and attributes."""
    offset = (page - 1) * limit

    # --- Base query ---
    stmt = select(PLPracticeIntervention).distinct()

    # --- Search filter ---
    if search:
        stmt = stmt.filter(
            PLPracticeIntervention.label.ilike(f"%{search}%")
            | PLPracticeIntervention.business_rationale.ilike(f"%{search}%")
            | PLPracticeIntervention.farmer_rationale.ilike(f"%{search}%")
            | PLPracticeIntervention.intervention_definition.ilike(f"%{search}%")
            | PLPracticeIntervention.risks_n_trade_offs.ilike(f"%{search}%")
            | PLPracticeIntervention.enabling_conditions.ilike(f"%{search}%")
        )

    # --- Impact area filter ---
    if impact_area:
        stmt = (
            stmt.join(PLPracticeInterventionIndicatorScore)
            .join(PLIndicator)
            .filter(
                and_(
                    PLIndicator.name == impact_area,
                    PLPracticeInterventionIndicatorScore.score > 3,
                )
            )
        )

    # --- Filter by sourcing_strategy_cycle attribute ---
    if sourcing_strategy_cycle:
        tag_alias_1 = aliased(PLPracticeInterventionTag)
        attr_alias_1 = aliased(PLAttribute)
        stmt = (
            stmt.join(tag_alias_1, PLPracticeIntervention.id == tag_alias_1.practice_intervention_id)
            .join(attr_alias_1, tag_alias_1.attribute_id == attr_alias_1.id)
            .filter(attr_alias_1.id == sourcing_strategy_cycle)
        )

    # --- Filter by procurement principles attribute ---
    if procurement_principles:
        tag_alias_2 = aliased(PLPracticeInterventionTag)
        attr_alias_2 = aliased(PLAttribute)
        stmt = (
            stmt.join(tag_alias_2, PLPracticeIntervention.id == tag_alias_2.practice_intervention_id)
            .join(attr_alias_2, tag_alias_2.attribute_id == attr_alias_2.id)
            .filter(attr_alias_2.id == procurement_principles)
        )

    # --- Pagination ---
    stmt = stmt.order_by(PLPracticeIntervention.id).offset(offset).limit(limit)

    # --- Count total (based on same filters) ---
    total = db.scalar(select(func.count()).select_from(stmt.subquery()))

    # --- Execute main query ---
    practices = db.scalars(stmt).unique().all()

    if not practices:
        return {"current": page, "total": 0, "total_page": 0, "data": []}

    # --- Gather related data ---
    practice_ids = [p.id for p in practices]

    # Tags
    tags = (
        db.query(PLPracticeInterventionTag)
        .join(PLAttribute)
        .filter(PLPracticeInterventionTag.practice_intervention_id.in_(practice_ids))
        .all()
    )

    # Scores
    scores = (
        db.query(PLPracticeInterventionIndicatorScore)
        .join(PLIndicator)
        .filter(PLPracticeInterventionIndicatorScore.practice_intervention_id.in_(practice_ids))
        .all()
    )

    # --- Group related data ---
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
        "total": total or len(data),
        "total_page": (total + limit - 1) // limit if total else 1,
        "data": data,
    }


# ============================================================
# GET DETAIL BY ID
# ============================================================
def get_practice_by_id(db: Session, practice_id: int) -> Optional[dict]:
    """Return single practice detail (DB query-based)."""
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

    return practice.serialize_detail


# ============================================================
# GET PRACTICES BY ATTRIBUTE ID (WITH OPTIONAL FILTERS)
# ============================================================
def get_practices_by_attribute(
    db: Session,
    attribute_id: int,
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None,
    impact_area: Optional[str] = None,
    sourcing_strategy_cycle: Optional[int] = None,
    procurement_principles: Optional[int] = None,
):
    offset = (page - 1) * limit

    # --- Base query ---
    query = (
        select(PLPracticeIntervention)
        .join(PLPracticeInterventionTag)
        .where(PLPracticeInterventionTag.attribute_id == attribute_id)
        .options(
            joinedload(PLPracticeIntervention.tags)
            .joinedload(PLPracticeInterventionTag.attribute),
            joinedload(PLPracticeIntervention.indicator_scores)
            .joinedload(PLPracticeInterventionIndicatorScore.indicator),
        )
        .distinct()
    )

    # --- Text search ---
    if search:
        query = query.filter(
            PLPracticeIntervention.label.ilike(f"%{search}%")
            | PLPracticeIntervention.business_rationale.ilike(f"%{search}%")
            | PLPracticeIntervention.farmer_rationale.ilike(f"%{search}%")
            | PLPracticeIntervention.intervention_definition.ilike(f"%{search}%")
            | PLPracticeIntervention.risks_n_trade_offs.ilike(f"%{search}%")
            | PLPracticeIntervention.enabling_conditions.ilike(f"%{search}%")
        )

    # --- Filter by impact area (indicator score > 3) ---
    if impact_area:
        query = (
            query.join(PLPracticeInterventionIndicatorScore)
            .join(PLIndicator)
            .filter(
                and_(
                    PLIndicator.name == impact_area,
                    PLPracticeInterventionIndicatorScore.score > 3,
                )
            )
        )

    # --- Filter by sourcing_strategy_cycle ---
    if sourcing_strategy_cycle:
        tag_alias_1 = aliased(PLPracticeInterventionTag)
        attr_alias_1 = aliased(PLAttribute)
        query = (
            query.join(tag_alias_1, PLPracticeIntervention.id == tag_alias_1.practice_intervention_id)
            .join(attr_alias_1, tag_alias_1.attribute_id == attr_alias_1.id)
            .filter(attr_alias_1.id == sourcing_strategy_cycle)
        )

    # --- Filter by procurement_principles ---
    if procurement_principles:
        tag_alias_2 = aliased(PLPracticeInterventionTag)
        attr_alias_2 = aliased(PLAttribute)
        query = (
            query.join(tag_alias_2, PLPracticeIntervention.id == tag_alias_2.practice_intervention_id)
            .join(attr_alias_2, tag_alias_2.attribute_id == attr_alias_2.id)
            .filter(attr_alias_2.id == procurement_principles)
        )

    # --- Count & Pagination ---
    total = db.scalar(select(func.count()).select_from(query.subquery()))
    results = db.scalars(query.offset(offset).limit(limit)).unique().all()

    # --- Build response ---
    data = []
    for p in results:
        # Tags (attribute labels)
        tags = [
            t.attribute.label for t in p.tags if t.attribute and t.attribute.label
        ]

        # Boolean flags
        scores = p.indicator_scores or []
        is_environmental = any(
            s.indicator and s.indicator.name == "environmental_impact" and (s.score or 0) > 3
            for s in scores
        )
        is_income = any(
            s.indicator and s.indicator.name == "income_impact" and (s.score or 0) > 3
            for s in scores
        )

        data.append({
            "id": p.id,
            "label": p.label,
            "is_environmental": is_environmental,
            "is_income": is_income,
            "tags": tags,
        })

    return {
        "current": page,
        "total": total,
        "total_page": (total + limit - 1) // limit if total else 0,
        "data": data,
    }

from typing import TypedDict
from typing import List
from models.procurement_library.practice import (
    PracticeListDict,
    PracticeDict,
    Practice,
)
from models.procurement_library.practice_indicator import PracticeIndicator
from models.procurement_library.practice_indicator_score import PracticeIndicatorScore
from models.procurement_library.practice import procurement_practice_tag
from sqlalchemy.orm import Session
from sqlalchemy import and_


class PaginatedPracticeData(TypedDict):
    count: int
    data: List[PracticeListDict]


def get_paginated_practices(
    session: Session,
    skip: int = 0,
    limit: int = 10,
    search: str = None,
    procurement_process_ids: List[int] = None,
    impact_area: str = None,
) -> List[PracticeListDict]:
    practices = session.query(Practice)
    if search:
        practices = practices.filter(
            Practice.label.ilike(f"%{search}%")
            | Practice.business_rationale.ilike(f"%{search}%")
            | Practice.farmer_rationale.ilike(f"%{search}%")
            | Practice.intervention_definition.ilike(f"%{search}%")
            | Practice.risks_n_trade_offs.ilike(f"%{search}%")
            | Practice.enabling_conditions.ilike(f"%{search}%")
        )
    if procurement_process_ids:
        practices = practices.join(procurement_practice_tag).filter(
            procurement_practice_tag.c.procurement_process_id.in_(
                procurement_process_ids
            )
        )
    if impact_area:
        indicator_id = (
            session.query(PracticeIndicator).filter_by(name=impact_area).first().id
        )
        practices = practices.filter(
            Practice.scores.any(
                and_(
                    PracticeIndicatorScore.indicator_id == indicator_id,
                    PracticeIndicatorScore.score > 3,
                )
            )
        )
    count = practices.count()
    practices = practices.order_by(Practice.id.asc()).offset(skip).limit(limit).all()

    data = [practice.to_list_dict for practice in practices]
    return PaginatedPracticeData(count=count, data=data)


def get_practice_by_id(session: Session, practice_id: int) -> PracticeDict:
    practice = session.get(Practice, practice_id)
    if practice is None:
        raise ValueError(f"Practice with id {practice_id} not found")
    return practice.serialize


def get_all_practices(session: Session) -> List[Practice]:
    return session.query(Practice).all()


def get_practice_score_by_indicator_id(
    session: Session, practice_id: int, indicator_id: int
) -> PracticeIndicatorScore:
    return (
        session.query(PracticeIndicatorScore)
        .filter_by(practice_id=practice_id, indicator_id=indicator_id)
        .first()
    )

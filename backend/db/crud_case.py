from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import Optional, List
from typing_extensions import TypedDict
from fastapi import HTTPException, status
from datetime import datetime

from models.user import User
from models.case import Case, CaseBase, CaseDict, CaseListDict
from models.case_commodity import CaseCommodity, CaseCommodityType
from models.case_tag import CaseTag


class PaginatedCaseData(TypedDict):
    count: int
    data: List[CaseListDict]


def add_case(session: Session, payload: CaseBase, user: User) -> CaseDict:
    current_datetime = datetime.now()
    case = Case(
        name=payload.name,
        description=payload.description,
        date=payload.date if payload.date else current_datetime.date(),
        year=payload.year if payload.year else current_datetime.year,
        country=payload.country,
        focus_commodity=payload.focus_commodity,
        currency=payload.currency,
        area_size_unit=payload.area_size_unit,
        volume_measurement_unit=payload.volume_measurement_unit,
        cost_of_production_unit=payload.cost_of_production_unit,
        reporting_period=payload.reporting_period,
        segmentation=1 if payload.segmentation else 0,
        living_income_study=payload.living_income_study,
        multiple_commodities=1 if payload.multiple_commodities else 0,
        logo=payload.logo,
        private=1 if payload.private else 0,
        created_by=user.id,
    )
    # store focus to case_commodity by default
    def_focus_commodity = CaseCommodity(
        commodity=payload.focus_commodity,
        breakdown=1,
        commodity_type=CaseCommodityType.focus.value,
        area_size_unit=payload.area_size_unit,
        volume_measurement_unit=payload.volume_measurement_unit,
    )
    case.case_commodities.append(def_focus_commodity)
    # store other commodities
    if payload.other_commodities:
        for val in payload.other_commodities:
            case_commodity = CaseCommodity(
                commodity=val.commodity,
                breakdown=1 if val.breakdown else 0,
                commodity_type=val.commodity_type.value,
                area_size_unit=val.area_size_unit,
                volume_measurement_unit=val.volume_measurement_unit,
            )
            case.case_commodities.append(case_commodity)
    # store diversified to case_commodity by default
    def_diversified_commodity = CaseCommodity(
        breakdown=1,
        commodity_type=CaseCommodityType.diversified.value,
        area_size_unit=payload.area_size_unit,
        volume_measurement_unit=payload.volume_measurement_unit,
    )
    case.case_commodities.append(def_diversified_commodity)
    # store tags
    if payload.tags:
        for tag_id in payload.tags:
            tag = CaseTag(tag=tag_id)
            case.case_tags.append(tag)
    session.add(case)
    session.commit()
    session.flush()
    session.refresh(case)
    return case


def get_all_case(
    session: Session,
    skip: int = 0,
    limit: int = 10,
    show_private: Optional[bool] = False,
    search: Optional[str] = None,
    tags: Optional[int] = None,
    focus_commodities: Optional[int] = None,
    business_unit_users: Optional[List[int]] = None,
    user_cases: Optional[List[int]] = None,
    country: Optional[int] = None,
) -> List[CaseListDict]:
    case = session.query(Case)
    if not show_private:
        case = case.filter(Case.private == 0)
    if search:
        case = case.filter(Case.name.ilike("%{}%".format(search.lower().strip())))
    if focus_commodities:
        case = case.filter(Case.focus_commodity.in_(focus_commodities))
    if tags:
        case_tags = session.query(CaseTag).filter(CaseTag.tag.in_(tags)).all()
        case_ids = [pt.case for pt in case_tags]
        case = case.filter(Case.id.in_(case_ids))
    if business_unit_users:
        case = case.filter(Case.created_by.in_(business_unit_users))
    if user_cases:
        case = case.filter(Case.id.in_(user_cases))
    if country:
        case = case.filter(Case.country == country)
    count = case.count()
    case = case.order_by(Case.id.desc()).offset(skip).limit(limit).all()
    return PaginatedCaseData(count=count, data=case)


def get_case_by_id(session: Session, id: int) -> CaseDict:
    case = session.query(Case).filter(Case.id == id).first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Case {id} not found"
        )
    return case


def update_case(session: Session, id: int, payload: CaseBase) -> CaseDict:
    case = get_case_by_id(session=session, id=id)
    case.name = payload.name
    if payload.description is not None:
        case.description = payload.description
    case.date = payload.date if payload.date else case.date
    case.year = payload.year if payload.year else case.year
    case.country = payload.country
    case.focus_commodity = payload.focus_commodity
    case.currency = payload.currency
    case.area_size_unit = payload.area_size_unit
    case.volume_measurement_unit = payload.volume_measurement_unit
    case.cost_of_production_unit = payload.cost_of_production_unit
    case.reporting_period = payload.reporting_period
    case.segmentation = 1 if payload.segmentation else 0
    case.living_income_study = payload.living_income_study
    case.multiple_commodities = 1 if payload.multiple_commodities else 0
    case.logo = payload.logo
    case.private = 1 if payload.private else 0
    # handle tag
    if payload.tags:
        prev_tags = session.query(CaseTag).filter(CaseTag.case == case.id).all()
        for ct in prev_tags:
            session.delete(ct)
            session.commit()
        # store new tags
        for tag_id in payload.tags:
            tag = CaseTag(tag=tag_id, case=case.id)
            case.case_tags.append(tag)
    # handle update focus crop in crop_commodity table
    prev_focus_commodity = (
        session.query(CaseCommodity)
        .filter(
            and_(
                CaseCommodity.case == case.id,
                CaseCommodity.commodity_type == CaseCommodityType.focus.value,
            )
        )
        .first()
    )
    if prev_focus_commodity:
        # update value
        prev_focus_commodity.commodity = payload.focus_commodity
        prev_focus_commodity.area_size_unit = (payload.area_size_unit,)
        prev_focus_commodity.volume_measurement_unit = payload.volume_measurement_unit
    # handle update other commodities
    if payload.other_commodities:
        for val in payload.other_commodities:
            breakdown = 1 if val.breakdown else 0
            prev_case_commodity = (
                session.query(CaseCommodity)
                .filter(
                    and_(
                        CaseCommodity.case == case.id,
                        CaseCommodity.commodity_type == val.commodity_type,
                    )
                )
                .first()
            )
            if prev_case_commodity:
                # update value
                prev_case_commodity.commodity = val.commodity
                prev_case_commodity.breakdown = breakdown
                prev_case_commodity.area_size_unit = (val.area_size_unit,)
                prev_case_commodity.volume_measurement_unit = (
                    val.volume_measurement_unit
                )
                session.commit()
                session.flush()
                session.refresh(prev_case_commodity)
            else:
                case_commodity = CaseCommodity(
                    commodity=val.commodity,
                    breakdown=breakdown,
                    commodity_type=val.commodity_type.value,
                    area_size_unit=val.area_size_unit,
                    volume_measurement_unit=val.volume_measurement_unit,
                )
                case.case_commodities.append(case_commodity)
    session.commit()
    session.flush()
    session.refresh(case)
    return case


def get_case_options(
    session: Session,
    business_unit_users: Optional[List[int]] = None,
    user_cases: Optional[List[int]] = None,
) -> List[CaseListDict]:
    case = session.query(Case)
    if business_unit_users:
        case = case.filter(Case.created_by.in_(business_unit_users))
    if user_cases:
        case = case.filter(Case.id.in_(user_cases))
    return case.all()


def check_case_owner(session: Session, case_id: int, user_id: int):
    case = get_case_by_id(session=session, id=case_id)
    return case.created_by == user_id


def get_case_by_created_by(session: Session, created_by: int):
    case = session.query(Case).filter(Case.created_by == created_by).all()
    return case


def update_case_owner(session: Session, case_id: int, user_id: int) -> CaseDict:
    case = get_case_by_id(session=session, id=case_id)
    case.created_by = user_id
    session.commit()
    session.flush()
    session.refresh(case)
    return case

from sqlalchemy.orm import Session
from sqlalchemy import and_, cast
from sqlalchemy.dialects.postgresql import TEXT
from typing import Optional, List
from typing_extensions import TypedDict
from fastapi import HTTPException, status
from datetime import datetime

from models.user import User
from models.case import Case, CaseBase, CaseDict, CaseListDict
from models.case_commodity import CaseCommodity, CaseCommodityType
from models.case_tag import CaseTag
from models.user_case_access import UserCaseAccess
from models.visualization import Visualization
from models.segment import Segment
from models.segment_answer import SegmentAnswer


class PaginatedCaseData(TypedDict):
    count: int
    data: List[CaseListDict]


def add_case(session: Session, payload: CaseBase, user: User) -> CaseDict:
    reporting_period = payload.reporting_period
    reporting_period = reporting_period if reporting_period else "per-year"
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
        reporting_period=reporting_period,
        segmentation=1 if payload.segmentation else 0,
        living_income_study=payload.living_income_study,
        multiple_commodities=1 if payload.multiple_commodities else 0,
        logo=payload.logo,
        private=1 if payload.private else 0,
        created_by=user.id,
        updated_by=user.id,
        company=payload.company,
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
    # store segments
    if payload.segments:
        for segment in payload.segments:
            new_segment = Segment(
                name=segment.name, number_of_farmers=segment.number_of_farmers
            )
            case.case_segments.append(new_segment)
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
    email: Optional[str] = None,
    year: Optional[int] = None,
) -> List[CaseListDict]:
    case = session.query(Case)
    if not show_private:
        case = case.filter(Case.private == 0)
    if search:
        case = case.filter(
            Case.name.ilike("%{}%".format(search.lower().strip()))
        )
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
    if email:
        users = (
            session.query(User)
            .filter(User.email.ilike("%{}%".format(email.lower().strip())))
            .all()
        )
        user_ids = [u.id for u in users]
        case = case.filter(Case.created_by.in_(user_ids))
    if year:
        case = case.filter(
            cast(Case.year, TEXT).ilike("%{}%".format(f"{year}".strip()))
        )
    count = case.count()
    case = case.order_by(Case.id.desc()).offset(skip).limit(limit).all()
    return PaginatedCaseData(count=count, data=case)


def get_case_by_id(session: Session, id: int) -> CaseDict:
    case = session.query(Case).filter(Case.id == id).first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case {id} not found",
        )
    return case


def case_updated_by(session: Session, case_id: int, user_id: int) -> CaseDict:
    case = get_case_by_id(session=session, id=case_id)
    case.updated_by = user_id
    case.updated_at = datetime.now()
    session.commit()
    session.flush()
    session.refresh(case)
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
    case.segmentation = 1 if payload.segmentation else 0
    case.living_income_study = payload.living_income_study
    case.multiple_commodities = 1 if payload.multiple_commodities else 0
    case.logo = payload.logo
    case.private = 1 if payload.private else 0
    case.company = payload.company
    # don't update updated_at value
    case.updated_at = case.updated_at
    # reporting period
    if payload.reporting_period:
        case.reporting_period = payload.reporting_period
    # handle tag
    if payload.tags:
        prev_tags = (
            session.query(CaseTag).filter(CaseTag.case == case.id).all()
        )
        for ct in prev_tags:
            session.delete(ct)
            session.commit()
            session.flush()
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
        prev_focus_commodity.volume_measurement_unit = (
            payload.volume_measurement_unit
        )
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
    # handle update segments
    if payload.segments:
        for segment in payload.segments:
            prev_segment = (
                session.query(Segment)
                .filter(
                    and_(
                        Segment.case == case.id,
                        Segment.id == segment.id,
                    )
                )
                .first()
            )
            if prev_segment:
                # update prev segment
                prev_segment.name = segment.name
                prev_segment.number_of_farmers = segment.number_of_farmers
                session.commit()
                session.flush()
                session.refresh(prev_segment)
            else:
                new_segment = Segment(
                    name=segment.name,
                    number_of_farmers=segment.number_of_farmers,
                )
                case.case_segments.append(new_segment)
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


def get_case_by_updated_by(session: Session, updated_by: int):
    case = session.query(Case).filter(Case.updated_by == updated_by).all()
    return case


def update_case_owner(
    session: Session, case_id: int, user_id: int
) -> CaseDict:
    case = get_case_by_id(session=session, id=case_id)
    case.created_by = user_id
    session.commit()
    session.flush()
    session.refresh(case)
    return case


def get_case_by_private(session: Session, private: Optional[bool] = False):
    private_param = 1 if private else 0
    return session.query(Case).filter(Case.private == private_param).all()


def delete_case(session: Session, case_id: int):
    case = get_case_by_id(session=session, id=case_id)

    # segment and segment answer
    segment = session.query(Segment).filter(Segment.case == case_id).all()
    segment_answer = (
        session.query(SegmentAnswer)
        .filter(SegmentAnswer.segment.in_([s.id for s in segment]))
        .all()
    )
    for sa in segment_answer:
        session.delete(sa)
        session.commit()
        session.flush()
    for s in segment:
        session.delete(s)
        session.commit()
        session.flush()

    # visualization
    visualization = (
        session.query(Visualization)
        .filter(Visualization.case == case_id)
        .all()
    )
    for vis in visualization:
        session.delete(vis)
        session.commit()
        session.flush()

    # case_commodity
    case_commodity = (
        session.query(CaseCommodity)
        .filter(CaseCommodity.case == case_id)
        .all()
    )
    for cc in case_commodity:
        session.delete(cc)
        session.commit()
        session.flush()

    # case tag
    case_tag = session.query(CaseTag).filter(CaseTag.case == case_id).all()
    for ct in case_tag:
        session.delete(ct)
        session.commit()
        session.flush()

    # user case
    user_case_access = (
        session.query(UserCaseAccess)
        .filter(UserCaseAccess.case == case_id)
        .all()
    )
    for uca in user_case_access:
        session.delete(uca)
        session.commit()
        session.flush()

    session.delete(case)
    session.commit()
    session.flush()

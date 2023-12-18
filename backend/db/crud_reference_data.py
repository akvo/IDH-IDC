from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional, List
from typing_extensions import TypedDict
from fastapi import HTTPException, status

from models.user import User
from models.reference_data import (
    ReferenceData,
    ReferenceDataList,
    Driver,
    ReferenceDataBase,
    ReferenceDataDict,
)


class PaginatedReferenceData(TypedDict):
    count: int
    data: List[ReferenceDataList]


def get_all_reference(
    session: Session,
    country: Optional[int] = None,
    commodity: Optional[int] = None,
    source: Optional[str] = None,
    driver: Optional[Driver] = None,
    skip: int = 0,
    limit: int = 10,
) -> List[ReferenceDataList]:
    data = session.query(ReferenceData)
    if country:
        data = data.filter(ReferenceData.country == country)
    if commodity:
        data = data.filter(ReferenceData.commodity == commodity)
    if source:
        data = data.filter(
            ReferenceData.name.ilike("%{}%".format(source.lower().strip()))
        )
    if driver == Driver.area:
        data = data.filter(ReferenceData.area.is_not(None))
    if driver == Driver.price:
        data = data.filter(ReferenceData.price.is_not(None))
    if driver == Driver.volume:
        data = data.filter(ReferenceData.volume.is_not(None))
    if driver == Driver.cost_of_production:
        data = data.filter(ReferenceData.cost_of_production.is_not(None))
    if driver == Driver.diversified_income:
        data = data.filter(ReferenceData.diversified_income.is_not(None))
    count = data.count()
    data = (
        data.order_by(ReferenceData.id.desc()).offset(skip).limit(limit).all()
    )
    return PaginatedReferenceData(count=count, data=data)


def get_reference_value(
    session: Session,
    country: int,
    commodity: int,
    driver: Driver,
) -> List[ReferenceDataList]:
    data = session.query(ReferenceData)
    data = data.filter(ReferenceData.country == country)
    data = data.filter(ReferenceData.commodity == commodity)
    if driver == Driver.area:
        data = data.filter(ReferenceData.area.is_not(None))
    if driver == Driver.price:
        data = data.filter(ReferenceData.price.is_not(None))
    if driver == Driver.volume:
        data = data.filter(ReferenceData.volume.is_not(None))
    if driver == Driver.cost_of_production:
        data = data.filter(ReferenceData.cost_of_production.is_not(None))
    if driver == Driver.diversified_income:
        data = data.filter(ReferenceData.diversified_income.is_not(None))
    data = data.order_by(ReferenceData.id.desc()).all()
    return data


def add_reference(
    session: Session, payload: ReferenceDataBase, user: Optional[User] = None
) -> ReferenceDataDict:
    last_reference = (
        session.query(ReferenceData).order_by(desc(ReferenceData.id)).first()
    )
    data = ReferenceData(
        id=last_reference.id + 1 if last_reference else None,
        country=payload.country,
        commodity=payload.commodity,
        region=payload.region,
        currency=payload.currency,
        year=payload.year,
        source=payload.source,
        link=payload.link,
        notes=payload.notes,
        confidence_level=payload.confidence_level,
        range=payload.range,
        type=payload.type,
        area=payload.area,
        volume=payload.volume,
        price=payload.price,
        cost_of_production=payload.cost_of_production,
        diversified_income=payload.diversified_income,
        area_size_unit=payload.area_size_unit,
        volume_measurement_unit=payload.volume_measurement_unit,
        cost_of_production_unit=payload.cost_of_production_unit,
        diversified_income_unit=payload.diversified_income_unit,
        created_by=user.id if user else None,
    )
    session.add(data)
    session.commit()
    session.flush()
    session.refresh(data)
    return data


def get_reference_by_id(session: Session, id: int) -> ReferenceDataDict:
    data = session.query(ReferenceData).filter(ReferenceData.id == id).first()
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reference Data {id} not found",
        )
    return data


def update_reference(
    session: Session, id: int, payload: ReferenceDataBase
) -> ReferenceDataDict:
    data = get_reference_by_id(session=session, id=id)

    data.country = payload.country
    data.commodity = payload.commodity
    data.region = payload.region
    data.currency = payload.currency
    data.year = payload.year
    data.source = payload.source
    data.link = payload.link
    data.notes = payload.notes
    data.confidence_level = payload.confidence_level
    data.range = payload.range
    data.type = payload.type
    data.area = payload.area
    data.volume = payload.volume
    data.price = payload.price
    data.cost_of_production = payload.cost_of_production
    data.diversified_income = payload.diversified_income
    data.area_size_unit = payload.area_size_unit
    data.volume_measurement_unit = payload.volume_measurement_unit
    data.cost_of_production_unit = payload.cost_of_production_unit
    data.diversified_income_unit = payload.diversified_income_unit

    session.commit()
    session.flush()
    session.refresh(data)
    return data


def delete_reference(session: Session, id: int):
    data = get_reference_by_id(session=session, id=id)
    session.delete(data)
    session.commit()
    session.flush()

from sqlalchemy.orm import Session
from sqlalchemy import desc, func
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
from models.country import Country


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
            ReferenceData.source.ilike("%{}%".format(source.lower().strip()))
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


def count_reference_data_by_country(
    session: Session,
    country: Optional[int] = None,
    commodity: Optional[int] = None,
    source: Optional[str] = None,
    driver: Optional[Driver] = None,
) -> List[dict]:
    data = session.query(
        ReferenceData.country.label("country_id"),
        Country.name.label("country_name"),
        func.count(ReferenceData.id).label("count"),
    )

    if country:
        data = data.filter(ReferenceData.country == country)
    if commodity:
        data = data.filter(ReferenceData.commodity == commodity)
    if source:
        data = data.filter(
            ReferenceData.source.ilike("%{}%".format(source.lower().strip()))
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

    data = data.join(Country, ReferenceData.country == Country.id).group_by(
        ReferenceData.country, Country.name
    )

    return [
        {
            "country_id": row.country_id,
            "COUNTRY": row.country_name,
            "count": row.count,
        }
        for row in data.all()
    ]


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
        area=payload.area,
        volume=payload.volume,
        price=payload.price,
        cost_of_production=payload.cost_of_production,
        diversified_income=payload.diversified_income,
        area_size_unit=payload.area_size_unit,
        volume_measurement_unit=payload.volume_measurement_unit,
        cost_of_production_unit=payload.cost_of_production_unit,
        diversified_income_unit=payload.diversified_income_unit,
        price_unit=payload.price_unit,
        created_by=user.id if user else None,
        type_area=payload.type_area,
        type_volume=payload.type_volume,
        type_price=payload.type_price,
        type_cost_of_production=payload.type_cost_of_production,
        type_diversified_income=payload.type_diversified_income,
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
    data.area = payload.area
    data.volume = payload.volume
    data.price = payload.price
    data.cost_of_production = payload.cost_of_production
    data.diversified_income = payload.diversified_income
    data.area_size_unit = payload.area_size_unit
    data.volume_measurement_unit = payload.volume_measurement_unit
    data.cost_of_production_unit = payload.cost_of_production_unit
    data.diversified_income_unit = payload.diversified_income_unit
    data.price_unit = payload.price_unit
    data.type_area = payload.type_area
    data.type_volume = payload.type_volume
    data.type_price = payload.type_price
    data.type_cost_of_production = payload.type_cost_of_production
    data.type_diversified_income = payload.type_diversified_income

    session.commit()
    session.flush()
    session.refresh(data)
    return data


def delete_reference(session: Session, id: int):
    data = get_reference_by_id(session=session, id=id)
    session.delete(data)
    session.commit()
    session.flush()


def get_reference_by_created_by(session: Session, created_by: int):
    return (
        session.query(ReferenceData)
        .filter(ReferenceData.created_by == created_by)
        .all()
    )

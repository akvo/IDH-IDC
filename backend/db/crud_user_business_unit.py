from typing import List
from sqlalchemy.orm import Session
from models.user_business_unit import UserBusinessUnit, UserBusinessUnitDict


def find_users_in_same_business_unit(
    session: Session, business_units: List[int]
) -> List[UserBusinessUnitDict]:
    res = (
        session.query(UserBusinessUnit)
        .filter(UserBusinessUnit.business_unit.in_(business_units))
        .all()
    )
    res = [val.user for val in res]
    return res


def find_user_business_units(
    session: Session, user_id: int
) -> List[UserBusinessUnit]:
    res = (
        session.query(UserBusinessUnit)
        .filter(UserBusinessUnit.user == user_id)
        .all()
    )
    return res


def delete_user_business_units_by_user_id(session: Session, user_id: int):
    user_bus = find_user_business_units(session=session, user_id=user_id)
    for bu in user_bus:
        session.delete(bu)
        session.commit()
        session.flush()


def get_all_business_unit_users(session: Session):
    return session.query(UserBusinessUnit).all()

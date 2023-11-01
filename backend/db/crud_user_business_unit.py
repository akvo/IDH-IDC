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

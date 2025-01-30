from sqlalchemy import func
from typing import List, Optional
from sqlalchemy.orm import Session

from models.case import Case
from models.segment import Segment
from models.country import Country


def get_case_count_by_country(
    session: Session,
    show_private: Optional[bool] = False,
    user_cases: Optional[List[int]] = None,
) -> List[dict]:
    case_query = session.query(Case)

    if not show_private:
        case_query = case_query.filter(Case.private == 0)

    if user_cases:
        case_query = case_query.filter(Case.id.in_(user_cases))

    # Join with Segment and Country tables
    # and aggregate cases and number_of_farmers by country
    case_count_and_farmers_by_country = (
        case_query.join(Segment, Case.id == Segment.case)
        .join(Country, Case.country == Country.id)
        .with_entities(
            Case.country,
            Country.name.label("country_name"),
            func.count(Case.id).label("case_count"),
            func.sum(Segment.number_of_farmers).label("total_farmers"),
        )
        .group_by(Case.country, Country.name)
        .having(
            func.count(Case.id) > 0
        )  # Filter to include only non-zero case counts
        .all()
    )

    response = [
        {
            "country_id": country_id,
            "COUNTRY": country_name,
            "case_count": case_count,
            "total_farmers": total_farmers or 0,
        }
        for (
            country_id,
            country_name,
            case_count,
            total_farmers,
        ) in case_count_and_farmers_by_country
    ]
    return response

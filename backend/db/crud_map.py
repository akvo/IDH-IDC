from sqlalchemy import func
from typing import List, Optional
from sqlalchemy.orm import Session

from models.case import Case
from models.segment import Segment
from models.country import Country
from models.company import Company


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


def get_case_count_by_country_and_company(
    session: Session,
    show_private: Optional[bool] = False,
    user_cases: Optional[List[int]] = None,
    company: Optional[int] = None,
) -> List[dict]:
    case_query = session.query(Case)

    if not show_private:
        case_query = case_query.filter(Case.private == 0)

    if user_cases:
        case_query = case_query.filter(Case.id.in_(user_cases))

    if company:
        case_query = case_query.filter(Case.company == company)

    # Use LEFT JOIN to include cases without a company
    case_count_and_farmers_by_country_and_company = (
        case_query.join(Segment, Case.id == Segment.case)
        .join(Country, Case.country == Country.id)
        .outerjoin(
            Company, Case.company == Company.id
        )  # Use outerjoin to include cases with no company
        .with_entities(
            Case.country,
            Country.name.label("country_name"),
            Company.id.label("company_id"),
            Company.name.label("company_name"),
            func.count(Case.id).label("case_count"),
            func.sum(Segment.number_of_farmers).label("total_farmers"),
        )
        .group_by(Case.country, Country.name, Company.id, Company.name)
        .having(
            func.count(Case.id) > 0
        )  # Filter to include only non-zero case counts
        .all()
    )

    response = [
        {
            "country_id": country_id,
            "COUNTRY": country_name,
            "company_id": company_id or None,
            "company": company_name if company_name else None,
            "case_count": case_count,
            "total_farmers": total_farmers or 0,
        }
        for (
            country_id,
            country_name,
            company_id,
            company_name,
            case_count,
            total_farmers,
        ) in case_count_and_farmers_by_country_and_company
    ]

    return response

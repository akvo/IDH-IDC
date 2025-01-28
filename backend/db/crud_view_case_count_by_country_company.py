from sqlalchemy.orm import Session
from sqlalchemy import func
from models.view_case_count_by_country_company import (
    CaseCountByCompanyAndCountry,
)


def get_case_count_by_country(session: Session):
    results = (
        session.query(
            CaseCountByCompanyAndCountry.country_id,
            CaseCountByCompanyAndCountry.country,
            func.sum(CaseCountByCompanyAndCountry.case_count).label(
                "case_count"
            ),
            func.sum(CaseCountByCompanyAndCountry.total_farmers).label(
                "total_farmers"
            ),
        )
        .group_by(
            CaseCountByCompanyAndCountry.country_id,
            CaseCountByCompanyAndCountry.country,
        )
        .having(func.sum(CaseCountByCompanyAndCountry.case_count) != 0)
        .all()
    )
    if not results:
        return []
    return [
        {
            "country_id": result.country_id,
            "COUNTRY": result.country,
            "case_count": result.case_count,
            "total_farmers": result.total_farmers,
        }
        for result in results
    ]

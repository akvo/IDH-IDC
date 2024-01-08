from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import and_
from models.living_income_benchmark import (
    LivingIncomeBenchmark,
    LivingIncomeBenchmarkDict,
)
from models.cpi import Cpi


def get_all_lib(session: Session) -> List[LivingIncomeBenchmarkDict]:
    return session.query(LivingIncomeBenchmark).all()


def get_by_country_region_year(
    session: Session, country: int, region: int, year: int
) -> LivingIncomeBenchmarkDict:
    lib = (
        session.query(LivingIncomeBenchmark)
        .filter(
            and_(
                LivingIncomeBenchmark.country == country,
                LivingIncomeBenchmark.region == region,
                LivingIncomeBenchmark.year == year,
            )
        )
        .first()
    )
    if not lib:
        # get LI benchmark from lastest year
        lib = (
            session.query(LivingIncomeBenchmark)
            .filter(
                and_(
                    LivingIncomeBenchmark.country == country,
                    LivingIncomeBenchmark.region == region,
                )
            )
            .order_by(LivingIncomeBenchmark.year.desc())
            .first()
        )
        if not lib:
            return None
        # get CPI by country
        cpi = session.query(Cpi).filter(
            Cpi.country == country,
        )
        # get CPI by case year
        case_year_cpi = cpi.filter(
            Cpi.year == year,
        ).first()
        # get CPI from lastest year
        last_year_cpi = cpi.order_by(Cpi.year.desc()).first()
        # add CPI value
        if case_year_cpi:
            # Calculate CPI factor
            # CPI Factor logic
            case_year_cpi_value = case_year_cpi.value if case_year_cpi else 0
            last_year_cpi_value = last_year_cpi.value if last_year_cpi else 0
            # (Latest  Year CPI - Case year CPI)/(Case Year CPI) = CPI factor
            cpi_factor = (
                last_year_cpi_value - case_year_cpi_value
            ) / case_year_cpi_value
            #
            lib = lib.serialize
            lib["case_year_cpi"] = case_year_cpi_value
            lib["last_year_cpi"] = last_year_cpi_value
            lib["cpi_factor"] = cpi_factor
            return lib
    else:
        lib = lib.serialize
        lib["case_year_cpi"] = None
        lib["last_year_cpi"] = None
        lib["cpi_factor"] = None
        return lib
    return None

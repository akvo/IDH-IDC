from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, distinct
from models.living_income_benchmark import (
    LivingIncomeBenchmark,
    LivingIncomeBenchmarkDict,
)
from models.cpi import Cpi
from models.country import Country
from models.conversion_rate import ConversionRate, CurrencyEnum

# from fastapi import HTTPException, status


def get_conversion_rate(session: Session, country: int, year: int):
    # query conversion rate by country and year
    conversion_rate = session.query(ConversionRate).filter(
        and_(ConversionRate.country == country, ConversionRate.year == year)
    )
    usd = conversion_rate.filter(
        ConversionRate.currency == CurrencyEnum.USD
    ).first()
    eur = conversion_rate.filter(
        ConversionRate.currency == CurrencyEnum.EUR
    ).first()

    usd_rate = usd.value if usd else 0
    eur_rate = eur.value if eur else 0
    # EOL query conversion rate by country and year
    return usd_rate, eur_rate


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

    # get CPI by country
    cpi = session.query(Cpi).filter(
        Cpi.country == country,
    )
    # get CPI from lastest year
    last_year_cpi = (
        cpi.filter(Cpi.value != 0).order_by(Cpi.year.desc()).first()
    )
    # get CPI by case year
    case_year_cpi = cpi.filter(
        Cpi.year == year,
    ).first()

    # Calculate CPI factor
    # CPI Factor logic
    case_year_cpi_value = case_year_cpi.value if case_year_cpi else 0
    last_year_cpi_value = last_year_cpi.value if last_year_cpi else 0
    # Inflation rate formula
    # (Case year CPI - Latest  Year CPI)/Latest  Year CPI = CPI factor
    cpi_factor = None
    if case_year_cpi_value and last_year_cpi_value:
        cpi_factor = (
            case_year_cpi_value - last_year_cpi_value
        ) / last_year_cpi_value

    if not lib:
        # get LI benchmark from latest year
        lib = (
            session.query(LivingIncomeBenchmark)
            .filter(
                and_(
                    LivingIncomeBenchmark.country == country,
                    LivingIncomeBenchmark.region == region,
                    LivingIncomeBenchmark.year != 0,
                )
            )
            .order_by(LivingIncomeBenchmark.year.desc())
            .first()
        )
        if not lib:
            return None

        usd_rate, eur_rate = get_conversion_rate(
            session=session, country=country, year=lib.year
        )
        usd_value = lib.lcu / usd_rate if usd_rate else 0
        eur_value = lib.lcu / eur_rate if eur_rate else 0

        # add CPI value
        # INFLATION RATE HERE
        if case_year_cpi_value and last_year_cpi_value:
            lib = lib.serialize
            lib["value"]["usd"] = usd_value
            lib["value"]["eur"] = eur_value
            lib["case_year_cpi"] = case_year_cpi_value
            lib["last_year_cpi"] = last_year_cpi_value
            lib["cpi_factor"] = cpi_factor or None
            lib["message"] = None
            return lib
        else:
            lib = lib.serialize
            lib["value"]["usd"] = usd_value
            lib["value"]["eur"] = eur_value
            lib["case_year_cpi"] = case_year_cpi_value or None
            lib["last_year_cpi"] = last_year_cpi_value or None
            lib["cpi_factor"] = None
            lib["message"] = (
                f"This is the benchmark value for {lib['year']}, which is the "
                "most recent available. If you wish to adjust it for "
                "inflation and update the value manually, you can use the "
                "'Set the target yourself' option."
            )
            return lib
            # raise HTTPException(
            #     status_code=status.HTTP_404_NOT_FOUND,
            #     detail=f"Benchmark not available for the year {year}.",
            # )
    else:
        usd_rate, eur_rate = get_conversion_rate(
            session=session, country=country, year=year
        )
        usd_value = lib.lcu / usd_rate if usd_rate else 0
        eur_value = lib.lcu / eur_rate if eur_rate else 0

        lib = lib.serialize
        lib["value"]["usd"] = usd_value
        lib["value"]["eur"] = eur_value
        lib["case_year_cpi"] = case_year_cpi_value or None
        lib["last_year_cpi"] = last_year_cpi_value or None
        lib["cpi_factor"] = 0
        lib["message"] = None
        return lib


def count_lib_by_country(session: Session):
    res = (
        session.query(
            Country.id,
            Country.name,
            func.count(distinct(LivingIncomeBenchmark.region)).label("count"),
        )
        .outerjoin(
            LivingIncomeBenchmark, Country.id == LivingIncomeBenchmark.country
        )
        .group_by(Country.id)
        .having(func.count(distinct(LivingIncomeBenchmark.region)) > 0)
        .all()
    )
    return res

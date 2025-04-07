import os
import sys
import pandas as pd
from db.connection import Base, engine, SessionLocal

from utils.truncator import truncatedb
from sqlalchemy.orm import Session
from models.living_income_benchmark import LivingIncomeBenchmark
from models.cpi import Cpi
from models.conversion_rate import ConversionRate

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MASTER_DIR = BASE_DIR + "/source/master/"
sys.path.append(BASE_DIR)


def seeder_benchmark(session: Session):
    # conversion rate
    truncatedb(session=session, table="conversion_rate")
    conversion_rate = pd.read_csv(MASTER_DIR + "conversion_rate.csv")
    # Filter rows where the list does not contain any string values
    filtered_cr = conversion_rate[
        conversion_rate["country_id"] != conversion_rate["country"]
    ]
    filtered_cr.drop(columns=["country"], inplace=True)
    filtered_cr = filtered_cr.rename(
        columns={
            "country_id": "country",
        }
    )
    filtered_cr = filtered_cr.dropna(subset=["value"])
    filtered_cr = filtered_cr.fillna(0)
    for index, row in filtered_cr.iterrows():
        # find prev cpi
        cr = (
            session.query(ConversionRate)
            .filter(ConversionRate.id == row["id"])
            .first()
        )
        if cr:
            # update
            cr.country = row["country"]
            cr.year = row["year"]
            cr.value = row["value"]
            cr.currency = row["currency"]
        else:
            # create
            cr = ConversionRate(
                id=row["id"],
                country=row["country"],
                year=row["year"],
                value=row["value"],
                currency=row["currency"],
            )
            session.add(cr)
        session.commit()
        session.flush()
        session.refresh(cr)
    print("[DATABASE UPDATED]: Conversion Rate")

    # living income benchmark
    truncatedb(session=session, table="living_income_benchmark")
    li_benchmark = pd.read_csv(MASTER_DIR + "li_benchmark.csv")
    # Filter rows where the list does not contain any string values
    filtered_lib = li_benchmark[
        li_benchmark["country_id"] != li_benchmark["country"]
    ]
    filtered_lib.drop(columns=["country", "region"], inplace=True)
    filtered_lib = filtered_lib.rename(
        columns={
            "LCU": "lcu",
            "USD": "usd",
            "EUR": "eur",
            "country_id": "country",
            "region_id": "region",
        }
    )
    filtered_lib = filtered_lib.fillna(0)
    for index, row in filtered_lib.iterrows():
        # find prev lib
        lib = (
            session.query(LivingIncomeBenchmark)
            .filter(LivingIncomeBenchmark.id == row["id"])
            .first()
        )
        if lib:
            # update
            lib.country = row["country"]
            lib.region = row["region"]
            lib.household_size = row["household_size"]
            lib.year = row["year"]
            lib.source = row["source"]
            lib.lcu = row["lcu"]
            lib.usd = row["usd"]
            lib.eur = row["eur"]
            lib.nr_adults = (row["nr_adults"],)
            lib.household_equiv = (row["household_equiv"],)
            lib.links = (row["links"],)
        else:
            # create
            lib = LivingIncomeBenchmark(
                id=row["id"],
                country=row["country"],
                region=row["region"],
                household_size=row["household_size"],
                year=row["year"],
                source=row["source"],
                lcu=row["lcu"],
                usd=row["usd"],
                eur=row["eur"],
                nr_adults=row["nr_adults"],
                household_equiv=row["household_equiv"],
                links=row["links"],
            )
            session.add(lib)
        session.commit()
        session.flush()
        session.refresh(lib)
    print("[DATABASE UPDATED]: Living Income Benchmark")

    # CPI
    truncatedb(session=session, table="cpi")
    cpi = pd.read_csv(MASTER_DIR + "cpi.csv")
    # Filter rows where the list does not contain any string values
    filtered_cpi = cpi[cpi["country_id"] != cpi["country"]]
    filtered_cpi.drop(columns=["country"], inplace=True)
    filtered_cpi = filtered_cpi.rename(
        columns={
            "country_id": "country",
        }
    )
    filtered_cpi = filtered_cpi.dropna(subset=["value"])
    filtered_cpi = filtered_cpi.fillna(0)
    for index, row in filtered_cpi.iterrows():
        # find prev cpi
        cpi = session.query(Cpi).filter(Cpi.id == row["id"]).first()
        if cpi:
            # update
            cpi.country = row["country"]
            cpi.year = row["year"]
            cpi.value = row["value"]
        else:
            # create
            cpi = Cpi(
                id=row["id"],
                country=row["country"],
                year=row["year"],
                value=row["value"],
            )
            session.add(cpi)
        session.commit()
        session.flush()
        session.refresh(cpi)
    print("[DATABASE UPDATED]: CPI")
    session.close()


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    seeder_benchmark(session=session)

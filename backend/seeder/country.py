import os
import sys
import pandas as pd
from core.config import generate_config_file
from db.connection import Base, engine, SessionLocal
from utils.truncator import truncatedb
from sqlalchemy.orm import Session
from models.country import Country
from models.currency import Currency

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MASTER_DIR = BASE_DIR + "/source/master/"
sys.path.append(BASE_DIR)


def seeder_country(session: Session):
    ## Country and Currency
    truncatedb(session=session, table="country")
    truncatedb(session=session, table="currency")

    data = pd.read_csv(MASTER_DIR + "countries.csv")

    countries = data[["id", "country"]].rename(columns={"country": "name"})
    countries["parent"] = None
    for index, row in countries.iterrows():
        country = Country(id=row["id"], parent=row["parent"], name=row["name"])
        session.add(country)
        session.commit()
        session.flush()
        session.refresh(country)
    print("[DATABASE UPDATED]: Country")

    currencies = data[["id", "currency", "abbreviation"]].rename(
        columns={"currency": "name"}
    )
    currencies["country"] = data["id"]
    for index, row in currencies.iterrows():
        currency = Currency(
            id=row["id"],
            country=row["country"],
            name=row["name"],
            abbreviation=row["abbreviation"],
        )
        session.add(currency)
        session.commit()
        session.flush()
        session.refresh(currency)
    print("[DATABASE UPDATED]: Currency")
    session.close()

    generate_config_file()


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    seeder_country(session=session)

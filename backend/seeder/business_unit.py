import os
import sys
import pandas as pd
from core.config import generate_config_file
from db.connection import Base, engine, SessionLocal
from utils.truncator import truncatedb
from sqlalchemy.orm import Session
from models.business_unit import BusinessUnit

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MASTER_DIR = BASE_DIR + "/source/master/"
sys.path.append(BASE_DIR)


def seeder_business_unit(session: Session):
    ## Bussiness Unit
    truncatedb(session=session, table="business_unit")
    business_unit = pd.read_csv(MASTER_DIR + "business_unit.csv")
    business_unit = business_unit[["id", "name"]]
    for index, row in business_unit.iterrows():
        bu = BusinessUnit(id=row["id"], name=row["name"])
        session.add(bu)
        session.commit()
        session.flush()
        session.refresh(bu)
    print("[DATABASE UPDATED]: Business Unit")
    session.close()

    generate_config_file()


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    seeder_business_unit(session=session)

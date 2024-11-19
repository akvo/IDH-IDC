import os
import sys
import pandas as pd
from core.config import generate_config_file
from db.connection import Base, engine, SessionLocal

# from utils.truncator import truncatedb
from sqlalchemy.orm import Session
from models.organisation import Organisation

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MASTER_DIR = BASE_DIR + "/source/master/"
sys.path.append(BASE_DIR)


def seeder_organisation(session: Session):
    # organization
    # truncatedb(session=session, table="organisation")
    organisation = pd.read_csv(MASTER_DIR + "organisation.csv")
    organisation = organisation[["id", "name"]]
    for index, row in organisation.iterrows():
        # find prev org
        org = (
            session.query(Organisation)
            .filter(Organisation.id == row["id"])
            .first()
        )
        if org:
            # update
            org.name = row["name"]
        else:
            # create
            org = Organisation(id=row["id"], name=row["name"])
            session.add(org)
        session.commit()
        session.flush()
        session.refresh(org)
    print("[DATABASE UPDATED]: Organisation")
    session.close()

    generate_config_file()


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    seeder_organisation(session=session)

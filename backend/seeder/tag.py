import os
import sys
import pandas as pd
from core.config import generate_config_file
from db.connection import Base, engine, SessionLocal

# from utils.truncator import truncatedb
from sqlalchemy.orm import Session
from models.tag import Tag

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MASTER_DIR = BASE_DIR + "/source/master/"
sys.path.append(BASE_DIR)


def seeder_tag(session: Session):
    # tag
    # truncatedb(session=session, table="tag")

    tags = pd.read_csv(MASTER_DIR + "tags.csv")
    tags = tags[["id", "name", "description"]]
    for index, row in tags.iterrows():
        # find prev tag
        tag = session.query(Tag).filter(Tag.id == row["id"]).first()
        if tag:
            # update
            tag.name = row["name"]
            tag.description = row["description"]
        else:
            # create
            tag = Tag(id=row["id"], name=row["name"], description=row["description"])
            session.add(tag)
        session.commit()
        session.flush()
        session.refresh(tag)
    print("[DATABASE UPDATED]: Tag")
    session.close()

    generate_config_file()


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    seeder_tag(session=session)

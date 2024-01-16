import os
import sys
import pandas as pd
from db.connection import Base, engine, SessionLocal
from utils.truncator import truncatedb
from sqlalchemy.orm import Session
from models.region import Region
from models.country_region import CountryRegion

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MASTER_DIR = BASE_DIR + "/source/master/"
sys.path.append(BASE_DIR)


def seeder_region(session: Session):
    # region
    # truncatedb(session=session, table="region")
    regions = pd.read_csv(MASTER_DIR + "regions.csv")
    regions = regions.rename(columns={"region": "name"})
    regions = regions.drop(columns=["country_id", "country"])
    for index, row in regions.iterrows():
        # find prev region
        region = session.query(Region).filter(Region.id == row["id"]).first()
        if region:
            # update
            region.name = row["name"]
        else:
            # create
            region = Region(id=row["id"], name=row["name"])
            session.add(region)
        session.commit()
        session.flush()
        session.refresh(region)
    print("[DATABASE UPDATED]: Region")

    # country region
    # Filter rows where the list does not contain any string values
    truncatedb(session=session, table="country_region")
    regions = pd.read_csv(MASTER_DIR + "regions.csv")
    country_regions = []
    for index, row in regions.iterrows():
        region_id = row["id"]
        country_ids = row["country_id"].replace("[", "").replace("]", "").split(", ")
        country = row["country"].replace("[", "").replace("]", "").split(", ")
        intersect = list(set(country_ids) & set(country))
        if intersect:
            for val in intersect:
                country_ids.remove(val)
        country_ids_tmp = []
        for val in country_ids:
            try:
                int(val)
                country_ids_tmp.append(val)
            except Exception:
                continue
        for country in country_ids_tmp:
            res = pd.DataFrame(
                {
                    "country": country,
                    "region": region_id,
                },
                index=[index],
            )
            country_regions.append(res)
    country_regions = pd.concat(country_regions, ignore_index=True)
    country_regions["id"] = country_regions.reset_index().index + 1
    for index, row in country_regions.iterrows():
        cr = CountryRegion(id=row["id"], country=row["country"], region=row["region"])
        session.add(cr)
        session.commit()
        session.flush()
        session.refresh(cr)
    print("[DATABASE UPDATED]: Country Region")
    session.close()


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    seeder_region(session=session)

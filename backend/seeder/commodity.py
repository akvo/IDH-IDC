import os
import sys
import pandas as pd
from core.config import generate_config_file
from db.connection import Base, engine, SessionLocal
from utils.truncator import truncatedb
from sqlalchemy.orm import Session
from models.commodity_category import CommodityCategory
from models.commodity import Commodity

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MASTER_DIR = BASE_DIR + "/source/master/"
sys.path.append(BASE_DIR)


def seeder_commodity(session: Session):
    ## Commodity Categories and Commoditys
    truncatedb(session=session, table="commodity")
    truncatedb(session=session, table="commodity_category")

    commodities = pd.read_csv(MASTER_DIR + "commodities.csv")
    commodity_category = commodities[["group_id", "group_name"]]
    commodity_category = commodity_category.rename(
        columns={"group_id": "id", "group_name": "name"}
    )
    commodity_category = commodity_category.drop_duplicates(subset="id").reset_index()
    commodity_category = commodity_category[["id", "name"]]
    category_objects = []
    for index, row in commodity_category.iterrows():
        category = CommodityCategory(id=row["id"], name=row["name"])
        category_objects.append(category)
    session.bulk_save_objects(category_objects, update_changed_only=True)
    session.commit()
    print("[DATABASE UPDATED]: Commodity Category")

    commodities = commodities[["id", "group_id", "name"]]
    commodities = commodities.rename(columns={"group_id": "commodity_category"})
    commodity_objects = []
    for index, row in commodities.iterrows():
        commodity = Commodity(
            id=row["id"], commodity_category=row["commodity_category"], name=row["name"]
        )
        commodity_objects.append(commodity)
    session.bulk_save_objects(commodity_objects, update_changed_only=True)
    session.commit()
    print("[DATABASE UPDATED]: Commodity")
    session.close()

    generate_config_file()


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    seeder_commodity(session=session)

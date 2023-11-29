import os
import sys
import pandas as pd
from core.config import generate_config_file
from db.connection import Base, engine, SessionLocal
from utils.truncator import truncatedb
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MASTER_DIR = BASE_DIR + "/source/master/"
sys.path.append(BASE_DIR)


# THIS WILL DEPRECATED
def seeder_master(session: Session, engine: create_engine):
    ## Country and Currency
    truncatedb(session=session, table="country")
    truncatedb(session=session, table="currency")
    data = pd.read_csv(MASTER_DIR + "countries.csv")
    countries = data[["id", "country"]].rename(columns={"country": "name"})
    countries["parent"] = None
    print("[DATABASE UPDATED]: Country")
    countries.to_sql("country", con=engine, if_exists="append", index=False)
    currencies = data[["id", "currency", "abbreviation"]].rename(
        columns={"currency": "name"}
    )
    currencies["country"] = data["id"]
    currencies.to_sql("currency", con=engine, if_exists="append", index=False)
    print("[DATABASE UPDATED]: Currency")

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
    commodity_category.to_sql(
        "commodity_category", con=engine, if_exists="append", index=False
    )
    print("[DATABASE UPDATED]: Commodity Category")
    commodities = commodities[["id", "group_id", "name"]]
    commodities = commodities.rename(columns={"group_id": "commodity_category"})
    commodities.to_sql("commodity", con=engine, if_exists="append", index=False)
    print("[DATABASE UPDATED]: Commodity")

    ## Bussiness Unit
    truncatedb(session=session, table="business_unit")
    business_unit = pd.read_csv(MASTER_DIR + "business_unit.csv")
    business_unit = business_unit[["id", "name"]]
    business_unit.to_sql("business_unit", con=engine, if_exists="append", index=False)
    print("[DATABASE UPDATED]: Business Unit")

    ## organization
    truncatedb(session=session, table="organisation")
    organisation = pd.read_csv(MASTER_DIR + "organisation.csv")
    organisation = organisation[["id", "name"]]
    organisation.to_sql("organisation", con=engine, if_exists="append", index=False)
    print("[DATABASE UPDATED]: Organisation")

    ## tags
    truncatedb(session=session, table="tag")
    tags = pd.read_csv(MASTER_DIR + "tags.csv")
    tags = tags[["id", "name", "description"]]
    tags.to_sql("tag", con=engine, if_exists="append", index=False)
    print("[DATABASE UPDATED]: Tag")

    ## regions
    truncatedb(session=session, table="region")
    regions = pd.read_csv(MASTER_DIR + "regions.csv")
    regions = regions.rename(columns={"region": "name"})
    regions = regions.drop(columns=["country_id", "country"])
    regions.to_sql("region", con=engine, if_exists="append", index=False)
    print("[DATABASE UPDATED]: Region")

    ## country region
    # Filter rows where the list does not contain any string values
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
    country_regions.to_sql(
        "country_region", con=engine, if_exists="append", index=False
    )
    print("[DATABASE UPDATED]: Country Region")

    ## living income benchmark
    truncatedb(session=session, table="living_income_benchmark")
    li_benchmark = pd.read_csv(MASTER_DIR + "li_benchmark.csv")
    # Filter rows where the list does not contain any string values
    filtered_lib = li_benchmark[li_benchmark["country_id"] != li_benchmark["country"]]
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
    filtered_lib.to_sql(
        "living_income_benchmark", con=engine, if_exists="append", index=False
    )
    print("[DATABASE UPDATED]: Living Income Benchmark")

    ## CPI
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
    filtered_cpi = filtered_cpi.fillna(0)
    filtered_cpi.to_sql("cpi", con=engine, if_exists="append", index=False)
    print("[DATABASE UPDATED]: CPI")

    generate_config_file()


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    seeder_master(session=session, engine=engine)

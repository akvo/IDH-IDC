import os
from jsmin import jsmin
from db.connection import SessionLocal

from models.business_unit import BusinessUnit
from models.commodity_category import CommodityCategory
from models.currency import Currency
from models.country import Country


JS_FILE = "./config.min.js"


def generate_config_file() -> None:
    print("[START] Generating config")
    session = SessionLocal()
    env_js = "var __ENV__={"
    env_js += 'client_id:"{}"'.format(os.environ["CLIENT_ID"])
    env_js += ', client_secret:"{}"'.format(os.environ["CLIENT_SECRET"])
    env_js += "};"
    min_js = jsmin("".join([env_js, ""]))
    business_units = session.query(BusinessUnit).all() or []
    session.flush()
    if business_units:
        business_units = [bu.serialize for bu in business_units]
    commodity_categories = session.query(CommodityCategory).all() or []
    session.flush()
    if commodity_categories:
        commodity_categories = [
            cc.serialize_with_commodities for cc in commodity_categories
        ]
    currencies = (
        session.query(Currency.abbreviation, Currency.country).distinct() or []
    )
    session.flush()
    if currencies:
        currencies = [
            {"value": c[0], "label": c[0], "country": c[1]} for c in currencies
        ]
    countries = (
        session.query(Country).filter(Country.parent.is_(None)).all()
        or []  # noqa
    )
    session.flush()
    if countries:
        countries = [c.to_dropdown for c in countries]
    min_js += "var master={};".format(
        str(
            {
                "business_units": business_units,
                "commodity_categories": commodity_categories,
                "currencies": currencies,
                "countries": countries,
            }
        )
    )
    with open(JS_FILE, "w") as jsfile:
        jsfile.write(min_js)
    print("[DONE] Config generated")
    session.close()


generate_config_file()

import logging

from fastapi import FastAPI, Request, Response
from middleware import decode_token
from fastapi.responses import FileResponse

from routes.user import user_route
from routes.tag import tag_route
from routes.case import case_route
from routes.question import question_route
from routes.segment import segment_route
from routes.segment_answer import segment_answer_route
from routes.organisation import organisation_route
from routes.region import region_route
from routes.living_income_benchmark import lib_route
from routes.cpi import cpi_route
from routes.visualization import visualization_route
from routes.reference_data import reference_data_routes
from routes.company import company_route
from routes.map import map_route
from routes.optimization import optimization_route
from routes.procurement_library.assessment_question import (
    assessment_question_route,
)
from routes.procurement_library.practice import practice_route
from routes.procurement_library.procurement_process import (
    procurement_process_route,
)
from routes.procurement_library_v2.practice import pl_practice_router_v2
from routes.procurement_library_v2.category import pl_cat_router_v2

import os
from jsmin import jsmin
from db.connection import SessionLocal

from models.business_unit import BusinessUnit
from models.commodity_category import CommodityCategory
from models.currency import Currency
from models.country import Country


# Configure logging
logging.basicConfig(
    filename="app.log",
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",  # Date format
)


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MASTER_DIR = BASE_DIR + "/source/master/"

JS_FILE = "./config.min.js"


def generate_config_file() -> None:
    print("[START] Generating config")
    session = SessionLocal()
    env_js = "var __ENV__={"
    env_js += 'client_id:"{}"'.format(os.environ["CLIENT_ID"])
    env_js += ', client_secret:"{}"'.format(os.environ["CLIENT_SECRET"])
    env_js += "};"
    topojson = "var topojson={};".format(
        open(f"{MASTER_DIR}/world_map.geojson").read()
    )
    min_js = jsmin("".join([env_js, topojson, ""]))
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


app = FastAPI(
    root_path="/api",
    title="IDH-IDC",
    description="Auth Client ID: 99w2F1wVLZq8GqJwZph1kE42GuAZFvlF",
    version="1.0.0",
    contact={
        "name": "Akvo",
        "url": "https://akvo.org",
        "email": "dev@akvo.org",
    },
    license_info={
        "name": "AGPL3",
        "url": "https://www.gnu.org/licenses/agpl-3.0.en.html",
    },
)


# Routes register
app.include_router(organisation_route)
app.include_router(company_route)
app.include_router(user_route)
app.include_router(case_route)
app.include_router(question_route)
app.include_router(segment_route)
app.include_router(segment_answer_route)
app.include_router(tag_route)
app.include_router(region_route)
app.include_router(lib_route)
app.include_router(cpi_route)
app.include_router(visualization_route)
app.include_router(reference_data_routes)
app.include_router(map_route)
app.include_router(optimization_route)
app.include_router(assessment_question_route)
app.include_router(practice_route)
app.include_router(procurement_process_route)
app.include_router(pl_cat_router_v2)
app.include_router(pl_practice_router_v2)


@app.get("/", tags=["Dev"])
def read_main():
    return "OK"


@app.get("/health-check", tags=["Dev"])
def health_check():
    return "OK"


@app.get(
    "/config.js",
    response_class=FileResponse,
    tags=["Config"],
    name="config.js",
    description="static javascript config",
)
async def main(res: Response):
    res.headers["Content-Type"] = "application/x-javascript; charset=utf-8"
    return JS_FILE


@app.middleware("http")
async def route_middleware(request: Request, call_next):
    auth = request.headers.get("Authorization")
    if auth:
        auth = decode_token(auth.replace("Bearer ", ""))
        request.state.authenticated = auth
    response = await call_next(request)
    return response

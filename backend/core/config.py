import os
from jsmin import jsmin
from fastapi import FastAPI, Request, Response
from middleware import decode_token
from fastapi.responses import FileResponse
from db.connection import SessionLocal

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

from models.business_unit import BusinessUnit
from models.commodity_category import CommodityCategory
from models.currency import Currency
from models.country import Country


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

JS_FILE = "./config.min.js"


def generate_config_file() -> None:
    session = SessionLocal()
    env_js = "var __ENV__={"
    env_js += 'client_id:"{}"'.format(os.environ["CLIENT_ID"])
    env_js += ', client_secret:"{}"'.format(os.environ["CLIENT_SECRET"])
    env_js += "};"
    min_js = jsmin("".join([env_js, ""]))
    business_units = session.query(BusinessUnit).all() or []
    if business_units:
        business_units = [bu.serialize for bu in business_units]
    commodity_categories = session.query(CommodityCategory).all() or []
    if commodity_categories:
        commodity_categories = [
            cc.serialize_with_commodities for cc in commodity_categories
        ]
    currencies = session.query(Currency.abbreviation).distinct() or []
    if currencies:
        currencies = [{"value": c[0], "label": c[0]} for c in currencies]
    countries = (
        session.query(Country).filter(Country.parent == None).all() or []  # noqa
    )
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


# Routes register
app.include_router(organisation_route)
app.include_router(user_route)
app.include_router(case_route)
app.include_router(question_route)
app.include_router(segment_route)
app.include_router(segment_answer_route)
app.include_router(tag_route)
app.include_router(region_route)
app.include_router(lib_route)
app.include_router(cpi_route)


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

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

from utils.generate_config import JS_FILE


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

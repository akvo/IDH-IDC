import pandas as pd

from fastapi import (
    APIRouter,
    Request,
    Depends,
    HTTPException,
    UploadFile,
    File,
)
from fastapi.security import HTTPBearer, HTTPBasicCredentials as credentials
from sqlalchemy.orm import Session
from db.connection import get_session
from typing import List
from typing_extensions import TypedDict

from middleware import (
    verify_case_creator,
)
from io import BytesIO

security = HTTPBearer()
case_import_route = APIRouter()


ROUTE_TAG_NAME = ["Case Spreadsheet Upload"]
REQUIRED_SHEETS = {"data", "mapping"}


class CaseSpreadSheetColumns(TypedDict):
    categorical: List[str]
    numerical: List[str]


def validate_workbook(xls: pd.ExcelFile):
    missing = REQUIRED_SHEETS - set(xls.sheet_names)
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required sheet(s): {', '.join(missing)}",
        )


def extract_column_types(df: pd.DataFrame):
    categorical = []
    numerical = []

    for col in df.columns:
        series = df[col]

        # Skip empty columns
        if series.dropna().empty:
            continue

        if pd.api.types.is_numeric_dtype(series):
            numerical.append(col)
        elif pd.api.types.is_bool_dtype(series):
            categorical.append(col)
        elif pd.api.types.is_datetime64_any_dtype(series):
            # Ignore for now (explicitly)
            continue
        else:
            # object, string, mixed → categorical
            categorical.append(col)

    return {
        "categorical": categorical,
        "numerical": numerical,
    }


@case_import_route.post(
    "/case/import",
    response_model=CaseSpreadSheetColumns,
    summary="Upload and parse case import file",
    tags=ROUTE_TAG_NAME,
)
def case_import(
    req: Request,
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    # Auth check (reuse existing logic)
    verify_case_creator(session=session, authenticated=req.state.authenticated)

    if not file.filename.lower().endswith(".xlsx"):
        raise HTTPException(
            status_code=400,
            detail="Only .xlsx files are supported",
        )

    try:
        content = file.file.read()
        xls = pd.ExcelFile(BytesIO(content))
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid Excel file",
        )

    # Validate sheets
    validate_workbook(xls)

    # Load sheets
    mapping_df = pd.read_excel(xls, sheet_name="mapping")
    data_df = pd.read_excel(xls, sheet_name="data")

    if data_df.empty or mapping_df.empty:
        mapping_preffix = "Mapping" if mapping_df.empty else ""
        data_preffix = "Data" if mapping_df.empty else ""
        and_text = " and " if mapping_preffix & data_preffix else ""
        msg_preffix = f"{mapping_preffix}{and_text}{data_preffix}"
        raise HTTPException(
            status_code=400,
            detail=f"{msg_preffix} sheet is empty",
        )

    column_types = extract_column_types(data_df)

    return {
        "categorical": column_types["categorical"],
        "numerical": column_types["numerical"],
    }

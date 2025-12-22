import uuid
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

from middleware import (
    verify_case_creator,
)
from io import BytesIO
from db.crud_case_import import create_case_import, get_case_import
from utils.case_import_dataframe import load_data_dataframe_from_bytes
from utils.case_import_storage import save_import_file, load_import_file
from models.case_import import (
    CaseSpreadSheetColumns,
    SegmentationPreviewRequest,
    SegmentationPreviewResponse,
)

security = HTTPBearer()
case_import_route = APIRouter()


ROUTE_TAG_NAME = ["Case Spreadsheet Upload"]
REQUIRED_SHEETS = {"data", "mapping"}


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


def generate_categorical_segments(df: pd.DataFrame, column: str):
    counts = df[column].fillna("Unknown").value_counts()

    segments = []
    for idx, value in enumerate(counts.index, start=1):
        segments.append(
            {
                "segment_index": idx,
                "label": str(value),
                "condition": {
                    "operator": "is",
                    "value": value,
                },
            }
        )

    return segments


def generate_numerical_segments(
    df: pd.DataFrame, column: str, n_segments: int
):
    series = df[column].dropna()

    if series.empty:
        raise HTTPException(
            status_code=400,
            detail="Selected variable has no valid numerical values",
        )

    quantiles = [series.quantile(i / n_segments) for i in range(1, n_segments)]

    segments = []
    prev = None

    for idx, q in enumerate(quantiles + [None], start=1):
        if prev is None:
            condition = {
                "operator": "<=",
                "value": round(q, 4),
            }
        elif q is None:
            condition = {
                "operator": ">",
                "value": round(prev, 4),
            }
        else:
            condition = {
                "operator": "between",
                "value": [round(prev, 4), round(q, 4)],
            }

        segments.append(
            {
                "segment_index": idx,
                "label": f"Segment {idx}",
                "condition": condition,
            }
        )

        prev = q

    return segments


@case_import_route.post(
    "/case-import",
    response_model=CaseSpreadSheetColumns,
    summary="Upload case spreadsheet file",
    tags=ROUTE_TAG_NAME,
)
def case_import(
    req: Request,
    case_id: int,
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    user = verify_case_creator(
        session=session,
        authenticated=req.state.authenticated,
    )

    if not file.filename.lower().endswith(".xlsx"):
        raise HTTPException(
            status_code=400,
            detail="Only .xlsx files are supported",
        )

    content = file.file.read()

    try:
        xls = pd.ExcelFile(BytesIO(content))
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid Excel file",
        )

    validate_workbook(xls)

    data_df = pd.read_excel(xls, sheet_name="data")
    mapping_df = pd.read_excel(xls, sheet_name="mapping")

    if data_df.empty or mapping_df.empty:
        raise HTTPException(
            status_code=400,
            detail="Data or Mapping sheet is empty",
        )

    # Save file
    import_id = str(uuid.uuid4())
    file_path = save_import_file(import_id, content)

    # Persist import session
    create_case_import(
        session=session,
        case_id=case_id,
        user_id=user.id,
        file_path=file_path,
    )

    column_types = extract_column_types(data_df)

    return {
        "import_id": import_id,
        "columns": {
            "categorical": column_types["categorical"],
            "numerical": column_types["numerical"],
        },
    }


@case_import_route.post(
    "/case-import/segmentation-preview",
    response_model=SegmentationPreviewResponse,
    summary="Generate prefilled segmentation splits",
    tags=ROUTE_TAG_NAME,
)
def segmentation_preview(
    req: Request,
    payload: SegmentationPreviewRequest,
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    verify_case_creator(
        session=session,
        authenticated=req.state.authenticated,
    )

    case_import = get_case_import(session=session, import_id=payload.import_id)

    content = load_import_file(case_import.file_path)
    df = load_data_dataframe_from_bytes(content)

    variable = payload.segmentation_variable
    var_type = payload.variable_type

    if variable not in df.columns:
        raise HTTPException(
            status_code=400,
            detail="Segmentation variable not found in data sheet",
        )

    if var_type == "categorical":
        segments = generate_categorical_segments(df, variable)

    elif var_type == "numerical":
        if not payload.number_of_segments:
            raise HTTPException(
                status_code=400,
                detail="number_of_segments is required for numerical variable",
            )
        segments = generate_numerical_segments(
            df,
            variable,
            payload.number_of_segments,
        )

    else:
        raise HTTPException(
            status_code=400,
            detail="Invalid variable type",
        )

    return {
        "import_id": payload.import_id,
        "segmentation_variable": variable,
        "type": var_type,
        "segments": segments,
    }

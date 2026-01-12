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
from utils.case_import_processing import (
    load_data_dataframe_from_bytes,
    validate_workbook,
    extract_column_types,
    generate_categorical_segments,
    generate_numerical_segments,
)
from utils.case_import_storage import save_import_file, load_import_file
from utils.case_import_process_confirmed_segmentation import (
    process_confirmed_segmentation,
)
from models.case_import import (
    CaseImportResponse,
    SegmentationPreviewRequest,
    SegmentationPreviewResponse,
    GenerateSegmentValuesRequest,
)

security = HTTPBearer()
case_import_route = APIRouter()


ROUTE_TAG_NAME = ["Case Spreadsheet Upload"]


@case_import_route.post(
    "/case-import",
    response_model=CaseImportResponse,
    summary="Upload case spreadsheet file",
    tags=ROUTE_TAG_NAME,
)
def case_import(
    req: Request,
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
    file_import_id = str(uuid.uuid4())
    file_path = save_import_file(file_import_id, content)

    # Persist import session
    case_import = create_case_import(
        session=session,
        user_id=user.id,
        file_path=file_path,
    )

    column_types = extract_column_types(data_df)

    return {
        "import_id": str(case_import.id),
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


@case_import_route.post(
    "/case-import/generate-segment-values",
    summary="Generate segment values for case commodities",
    tags=ROUTE_TAG_NAME,
)
def generate_segment_values(
    req: Request,
    payload: GenerateSegmentValuesRequest,
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    # Authorization
    verify_case_creator(
        session=session,
        authenticated=req.state.authenticated,
    )

    # Process confirmed segmentation
    result = process_confirmed_segmentation(
        request=payload,
        session=session,
    )

    return result

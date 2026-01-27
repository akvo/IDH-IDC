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
from fastapi.responses import FileResponse
from pathlib import Path

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
    validate_ready_for_upload,
    recalculate_numerical_segments,
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
    SegmentationRecalculateRequest,
)

security = HTTPBearer()
case_import_route = APIRouter()


ROUTE_TAG_NAME = ["Case Spreadsheet Upload"]

BASE_DIR = Path(__file__).resolve().parents[1]
TEMPLATE_DIR = BASE_DIR / "assets" / "templates"
TEMPLATE_NAME = "data_upload_template.xlsm"


@case_import_route.post(
    "/case-import",
    response_model=CaseImportResponse,
    summary="Upload case spreadsheet file",
    name="case_import:upload_file",
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

    if not file.filename.lower().endswith((".xlsx", ".xlsm")):
        raise HTTPException(
            status_code=400,
            detail="Only .xlsx and .xlsm files are supported",
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

    try:
        data_df = pd.read_excel(xls, sheet_name="data")
        mapping_df = pd.read_excel(xls, sheet_name="mapping")
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Failed to read required sheets",
        )

    if data_df.empty or mapping_df.empty:
        raise HTTPException(
            status_code=400,
            detail="Data or Mapping sheet is empty",
        )

    # 🔒 HARD BLOCK: Mapping must be ready
    validate_ready_for_upload(mapping_df)

    # Save file only if fully valid
    file_import_id = str(uuid.uuid4())
    file_path = save_import_file(file_import_id, content)

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
    name="case_import:segmentation_preview",
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

    variable = payload.segmentation_variable.lower()
    var_type = payload.variable_type.lower()

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
        "variable_type": var_type,
        "segments": segments,
    }


@case_import_route.post(
    "/case-import/generate-segment-values",
    summary="Generate segment values for case commodities",
    name="case_import:generate_segment_values",
    tags=ROUTE_TAG_NAME,
)
def generate_segment_values(
    req: Request,
    payload: GenerateSegmentValuesRequest,
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    verify_case_creator(
        session=session,
        authenticated=req.state.authenticated,
    )

    return process_confirmed_segmentation(
        payload=payload,
        session=session,
    )


@case_import_route.get(
    "/case-import/download-template",
    summary="Download XLSM upload template",
    response_class=FileResponse,
    tags=ROUTE_TAG_NAME,
)
def download_upload_template():
    file_path = TEMPLATE_DIR / TEMPLATE_NAME

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Template not found")

    return FileResponse(
        path=file_path,
        filename=TEMPLATE_NAME,
        media_type="application/vnd.ms-excel.sheet.macroEnabled.12",
    )


@case_import_route.post(
    "/case-import/recalculate-segmentation",
    summary="Recalculate segmentation after user edits segment values",
    name="case_import:recalculate_segmentation",
    tags=ROUTE_TAG_NAME,
)
def recalculate_segmentation(
    req: Request,
    payload: SegmentationRecalculateRequest,
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    verify_case_creator(
        session=session,
        authenticated=req.state.authenticated,
    )

    case_import = get_case_import(
        session=session,
        import_id=payload.import_id,
    )

    content = load_import_file(case_import.file_path)
    df = load_data_dataframe_from_bytes(content)

    variable = payload.segmentation_variable.lower()
    var_type = payload.variable_type.lower()

    if variable not in df.columns:
        raise HTTPException(
            status_code=400,
            detail="Segmentation variable not found in data sheet",
        )

    # -------- CATEGORICAL --------
    if var_type == "categorical":
        # No recalculation needed; categories are fixed
        segments = generate_categorical_segments(
            df=df,
            column=variable,
        )

    # -------- NUMERICAL --------
    elif var_type == "numerical":
        if not payload.segments:
            raise HTTPException(
                status_code=400,
                detail="Segments are required for numerical recalculation",
            )

        segments = recalculate_numerical_segments(
            df=df,
            column=variable,
            segments=[seg.dict() for seg in payload.segments],
        )

    else:
        raise HTTPException(
            status_code=400,
            detail="Invalid variable type",
        )

    return {
        "import_id": payload.import_id,
        "segmentation_variable": variable,
        "variable_type": var_type,
        "segments": segments,
    }

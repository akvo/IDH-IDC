import pandas as pd
import numpy as np

from io import BytesIO
from fastapi import HTTPException

REQUIRED_SHEETS = {"data", "mapping"}


def load_data_dataframe_from_bytes(content: bytes) -> pd.DataFrame:
    try:
        xls = pd.ExcelFile(BytesIO(content))
        df = pd.read_excel(xls, sheet_name="data")
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Failed to load data sheet",
        )

    if df.empty:
        raise HTTPException(
            status_code=400,
            detail="Data sheet is empty",
        )

    return df


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
                "index": idx,
                "name": column,
                "operator": "is",
                "value": value,
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

    # Sort values and split into equal-frequency buckets
    values = np.sort(series.to_numpy())
    buckets = np.array_split(values, n_segments)

    segments = []
    seen = set()

    for idx, bucket in enumerate(buckets, start=1):
        value = round(float(bucket.max()), 2)
        if value in seen:
            continue
        seen.add(value)

        segments.append(
            {
                "index": idx,
                "name": column,
                "operator": "<=",
                "value": value,
            }
        )

    return segments


def validate_ready_for_upload(mapping_df: pd.DataFrame) -> None:
    """
    Expects mapping sheet format:
    | Ready for upload | YES/NO |
    | Number of issues | <int> |
    """

    # Normalize columns
    mapping_df = mapping_df.copy()
    mapping_df.columns = mapping_df.columns.str.strip().str.lower()

    # First column = label, second column = value
    first_col = mapping_df.iloc[:, 0].astype(str).str.strip().str.lower()

    ready_row = mapping_df.loc[first_col == "ready for upload"]

    if ready_row.empty:
        raise HTTPException(
            status_code=400,
            detail="Mapping sheet missing 'Ready for upload' flag",
        )

    ready_value = str(ready_row.iloc[0, 1]).strip().lower()

    if ready_value != "yes":
        raise HTTPException(
            status_code=400,
            detail="Excel file is not ready for upload. Fix issues in Mapping sheet.",  # noqa
        )

import pandas as pd

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

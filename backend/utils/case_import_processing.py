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
    categorical, numerical = [], []

    for col in df.columns:
        series = df[col].dropna()
        if series.empty:
            continue

        if pd.api.types.is_numeric_dtype(series):
            numerical.append(col)
        elif pd.api.types.is_datetime64_any_dtype(series):
            continue
        else:
            categorical.append(col)

    return {
        "categorical": categorical,
        "numerical": numerical,
    }


def generate_categorical_segments(df: pd.DataFrame, column: str):
    counts = df[column].fillna("Unknown").value_counts()

    segments = []
    for idx, (value, count) in enumerate(counts.items(), start=1):
        segments.append(
            {
                "index": idx,
                "name": column,
                "operator": "is",
                "value": value,
                "number_of_farmers": int(count),
            }
        )

    return segments


def generate_numerical_cut_values(
    df: pd.DataFrame,
    column: str,
    n_segments: int,
):
    series = df[column].dropna().to_numpy()

    if series.size == 0:
        raise HTTPException(
            status_code=400,
            detail="Selected variable has no valid numerical values",
        )

    # Equal-frequency cuts via quantiles
    quantiles = np.linspace(0, 1, n_segments + 1)[1:]
    cuts = np.quantile(series, quantiles)

    # Deduplicate & round
    cuts = np.unique(np.round(cuts, 2))

    if cuts.size == 0:
        raise HTTPException(
            status_code=400,
            detail="Unable to generate segmentation cuts",
        )

    return cuts


def calculate_numerical_segments_from_cuts(
    df: pd.DataFrame,
    column: str,
    cuts: np.ndarray,
):
    values = df[column].dropna().to_numpy()

    # Assign bucket indices
    bucket_idx = np.digitize(values, bins=cuts, right=True)

    counts = np.bincount(
        bucket_idx,
        minlength=len(cuts),
    )

    segments = []
    for idx, (cut, count) in enumerate(zip(cuts, counts), start=1):
        segments.append(
            {
                "index": idx,
                "name": column,
                "operator": "<=",
                "value": float(cut),
                "number_of_farmers": int(count),
            }
        )

    # Sort by farmers DESC (your current behavior)
    segments.sort(
        key=lambda x: x["number_of_farmers"],
        reverse=True,
    )

    # Reindex
    for i, seg in enumerate(segments, start=1):
        seg["index"] = i

    return segments


def generate_numerical_segments(
    df: pd.DataFrame,
    column: str,
    n_segments: int,
):
    cuts = generate_numerical_cut_values(
        df=df,
        column=column,
        n_segments=n_segments,
    )

    return calculate_numerical_segments_from_cuts(
        df=df,
        column=column,
        cuts=cuts,
    )


def recalculate_numerical_segments(
    df: pd.DataFrame,
    column: str,
    segments: list[dict],
):
    cuts = np.array(
        [
            float(seg["value"])
            for seg in sorted(segments, key=lambda x: x["index"])
        ],
        dtype=float,
    )

    if not np.all(np.diff(cuts) > 0):
        raise HTTPException(
            status_code=400,
            detail="Segment values must be strictly increasing",
        )

    return calculate_numerical_segments_from_cuts(
        df=df,
        column=column,
        cuts=cuts,
    )


def validate_ready_for_upload(mapping_df: pd.DataFrame) -> None:
    """
    Searches the entire mapping sheet for:
        Ready for upload: | YES/NO

    Location-independent (can be anywhere in the sheet).
    """

    df = mapping_df.copy()
    df = df.applymap(lambda x: str(x).strip().lower())

    # Find cell containing "ready for upload"
    matches = df == "ready for upload:"

    if not matches.any().any():
        raise HTTPException(
            status_code=400,
            detail="Mapping sheet missing 'Ready for upload' flag",
        )

    # Get first match location
    row_idx, col_idx = next(
        (i, j)
        for i, row in enumerate(matches.values)
        for j, val in enumerate(row)
        if val
    )

    # Value must be in the cell to the right
    try:
        ready_value = df.iat[row_idx, col_idx + 1]
    except IndexError:
        raise HTTPException(
            status_code=400,
            detail="The file has not been validated. Please refer to the instructions in the data upload template.",  # noqa
        )

    if ready_value != "yes":
        raise HTTPException(
            status_code=400,
            detail="Excel file is not ready for upload. Fix issues in Mapping sheet.",  # noqa
        )

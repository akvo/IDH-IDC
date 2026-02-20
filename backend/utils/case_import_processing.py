import pandas as pd
import numpy as np

from io import BytesIO
from fastapi import HTTPException

REQUIRED_SHEETS = {"data", "mapping"}


def resolve_sheet_name(xls: pd.ExcelFile, target: str) -> str:
    """Helper to resolve spreadsheet sheet name case-insensitively."""
    return next(
        (s for s in xls.sheet_names if s.strip().lower() == target.lower()),
        None,
    )


def load_data_dataframe_from_bytes(content: bytes) -> pd.DataFrame:
    try:
        xls = pd.ExcelFile(BytesIO(content))
        data_sheet = resolve_sheet_name(xls, "data")
        if not data_sheet:
            raise HTTPException(
                status_code=400,
                detail="Missing required sheet: data",
            )
        df = pd.read_excel(xls, sheet_name=data_sheet)
    except HTTPException:
        raise
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
    missing = [s for s in REQUIRED_SHEETS if not resolve_sheet_name(xls, s)]
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
                "name": value,
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
    strategy: str = "equal_frequency",
):
    series = df[column].dropna().to_numpy()

    if series.size == 0:
        raise HTTPException(
            status_code=400,
            detail="Selected variable has no valid numerical values",
        )

    # Strategy Selector
    if strategy == "equal_interval":
        # Equal-interval cuts
        cuts = np.linspace(np.min(series), np.max(series), n_segments + 1)[1:]
    else:
        # Equal-frequency cuts via quantiles
        # method='closest_observation' ensures
        # thresholds are actual data points
        quantiles = np.linspace(0, 1, n_segments + 1)[1:]
        cuts = np.quantile(
            series,
            quantiles,
            method="closest_observation",
        )

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
    """
    Generate numerical segments based on cut values.

    Args:
        df: DataFrame containing the data
        column: Name of the column to segment
        cuts: Array of cut values defining the upper bounds of segments

    Returns:
        List of segment dictionaries containing:
        - index: Segment index (1-based)
        - name: Variable name
        - operator: Comparison operator (<=)
        - value: Upper bound (cut value)
        - number_of_farmers: Count of records in this segment
        - min: lower bound of the segment range
        - max: upper bound of the segment range
    """
    values = df[column].dropna().to_numpy()
    # Round values to 2 decimals to match the precision of cuts
    # (which are also rounded to 2 decimals)
    # This prevents floating point errors where e.g. 1.9500000001
    # falls into the >1.95 bucket
    values = np.round(values, 2)

    # Assign bucket indices
    bucket_idx = np.digitize(values, bins=cuts, right=True)

    counts = np.bincount(
        bucket_idx,
        minlength=len(cuts),
    )

    segments = []

    # Calculate min/max for each segment
    # For the first segment, min is the minimum value in the dataset
    # For subsequent segments, min is the previous segment's upper bound (cut)
    data_min = np.min(values) if values.size > 0 else 0

    # Check if data is integer-like
    is_integer_data = False
    if values.size > 0:
        is_integer_data = np.all(np.mod(values, 1) == 0)

    for idx, (cut, count) in enumerate(zip(cuts, counts), start=1):
        # Determine range for this segment
        if idx == 1:
            # If the cut is smaller than data_min, using data_min would result
            # in an inverted range (e.g. min=20, max=10).
            # We cap the min at the cut value in that case.
            seg_min = min(data_min, cut)
        else:
            prev_cut = cuts[idx - 2]
            if is_integer_data:
                # For integers, next segment starts at prev_cut + 1
                # We assume floor(prev_cut) to handle any float artifacts,
                # effectively +1 integer unit.
                seg_min = np.floor(prev_cut) + 1
            else:
                # For floats, we add a small step to avoid visual overlap
                # since precision is 2 decimals
                seg_min = prev_cut + 0.01

        if is_integer_data:
            seg_max = np.floor(cut)
            # Also floor seg_min if it came from data_min to be consistent
            seg_min = np.floor(seg_min)
        else:
            seg_max = cut

        segments.append(
            {
                "index": idx,
                "name": column,
                "operator": "<=",
                "value": float(cut),
                "number_of_farmers": int(count),
                "min": float(round(seg_min, 2)),
                "max": float(round(seg_max, 2)),
            }
        )

    # Sort by farmers DESC (your current behavior)
    # remove comment if needed to recalculate
    # segments.sort(
    #     key=lambda x: x["number_of_farmers"],
    #     reverse=True,
    # )

    # Reindex
    # for i, seg in enumerate(segments, start=1):
    #     seg["index"] = i

    return segments


def generate_numerical_segments(
    df: pd.DataFrame,
    column: str,
    n_segments: int,
    strategy: str = "equal_frequency",
):
    cuts = generate_numerical_cut_values(
        df=df,
        column=column,
        n_segments=n_segments,
        strategy=strategy,
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
    strategy: str = "equal_frequency",
):
    """
    Recalculate numerical segments with support for per-segment variables.
    """
    sorted_segments = sorted(segments, key=lambda x: x["index"])
    processed_segments = []

    for idx, seg in enumerate(sorted_segments):
        # Use per-segment variable if specified, otherwise fallback to default
        seg_var_input = (
            (seg.get("segmentation_variable") or column).strip().lower()
        )
        seg_type = (seg.get("variable_type") or "numerical").lower()

        # Resolve actual column name case-insensitively
        seg_var = next(
            (c for c in df.columns if c.strip().lower() == seg_var_input),
            None,
        )

        if not seg_var:
            raise HTTPException(
                400,
                f"Segmentation variable '{seg_var_input}' not found in data",
            )

        series = df[seg_var].dropna().to_numpy()
        # Round values to 2 decimals to match the precision of cuts
        series = np.round(series, 2)
        is_numeric = pd.api.types.is_numeric_dtype(df[seg_var])
        is_integer_data = is_numeric and np.all(np.mod(series, 1) == 0)

        # Find the previous segment of the SAME variable for lower bound
        prev_seg_same_var = next(
            (
                s
                for s in reversed(sorted_segments[:idx])
                if (s.get("segmentation_variable") or column).strip().lower()
                == seg_var_input
            ),
            None,
        )

        lower_bound = (
            float(prev_seg_same_var["value"]) if prev_seg_same_var else None
        )
        upper_bound = float(seg["value"])

        # Calculate count
        if seg_type == "numerical" and is_numeric:
            if lower_bound is None:
                count = np.sum(series <= upper_bound)
                # min is min of data or upper_bound (to avoid inversion)
                data_min = np.min(series) if series.size > 0 else 0
                seg_min = min(data_min, upper_bound)
            else:
                count = np.sum(
                    (series > lower_bound) & (series <= upper_bound)
                )
                if is_integer_data:
                    seg_min = np.floor(lower_bound) + 1
                else:
                    seg_min = lower_bound + 0.01

            seg_max = np.floor(upper_bound) if is_integer_data else upper_bound
            if is_integer_data:
                seg_min = np.floor(seg_min)

            processed_segments.append(
                {
                    "index": seg["index"],
                    "name": seg_var,
                    "operator": "<=",
                    "value": float(upper_bound),
                    "number_of_farmers": int(count),
                    "min": float(round(seg_min, 2)),
                    "max": float(round(seg_max, 2)),
                    "segmentation_variable": seg_var,
                    "variable_type": seg_type,
                }
            )
        else:
            # Categorical fallback
            val = str(seg["value"]).strip().lower()
            # If data is not numeric in DF, use string comparison
            if not is_numeric:
                count = np.sum(
                    df[seg_var].astype(str).str.strip().str.lower() == val
                )
            else:
                count = np.sum(df[seg_var] == seg["value"])

            processed_segments.append(
                {
                    "index": seg["index"],
                    "name": seg_var,
                    "operator": "is",
                    "value": seg["value"],
                    "number_of_farmers": int(count),
                    "segmentation_variable": seg_var,
                    "variable_type": seg_type,
                }
            )

    return processed_segments


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

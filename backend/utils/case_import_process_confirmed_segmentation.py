import os
import pandas as pd
from typing import Dict, Any, List
from fastapi import HTTPException

from utils.case_import_storage import IMPORT_BASE_DIR
from models.question import Question
from seeder.question_public_key_map import PUBLIC_KEY_MAP


def resolve_question_id_by_public_key(
    *,
    session,
    public_key: str,
) -> int:
    question = (
        session.query(Question)
        .filter(Question.public_key == public_key)
        .one_or_none()
    )

    if not question:
        raise HTTPException(
            status_code=400,
            detail=f"No question found for public_key '{public_key}'",
        )

    return question.id


def process_confirmed_segmentation(
    *,
    request,
    session,
) -> Dict[str, Any]:

    # --------------------------------------------------
    # 1. Inputs
    # --------------------------------------------------
    case_id = request.case_id
    import_id = request.import_id
    segmentation_variable = request.segmentation_variable
    segment_type = request.variable_type
    confirmed_segments = request.confirmed_segments

    # --------------------------------------------------
    # 2. Resolve Import File (PATH-BASED, FINAL STAGE)
    # --------------------------------------------------
    file_path = os.path.join(IMPORT_BASE_DIR, f"{import_id}.xlsx")

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail="Import file not found or expired",
        )

    # --------------------------------------------------
    # 3. Load Excel Sheets
    # --------------------------------------------------
    try:
        data_df = pd.read_excel(file_path, sheet_name="Data")
        mapping_df = pd.read_excel(file_path, sheet_name="Mapping")
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to read import file: {str(exc)}",
        )

    # --------------------------------------------------
    # 4. Validate Mapping Sheet
    # --------------------------------------------------
    required_cols = {"public_key", "variable_name"}
    if not required_cols.issubset(mapping_df.columns):
        raise HTTPException(
            status_code=400,
            detail="Mapping sheet must contain public_key and variable_name",
        )

    valid_public_keys = set(PUBLIC_KEY_MAP.values())

    invalid_keys = set(mapping_df["public_key"]) - valid_public_keys
    if invalid_keys:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid public_key(s): {sorted(invalid_keys)}",
        )

    missing_vars = set(mapping_df["variable_name"]) - set(data_df.columns)
    if missing_vars:
        raise HTTPException(
            status_code=400,
            detail=f"Variable not found in Data sheet: {sorted(missing_vars)}",
        )

    # --------------------------------------------------
    # 5. Apply Mapping (Data → public_key)
    # --------------------------------------------------
    rename_map = dict(
        zip(mapping_df["variable_name"], mapping_df["public_key"])
    )

    data_df = data_df.rename(columns=rename_map)

    output_drivers: List[str] = (
        mapping_df["public_key"].dropna().unique().tolist()
    )

    # --------------------------------------------------
    # 6. Build Segmentation Column
    # --------------------------------------------------
    if segmentation_variable not in data_df.columns:
        raise HTTPException(
            status_code=400,
            detail=f"Segmentation variable {segmentation_variable} not found",
        )

    if segment_type == "categorical":
        grouping_series = data_df[segmentation_variable]

        actual = set(grouping_series.dropna().unique())
        confirmed = {s.segment_name for s in confirmed_segments}

        if actual != confirmed:
            raise HTTPException(
                status_code=400,
                detail="Confirmed segments do not match data categories",
            )

    else:
        labels = [s.segment_name for s in confirmed_segments]

        grouping_series = pd.qcut(
            data_df[segmentation_variable],
            q=len(labels),
            labels=labels,
            duplicates="drop",
        )

    data_df["_segment"] = grouping_series

    # --------------------------------------------------
    # 7. Aggregate Statistics
    # --------------------------------------------------
    aggregated: Dict[str, Any] = {}

    for public_key in output_drivers:
        stats_df = (
            data_df.groupby("_segment")[public_key]
            .agg(
                current="median",
                feasible=lambda x: x.quantile(0.9),
            )
            .reset_index()
        )

        aggregated[public_key] = stats_df.to_dict("records")

    # --------------------------------------------------
    # 8. Build Segment + SegmentAnswer Payload
    # --------------------------------------------------
    segments_payload = []

    for seg in confirmed_segments:
        segment_name = seg.segment_name

        answers = []

        for public_key, rows in aggregated.items():
            row = next(
                (r for r in rows if r["_segment"] == segment_name),
                None,
            )

            if not row:
                continue

            question_id = resolve_question_id_by_public_key(
                session=session,
                public_key=public_key,
            )

            answers.append(
                {
                    "question": question_id,
                    "current_value": float(row["current"]),
                    "feasible_value": float(row["feasible"]),
                }
            )

        segments_payload.append(
            {
                "name": segment_name,
                "case": case_id,
                "number_of_farmers": seg.number_of_farmers,
                "answers": answers,
            }
        )

    # --------------------------------------------------
    # 9. Cleanup Temporary Import
    # --------------------------------------------------
    try:
        os.remove(file_path)
    except Exception:
        pass

    # --------------------------------------------------
    # 10. Response
    # --------------------------------------------------
    return {
        "status": "success",
        "case_id": case_id,
        "segments": segments_payload,
        "total_segments": len(segments_payload),
        "drivers_processed": len(output_drivers),
    }

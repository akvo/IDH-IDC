# import os
import pandas as pd
from typing import Dict, Any
from fastapi import HTTPException
from io import BytesIO

from models.question import Question
from utils.case_import_storage import load_import_file
from db.crud_case_import import get_case_import


# --------------------------------------------------
# Question resolver
# --------------------------------------------------
def resolve_question(
    *,
    session,
    question_id: int | None,
    public_key: str | None,
) -> Question:
    if question_id:
        q = session.get(Question, int(question_id))
        if q:
            return q
        raise HTTPException(
            status_code=400,
            detail=f"Question not found for id {question_id}",
        )

    if public_key:
        q = (
            session.query(Question)
            .filter(Question.public_key == public_key)
            .one_or_none()
        )
        if q:
            return q
        raise HTTPException(
            status_code=400,
            detail=f"Question not found for public_key '{public_key}'",
        )

    raise HTTPException(
        status_code=400,
        detail="Mapping row must contain either id or public_key",
    )


# --------------------------------------------------
# Main processor
# --------------------------------------------------
def process_confirmed_segmentation(
    *,
    payload,
    session,
) -> Dict[str, Any]:

    # --------------------------------------------------
    # 1. Inputs
    # --------------------------------------------------
    case_id = payload.case_id
    segmentation_variable = payload.segmentation_variable.strip().lower()
    segments = sorted(payload.segments, key=lambda s: s.index)

    # --------------------------------------------------
    # 2. Load import file (bytes)
    # --------------------------------------------------
    case_import = get_case_import(session=session, import_id=payload.import_id)
    content = load_import_file(case_import.file_path)

    try:
        xls = pd.ExcelFile(BytesIO(content))
        data_df = pd.read_excel(xls, sheet_name="data")
        mapping_df = pd.read_excel(xls, sheet_name="mapping")

        # normalize column names
        data_df.columns = data_df.columns.str.strip().str.lower()
        mapping_df.columns = mapping_df.columns.str.strip().str.lower()
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Failed to read import workbook",
        )

    if segmentation_variable not in data_df.columns:
        raise HTTPException(
            status_code=400,
            detail=f"Segmentation variable {segmentation_variable} not found",
        )

    # --------------------------------------------------
    # 3. Validate mapping sheet
    # --------------------------------------------------
    if "variable_name" not in mapping_df.columns:
        raise HTTPException(
            status_code=400,
            detail="Mapping sheet must contain 'variable_name'",
        )

    if not {"id", "public_key"} & set(mapping_df.columns):
        raise HTTPException(
            status_code=400,
            detail="Mapping sheet must contain at least 'id' or 'public_key'",
        )

    # Only variables explicitly mapped are output drivers
    output_variables = (
        mapping_df["variable_name"].dropna().str.lower().tolist()
    )

    # --------------------------------------------------
    # 4. Segment assignment (UI AUTHORITATIVE)
    # --------------------------------------------------
    series = data_df[segmentation_variable]
    is_numeric = pd.api.types.is_numeric_dtype(series)

    if not is_numeric:
        series = series.astype(str).str.strip().str.lower()
        category_map = {
            str(seg.value).strip().lower(): seg.name for seg in segments
        }

    def assign_segment(value):
        if pd.isna(value):
            return None

        # ---------- NUMERIC ----------
        if is_numeric:
            prev = None
            for seg in segments:
                bound = float(seg.value)
                if prev is None and value <= bound:
                    return seg.name
                if prev is not None and prev < value <= bound:
                    return seg.name
                prev = bound
            return segments[-1].name  # last open segment

        # ---------- CATEGORICAL ----------
        return category_map.get(str(value).strip().lower())

    data_df["_segment"] = series.apply(assign_segment)

    # --------------------------------------------------
    # 5. Aggregate statistics per segment
    # --------------------------------------------------
    aggregated: Dict[str, Dict[str, Dict[str, float]]] = {}

    for var in output_variables:
        if var not in data_df.columns:
            continue
        if not pd.api.types.is_numeric_dtype(data_df[var]):
            continue

        stats = (
            data_df.groupby("_segment")[var]
            .agg(
                current="median",
                feasible=lambda x: x.quantile(0.9),
            )
            .dropna()
            .to_dict(orient="index")
        )

        aggregated[var] = stats

    # --------------------------------------------------
    # 6. Build Segment + SegmentAnswer payload
    # --------------------------------------------------
    segments_payload = []

    for seg in segments:
        seg_name = seg.name

        seg_df = data_df[data_df["_segment"] == seg_name]
        number_of_farmers = int(len(seg_df))

        answers = []

        for _, row in mapping_df.iterrows():
            var = str(row["variable_name"]).lower()

            if var not in aggregated:
                continue
            if seg_name not in aggregated[var]:
                continue

            questionID = row.get("id")
            [qLevel, qID] = (
                questionID.split("-")
                if questionID and "-" in questionID
                else [None, None]
            )
            question = resolve_question(
                session=session,
                question_id=qID,
                public_key=row.get("public_key"),
            )

            stats = aggregated[var][seg_name]

            answers.append(
                {
                    "question_id": question.id,
                    "question_level": qLevel,  # primary / secondary / tertiary
                    "current_value": float(stats["current"]),
                    "feasible_value": float(stats["feasible"]),
                }
            )

        segments_payload.append(
            {
                "name": seg_name,
                "case": case_id,
                "number_of_farmers": number_of_farmers,
                "answers": answers,
            }
        )

    # --------------------------------------------------
    # 7. Cleanup
    # --------------------------------------------------
    # try:
    #     os.remove(case_import.file_path)
    # except Exception:
    #     pass

    # --------------------------------------------------
    # 8. Response
    # --------------------------------------------------
    return {
        "status": "success",
        "case_id": case_id,
        "segments": segments_payload,
        "total_segments": len(segments_payload),
        "drivers_processed": len(aggregated),
    }

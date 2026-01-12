import os
import pandas as pd
from typing import Dict, Any, List
from fastapi import HTTPException
from io import BytesIO

from models.question import Question
from utils.case_import_storage import load_import_file
from db.crud_case_import import get_case_import


def resolve_question(
    *,
    session,
    question_id: int,
    public_key: str | None = None,
) -> Question:
    """
    Returns full Question object.
    """

    if question_id is not None:
        q = session.get(Question, question_id)
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


def process_confirmed_segmentation(
    *,
    payload,
    session,
) -> Dict[str, Any]:

    # --------------------------------------------------
    # 1. Inputs
    # --------------------------------------------------
    case_id = payload.case_id
    segmentation_variable = payload.segmentation_variable.lower()
    segments = sorted(payload.segments, key=lambda s: s.index)

    # --------------------------------------------------
    # 2. Load import file
    # --------------------------------------------------
    case_import = get_case_import(session=session, import_id=payload.import_id)
    content = load_import_file(case_import.file_path)

    try:
        xls = pd.ExcelFile(BytesIO(content))
        data_df = pd.read_excel(xls, sheet_name="data")
        mapping_df = pd.read_excel(xls, sheet_name="mapping")

        # Normalize column names
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
            detail=f"Segmentation variable '{segmentation_variable}' not found",
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
            detail="Mapping sheet must contain 'id' or 'public_key'",
        )

    # Output variables = variables explicitly mapped
    output_variables = (
        mapping_df["variable_name"]
        .dropna()
        .astype(str)
        .str.strip()
        .str.lower()
        .unique()
        .tolist()
    )

    # --------------------------------------------------
    # 4. Assign segment labels (UI authoritative)
    # --------------------------------------------------
    series = data_df[segmentation_variable]
    is_numeric = pd.api.types.is_numeric_dtype(series)

    def assign_segment(value):
        if pd.isna(value):
            return None

        if is_numeric:
            prev = None
            for seg in segments:
                bound = seg.value
                if prev is None and value <= bound:
                    return seg.name
                if prev is not None and prev < value <= bound:
                    return seg.name
                prev = bound
            return None

        # categorical
        for seg in segments:
            if value == seg.value:
                return seg.name

        return None

    data_df["_segment"] = series.apply(assign_segment)

    # --------------------------------------------------
    # 5. Aggregate statistics per output variable
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
    # 6. Build Segment payload
    # --------------------------------------------------
    segments_payload = []

    for seg in segments:
        answers = []

        for _, row in mapping_df.iterrows():
            var = row["variable_name"]

            if var not in aggregated:
                continue

            if seg.name not in aggregated[var]:
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

            stats = aggregated[var][seg.name]

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
                "name": seg.name,
                "case": case_id,
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
        "output_variables": len(output_variables),
    }

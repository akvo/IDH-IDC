import os
import pandas as pd
from typing import Dict, Any
from fastapi import HTTPException
from io import BytesIO

from models.question import Question
from models.case_commodity import CaseCommodity, CaseCommodityType
from models.segment import SegmentUpdateBase, SegmentAnswerBase
from utils.case_import_storage import load_import_file
from db.crud_case_import import get_case_import
from db.crud_segment import update_segment


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
        raise HTTPException(400, f"Question not found for id {question_id}")

    if public_key:
        q = (
            session.query(Question)
            .filter(Question.public_key == public_key)
            .one_or_none()
        )
        if q:
            return q
        raise HTTPException(
            400, f"Question not found for public_key '{public_key}'"
        )

    raise HTTPException(
        400, "Mapping row must contain either id or public_key"
    )


# --------------------------------------------------
# Main processor (FINAL FIX)
# --------------------------------------------------
def process_confirmed_segmentation(
    *,
    payload,
    session,
) -> Dict[str, Any]:

    case_id = payload.case_id
    segmentation_variable = payload.segmentation_variable.strip().lower()
    segments = sorted(payload.segments, key=lambda s: s.index)

    # --------------------------------------------------
    # Load import file
    # --------------------------------------------------
    case_import = get_case_import(session=session, import_id=payload.import_id)
    content = load_import_file(case_import.file_path)

    try:
        xls = pd.ExcelFile(BytesIO(content))
        data_df = pd.read_excel(xls, sheet_name="data")
        mapping_df = pd.read_excel(xls, sheet_name="mapping")

        data_df.columns = data_df.columns.str.strip().str.lower()
        mapping_df.columns = mapping_df.columns.str.strip().str.lower()
    except Exception:
        raise HTTPException(400, "Failed to read import workbook")

    if segmentation_variable not in data_df.columns:
        raise HTTPException(
            400, f"Segmentation variable '{segmentation_variable}' not found"
        )

    # --------------------------------------------------
    # Prepare segmentation series
    # --------------------------------------------------
    seg_series = data_df[segmentation_variable]
    is_numeric = pd.api.types.is_numeric_dtype(seg_series)

    if not is_numeric:
        seg_series = seg_series.astype(str).str.strip().str.lower()

    # --------------------------------------------------
    # Resolve Case Commodity Levels (FIXED)
    # --------------------------------------------------
    case_commodities = (
        session.query(CaseCommodity)
        .filter(CaseCommodity.case == case_id)
        .all()
    )

    commodity_level_map = {}
    for cc in case_commodities:
        if cc.commodity_type == CaseCommodityType.focus:
            commodity_level_map["primary"] = cc.id
        else:
            commodity_level_map[cc.commodity_type.value] = cc.id

    # --------------------------------------------------
    # Process segments with BOUNDARY FILTERING
    # --------------------------------------------------
    segment_payloads = []

    for idx, seg in enumerate(segments):
        seg_id = seg.id
        seg_name = seg.name

        # ---------- APPLY SEGMENT FILTER ----------
        if is_numeric:
            lower = float(segments[idx - 1].value) if idx > 0 else None
            upper = float(seg.value)

            if lower is None:
                mask = seg_series <= upper
            else:
                mask = (seg_series > lower) & (seg_series <= upper)
        else:
            mask = seg_series == str(seg.value).strip().lower()

        seg_df = data_df[mask]
        number_of_farmers = int(len(seg_df))

        answers = []

        # ---------- PER-SEGMENT AGGREGATION ----------
        for _, row in mapping_df.iterrows():
            raw_id = row.get("id", None)
            level = None
            qid = None

            if not raw_id:
                continue

            var = str(row["variable_name"]).strip().lower()
            if var not in seg_df.columns:
                continue

            if not pd.api.types.is_numeric_dtype(seg_df[var]):
                continue

            values = seg_df[var].dropna()
            if values.empty:
                continue

            current_value = float(values.median())
            feasible_value = float(values.quantile(0.9))

            if raw_id and "-" in str(raw_id):
                level, qid = raw_id.split("-", 1)
                level = level.lower()
            else:
                qid = raw_id
                # Default commodity level when mapping id has no prefix
                level = CaseCommodityType.diversified.value

            # check for case_commodity_id
            case_commodity_id = commodity_level_map.get(level)
            if not case_commodity_id:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Case commodity not found for level '{level}' (mapping id: {raw_id})"  # noqa
                    ),
                )

            question = resolve_question(
                session=session,
                question_id=qid,
                public_key=row.get("public_key"),
            )

            answers.append(
                SegmentAnswerBase(
                    case_commodity=case_commodity_id,
                    segment=seg_id,
                    question=question.id,
                    current_value=current_value,
                    feasible_value=feasible_value,
                )
            )

        segment_payloads.append(
            SegmentUpdateBase(
                id=seg_id,
                name=seg_name,
                case=case_id,
                number_of_farmers=number_of_farmers,
                answers=answers,
            )
        )

    # --------------------------------------------------
    # Persist
    # --------------------------------------------------
    update_segment(session=session, payloads=segment_payloads)

    try:
        os.remove(case_import.file_path)
    except Exception:
        pass

    return {
        "status": "success",
        "case_id": case_id,
        "segments": segment_payloads,
        "total_segments": len(segment_payloads),
    }

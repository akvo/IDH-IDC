import os
import pandas as pd
from typing import Dict, Any
from fastapi import HTTPException
from io import BytesIO

from models.question import Question
from models.case_commodity import CaseCommodity, CaseCommodityType
from models.segment import SegmentUpdateBase, SegmentAnswerBase
from utils.case_import_storage import load_import_file
from utils.case_import_processing import resolve_sheet_name
from db.crud_case_import import get_case_import
from db.crud_segment import update_segment
from db.crud_case import get_case_by_id, get_segment_benchmark


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
    # Use segments in the order provided by the frontend
    segments = payload.segments

    # --------------------------------------------------
    # Load import file
    # --------------------------------------------------
    case_import = get_case_import(session=session, import_id=payload.import_id)
    content = load_import_file(case_import.file_path)

    try:
        xls = pd.ExcelFile(BytesIO(content))
        data_sheet = resolve_sheet_name(xls, "data")
        mapping_sheet = resolve_sheet_name(xls, "mapping")
        data_df = pd.read_excel(xls, sheet_name=data_sheet)
        mapping_df = pd.read_excel(xls, sheet_name=mapping_sheet)

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

        # Use per-segment variable if specified, otherwise fallback to default
        seg_var = (
            (seg.segmentation_variable or segmentation_variable)
            .strip()
            .lower()
        )
        seg_type = (
            seg.variable_type or "numerical"
        ).lower()  # default to numerical

        if seg_var not in data_df.columns:
            raise HTTPException(
                400, f"Segmentation variable '{seg_var}' not found in data"
            )

        seg_series = data_df[seg_var]
        seg_is_numeric = pd.api.types.is_numeric_dtype(seg_series)

        if not seg_is_numeric:
            seg_series = seg_series.astype(str).str.strip().str.lower()

        # ---------- APPLY SEGMENT FILTER ----------
        if seg.is_manual:
            number_of_farmers = seg.number_of_farmers or 0
            seg_df = (
                pd.DataFrame()
            )  # Empty DF for manual segments, will skip aggregation
        elif seg_type == "numerical" and seg_is_numeric:
            # Use explicit min/max if provided (Manual Authority)
            explicit_min = seg.min
            explicit_max = seg.max if seg.max is not None else float(seg.value)

            # Find previous segment of same variable for lower bound logic
            prev_seg_same_var = next(
                (
                    s
                    for s in reversed(segments[:idx])
                    if (s.segmentation_variable or segmentation_variable)
                    .strip()
                    .lower()
                    == seg_var
                    and not s.is_manual
                ),
                None,
            )

            if explicit_min is not None:
                lower = float(explicit_min)
            else:
                # Fallback to previous segment logic
                lower = (
                    float(prev_seg_same_var.value)
                    if prev_seg_same_var
                    else None
                )

            upper = float(explicit_max)

            if lower is None:
                mask = seg_series <= upper
            else:
                # Standard (Lower, Upper] interval for subsequent segments.
                # Use [Lower, Upper] for the very first segment of a variable
                # to ensure the minimum value is included.
                if prev_seg_same_var is None:
                    mask = (seg_series >= lower) & (seg_series <= upper)
                else:
                    mask = (seg_series > lower) & (seg_series <= upper)

            seg_df = data_df[mask]
            number_of_farmers = int(len(seg_df))
        else:
            # Categorical or non-numeric
            val = str(seg.value).strip().lower()
            mask = seg_series == val

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
            feasible_value = float(values.quantile(0.8))

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
                        f"Commodity level '{level}' found in data mapping "
                        f"but not defined in Case Details. "
                        f"Please add '{level}' commodity first."
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

    # return case detail instead of segments
    case = get_case_by_id(session=session, id=case_id)
    case = case.to_case_detail
    case = get_segment_benchmark(session=session, case=case)

    case["import_id"] = payload.import_id
    return case

import db.crud_segment as crud_segment
import db.crud_living_income_benchmark as crud_lib
import db.crud_case as crud_case

from fastapi import APIRouter, Request, Depends, Response, Query
from fastapi.security import HTTPBearer, HTTPBasicCredentials as credentials
from sqlalchemy.orm import Session
from typing import List, Optional
from http import HTTPStatus
from middleware import verify_case_editor, verify_case_viewer

from db.connection import get_session
from models.segment import (
    SegmentBase,
    SegmentUpdateBase,
    SegmentWithAnswersDict,
)


security = HTTPBearer()
segment_route = APIRouter()


@segment_route.post(
    "/segment",
    response_model=List[SegmentWithAnswersDict],
    summary="create segment",
    name="segment:create",
    tags=["Segment"],
)
def create_segment(
    req: Request,
    payload: List[SegmentBase],
    updated: Optional[bool] = Query(None),
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    case_id = payload[0].case
    user = verify_case_editor(
        session=session, authenticated=req.state.authenticated, case_id=case_id
    )
    if updated:
        crud_case.case_updated_by(
            session=session, case_id=case_id, user_id=user.id
        )
    segments = crud_segment.add_segment(session=session, payloads=payload)
    return [s.serialize_with_answers for s in segments]


@segment_route.put(
    "/segment",
    response_model=List[SegmentWithAnswersDict],
    summary="update segment",
    name="segment:update",
    tags=["Segment"],
)
def update_segment(
    req: Request,
    payload: List[SegmentUpdateBase],
    updated: Optional[bool] = Query(None),
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    case_id = payload[0].case
    user = verify_case_editor(
        session=session, authenticated=req.state.authenticated, case_id=case_id
    )
    segments = crud_segment.update_segment(session=session, payloads=payload)
    if updated:
        crud_case.case_updated_by(
            session=session, case_id=case_id, user_id=user.id
        )
    return [s.serialize_with_answers for s in segments]


@segment_route.delete(
    "/segment/{segment_id:path}",
    responses={204: {"model": None}},
    status_code=HTTPStatus.NO_CONTENT,
    summary="delete segment and segment answers by segment id",
    name="segment:delete",
    tags=["Segment"],
)
def delete_segment(
    req: Request,
    segment_id: int,
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    segment = crud_segment.get_segment_by_id(session=session, id=segment_id)
    case_id = segment.case
    verify_case_editor(
        session=session, authenticated=req.state.authenticated, case_id=case_id
    )
    crud_segment.delete_segment(session=session, id=segment_id)
    return Response(status_code=HTTPStatus.NO_CONTENT.value)


@segment_route.get(
    "/segment/case/{case_id:path}",
    response_model=List[SegmentWithAnswersDict],
    summary="get segment by case id",
    name="segment:get_by_case_id",
    tags=["Segment"],
)
def get_segments_by_case_id(
    req: Request,
    case_id: int,
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security),
):
    verify_case_viewer(
        session=session, authenticated=req.state.authenticated, case_id=case_id
    )
    case = crud_case.get_case_by_id(session=session, id=case_id)
    segments = crud_segment.get_segments_by_case_id(
        session=session, case_id=case_id
    )
    segments = [s.serialize_with_answers for s in segments]
    for segment in segments:
        benchmark = crud_lib.get_by_country_region_year(
            session=session,
            country=case.country,
            region=segment["region"],
            year=case.year,
        )
        segment["benchmark"] = benchmark
    return segments

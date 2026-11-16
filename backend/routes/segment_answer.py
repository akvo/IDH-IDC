import db.crud_segment_answer as crud_segment_answer

from fastapi import (
    APIRouter, Request, Depends
)
from fastapi.security import (
    HTTPBearer, HTTPBasicCredentials as credentials
)
from sqlalchemy.orm import Session
from typing import List

from db.connection import get_session
from middleware import verify_idc_access
from models.segment_answer import SegmentAnswerBase, SegmentAnswerDict


security = HTTPBearer()
segment_answer_route = APIRouter(
    dependencies=[Depends(verify_idc_access)]
)


@segment_answer_route.post(
    "/segment-answer/{segment_id:path}",
    response_model=List[SegmentAnswerDict],
    summary="add segment answer/value",
    name="segment_answer:add_answer",
    tags=["Segment Answer"]
)
def add_segment_answer(
    req: Request,
    segment_id: int,
    payload: List[SegmentAnswerBase],
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security)
):
    # add segment answers
    segment_answers = crud_segment_answer.add_segment_answer(
        session=session, payloads=payload, segment_id=segment_id
    )
    return [sa.serialize for sa in segment_answers]


@segment_answer_route.put(
    "/segment-answer/{segment_id:path}",
    response_model=List[SegmentAnswerDict],
    summary="update segment answer/value",
    name="segment_answer:update_answer",
    tags=["Segment Answer"]
)
def update_segment_answer(
    req: Request,
    segment_id: int,
    payload: List[SegmentAnswerBase],
    session: Session = Depends(get_session),
    credentials: credentials = Depends(security)
):
    # delete previous answers
    crud_segment_answer.delete_previous_segment_answer_by_segment_id(
        session=session, segment_id=segment_id
    )
    # add new segment answers
    segment_answers = crud_segment_answer.add_segment_answer(
        session=session, payloads=payload, segment_id=segment_id)
    return [sa.serialize for sa in segment_answers]

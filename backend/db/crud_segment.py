from sqlalchemy.orm import Session
from typing import List
from fastapi import HTTPException, status

from models.segment import (
    Segment, SegmentBase, SegmentDict, SegmentUpdateBase,
    SegmentWithAnswersDict
)
from models.segment_answer import SegmentAnswer


def add_segment(
    session: Session, payloads: List[SegmentBase]
) -> List[SegmentDict]:
    segments = []
    for payload in payloads:
        segment = Segment(
            name=payload.name,
            case=payload.case,
            region=payload.region,
            target=payload.target,
            adult=payload.adult,
            child=payload.child,
        )
        # handle segment answers
        for val in payload.answers:
            segment_answer = SegmentAnswer(
                case_commodity=val.case_commodity,
                question=val.question,
                current_value=val.current_value,
                feasible_value=val.feasible_value,
            )
            segment.segment_answers.append(segment_answer)
        session.add(segment)
        session.commit()
        session.flush()
        session.refresh(segment)
        segments.append(segment)
    return segments


def get_segment_by_id(session: Session, id: int) -> SegmentDict:
    segment = session.query(Segment).filter(Segment.id == id).first()
    if not segment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Segment {id} not found"
        )
    return segment


def update_segment(
    session: Session, payloads: List[SegmentUpdateBase]
) -> List[SegmentDict]:
    segments = []
    for payload in payloads:
        segment = get_segment_by_id(session=session, id=payload.id)
        segment.name = payload.name
        segment.case = payload.case
        segment.region = payload.region
        segment.target = payload.target
        segment.adult = payload.adult
        segment.child = payload.child
        # delete prev segment answers
        if payload.answers:
            prev_segment_answers = (
                session.query(SegmentAnswer)
                .filter(SegmentAnswer.segment == payload.id)
                .all()
            )
            for sa in prev_segment_answers:
                session.delete(sa)
            session.commit()
            session.flush()
        # handle segment answers
        for val in payload.answers:
            segment_answer = SegmentAnswer(
                segment=segment.id,
                case_commodity=val.case_commodity,
                question=val.question,
                current_value=val.current_value,
                feasible_value=val.feasible_value,
            )
            segment.segment_answers.append(segment_answer)
        session.commit()
        session.flush()
        session.refresh(segment)
        segments.append(segment)
    return segments


def delete_segment(session: Session, id: int):
    segment = get_segment_by_id(session=session, id=id)
    # delete segment answers
    segment_answers = (
        session.query(SegmentAnswer)
        .filter(SegmentAnswer.segment == id).all()
    )
    for sa in segment_answers:
        session.delete(sa)
    session.delete(segment)
    session.commit()
    session.flush()


def get_segments_by_case_id(
    session: Session, case_id: int
) -> List[SegmentWithAnswersDict]:
    segments = session.query(Segment).filter(Segment.case == case_id).all()
    if not segments:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Segments with case {case_id} not found"
        )
    return segments

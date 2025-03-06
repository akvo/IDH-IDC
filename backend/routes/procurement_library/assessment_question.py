from fastapi import APIRouter
from fastapi import Depends, Request
from sqlalchemy.orm import Session
from typing import List
from db.connection import get_session
from db.procurement_library import crud_assessment_question
from models.procurement_library.assessment_question import (
    AssessmentQuestionDict
)

assessment_question_route = APIRouter()


@assessment_question_route.get(
    "/pl/questions",
    response_model=List[AssessmentQuestionDict],
    summary="Get all assessment questions",
    description="Get all assessment questions",
    tags=["Procurement Library"],
    name="pl:get_all_questions",
)
def get_all_questions(
    req: Request,
    session: Session = Depends(get_session),
) -> List[AssessmentQuestionDict]:
    return crud_assessment_question.get_all_questions(session)

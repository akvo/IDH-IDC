from fastapi import APIRouter
from fastapi import Depends, Request
from sqlalchemy.orm import Session
from typing import List
from db.connection import get_session
from db.procurement_library import crud_assessment_question
from db.procurement_library import crud_practice
from models.procurement_library.assessment_question import AssessmentQuestionDict
from models.procurement_library.assessment_question_option import SelectedOption
from models.procurement_library.practice import PracticeListDict

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


@assessment_question_route.post(
    "/pl/questions",
    response_model=List[PracticeListDict],
    summary="Submit an assessment question answer",
    description="Submit an assessment question answer",
    tags=["Procurement Library"],
    name="pl:submit_answers",
)
def submit_answer(
    req: Request,
    answers: List[SelectedOption],
    session: Session = Depends(get_session),
    limit: int = 10,
) -> List[PracticeListDict]:
    # get all practices
    practices = crud_practice.get_all_practices(
        session=session,
    )
    # intialize practice results
    practice_results = []
    # loop through all practices
    for practice in practices:
        # intial total_score
        total_score = 0
        scores = []
        # loop each answers
        impact_score = 0
        for ax, a in enumerate(answers):
            # get score directly from practice model object via scores
            p_score = crud_practice.get_practice_score_by_indicator_id(
                session=session,
                practice_id=practice.id,
                indicator_id=a.indicator_id,
            )
            if p_score and ax == 0:
                impact_score = p_score.score
            if p_score and ax > 0:
                # sum up the score
                total_score += p_score.score
                # append score to scores list
                scores.append(f"{p_score.indicator.label}: {p_score.score}")
        # first total_score of impact area (first question) * 2
        total_score += impact_score * 2
        # append practice result
        practice_results.append(
            {
                "id": practice.id,
                "procurement_process_label": (
                    practice.procurement_process.label
                ),
                "procurement_process_id": practice.procurement_process_id,
                "label": practice.label,
                "is_environmental": practice.is_environmental,
                "is_income": practice.is_income,
                "total_score": total_score,
                "scores": scores,
                "created_at": practice.created_at,
            }
        )
    # sort practice results
    practice_results = sorted(
        practice_results, key=lambda x: x["total_score"],
        reverse=True
    )
    # get top practices based on the limit
    top_practices = practice_results[:limit]
    return top_practices

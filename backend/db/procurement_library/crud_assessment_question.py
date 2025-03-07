from typing import List
from sqlalchemy.orm import Session
from models.procurement_library.assessment_question import (
    AssessmentQuestion,
    AssessmentQuestionDict,
)


def get_all_questions(session: Session) -> List[AssessmentQuestionDict]:
    return [
        question.serialize
        for question in session.query(AssessmentQuestion).all()
    ]

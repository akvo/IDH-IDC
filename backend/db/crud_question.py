from sqlalchemy.orm import Session
from typing import List

from models.question import (
    Question,
    QuestionGroupParam,
    QuestionGroupListDict,
    QuestionType,
)
from models.commodity import Commodity
from models.commodity_category_question import CommodityCategoryQuestion
from models.case_commodity import CaseCommodity


def build_tree(data, parent=None):
    tree = []
    for item in data:
        if item["parent"] == parent:
            children = build_tree(data, item["id"])
            if children:
                item["childrens"] = children
            tree.append(item)
    return tree


def get_question_by_commodity(
    session: Session, params: List[QuestionGroupParam]
) -> List[QuestionGroupListDict]:
    res = []
    for param in params:
        commodity = (
            session.query(Commodity)
            .filter(Commodity.id == param["commodity"])
            .first()
        )
        commodity = commodity.to_question_list
        commodity_category_id = commodity["commodity_category_id"]
        questions = (
            session.query(Question)
            .join(CommodityCategoryQuestion)
            .filter(
                CommodityCategoryQuestion.commodity_category
                == commodity_category_id,
            )
            .all()
        )
        questions = [question.serialize for question in questions]
        if not param["breakdown"]:
            questions = list(
                filter(
                    lambda question: question["id"] == 1
                    or question["parent"] == 1,
                    questions,
                )
            )
        commodity["questions"] = build_tree(questions)
        res.append(commodity)
    return res


def get_question_by_case(
    session: Session, case_id: int
) -> List[QuestionGroupListDict]:
    case_commodity = (
        session.query(CaseCommodity)
        .filter(CaseCommodity.case == case_id)
        .all()
    )
    commodities = (
        session.query(Commodity)
        .filter(Commodity.id.in_(cc.commodity for cc in case_commodity))
        .all()
    )
    res = []
    for commodity in commodities:
        commodity = commodity.to_question_list
        commodity_category_id = commodity["commodity_category_id"]
        questions = (
            session.query(Question)
            .join(CommodityCategoryQuestion)
            .filter(
                CommodityCategoryQuestion.commodity_category
                == commodity_category_id,
            )
            .all()
        )
        questions = [question.serialize for question in questions]
        commodity["questions"] = build_tree(questions)
        res.append(commodity)
    # diversified questions
    diversified_qs = (
        session.query(Question)
        .filter(Question.question_type == QuestionType.diversified)
        .all()
    )
    diversified_qs = [dqs.serialize for dqs in diversified_qs]
    res.append(
        {
            "commodity_id": None,
            "commodity_name": "Diversified Income",
            "questions": build_tree(diversified_qs),
        }
    )
    return res


def get_question_by_created_by(session: Session, created_by=int):
    return (
        session.query(Question).filter(Question.created_by == created_by).all()
    )

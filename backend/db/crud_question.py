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
from models.case_commodity import CaseCommodity, CaseCommodityType


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
        # Fetch Commodity and optionally join with CaseCommodity
        case_commodity_data = (
            session.query(CaseCommodity, Commodity)
            .outerjoin(
                CaseCommodity, CaseCommodity.commodity == Commodity.id
            )  # LEFT JOIN
            .filter(Commodity.id == param["commodity"])
            .first()
        )

        if not case_commodity_data:
            continue  # Skip if no matching commodity is found

        case_commodity, commodity = case_commodity_data  # Unpacking results
        commodity_data = commodity.to_question_list
        commodity_category_id = commodity_data["commodity_category_id"]

        # Fetch related questions
        questions = (
            session.query(Question)
            .join(CommodityCategoryQuestion)
            .filter(
                CommodityCategoryQuestion.commodity_category
                == commodity_category_id
            )
            .all()
        )
        questions = [question.serialize for question in questions]

        # Apply breakdown filter if required
        if not param["breakdown"]:
            questions = [
                question
                for question in questions
                if question["id"] == 1 or question["parent"] == 1
            ]

        # Attach questions and additional fields
        commodity_data["questions"] = build_tree(questions)
        commodity_data["case_commodity_id"] = (
            case_commodity.id if case_commodity else None
        )
        commodity_data["case_commodity_type"] = (
            case_commodity.commodity_type.value if case_commodity else None
        )

        res.append(commodity_data)

    return res


def get_question_by_case(
    session: Session, case_id: int
) -> List[QuestionGroupListDict]:
    case_commodities = (
        session.query(CaseCommodity, Commodity)
        .join(Commodity, CaseCommodity.commodity == Commodity.id)
        .filter(CaseCommodity.case == case_id)
        .all()
    )

    diversified_commodity = (
        session.query(CaseCommodity)
        .filter(CaseCommodity.case == case_id)
        .filter(CaseCommodity.commodity_type == CaseCommodityType.diversified)
        .first()
    )
    diversified_case_commodity_id = (
        diversified_commodity.id if diversified_commodity else None
    )

    res = []
    for case_commodity, commodity in case_commodities:
        commodity_data = commodity.to_question_list
        commodity_category_id = commodity_data["commodity_category_id"]

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
        commodity_data["questions"] = build_tree(questions)

        # Add case_commodity_id and case_commodity_type to response
        commodity_data["case_commodity_id"] = case_commodity.id
        commodity_data["case_commodity_type"] = (
            case_commodity.commodity_type.value
        )

        res.append(commodity_data)

    # Diversified questions
    diversified_qs = (
        session.query(Question)
        .filter(Question.question_type == QuestionType.diversified)
        .all()
    )
    diversified_qs = [dqs.serialize for dqs in diversified_qs]
    res.append(
        {
            "case_commodity_id": diversified_case_commodity_id,  # Set if found
            "commodity_id": None,
            "commodity_name": "Diversified Income",
            "case_commodity_type": CaseCommodityType.diversified.value,
            "questions": build_tree(diversified_qs),
        }
    )

    return res


def get_question_by_created_by(session: Session, created_by=int):
    return (
        session.query(Question).filter(Question.created_by == created_by).all()
    )

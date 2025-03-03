import re
from fastapi import APIRouter, Request, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

from db.crud_segment import get_segment_by_id
from db.crud_question import get_question_by_case
from db.connection import get_session

optimization_route = APIRouter()


def evaluate_formula(
    formula: str, answers: dict, mode: str, case_commodity_id: Optional[int]
) -> float:
    """
    Evaluates a formula by replacing placeholders with actual values from
    answers.

    :param formula: Formula string with placeholders
    (e.g., "( #2 * #3 ) + #7")
    :param answers: Dictionary containing segment values
    (e.g., {"current-1004-2": 10}).
    :param mode: Mode ("current" or "feasible") to determine used value.
    :param case_commodity_id: ID of the case commodity.
    :return: Evaluated numeric result of the formula.
    """

    def replace_placeholder(match):
        question_id = match.group(1)
        answer_key = f"{mode}-{case_commodity_id}-{question_id}"
        return str(answers.get(answer_key, 0))  # Default to 0 if not found

    formula_with_values = re.sub(r"#(\d+)", replace_placeholder, formula)

    try:
        return eval(formula_with_values)  # Evaluate safely
    except Exception as e:
        print(f"Error evaluating formula: {formula_with_values} -> {e}")
        return 0.0


def calculate_total_income(
    commodities: List[dict], segment_data: dict, mode: str = "current"
) -> float:
    """
    Calculates total income dynamically based on formulas in default_value.

    :param commodities: List of commodity dictionaries.
    :param segment_data: Dictionary containing segment answers.
    :param mode: Either "current" or "feasible".
    :return: Computed total income across all commodities.
    """
    total_income = 0.0
    answers = segment_data.get("answers", {})

    for commodity in commodities:
        case_commodity_id = commodity.get(
            "case_commodity_id"
        )  # Can be None for Diversified Income

        # Find the aggregator question (Income formula)
        income_question = next(
            (
                q
                for q in commodity.get("questions", [])
                if q.get("question_type") == "aggregator"
            ),
            None,
        )

        if income_question and income_question.get("default_value"):
            # Evaluate formula dynamically
            commodity_income = evaluate_formula(
                income_question["default_value"],
                answers,
                mode,
                case_commodity_id,
            )
        else:
            # If no formula, sum up individual answers
            question_keys = [
                f"{mode}-{case_commodity_id}-{q['id']}"
                for q in commodity.get("questions", [])
            ]
            commodity_income = sum(
                answers.get(key, 0) for key in question_keys
            )

        total_income += commodity_income

    return total_income


@optimization_route.post(
    "/optimize/run-model/{case_id:path}",
    summary="Calculate the optimization value",
    name="optimization:run_model",
    tags=["Optimization"],
)
async def run_model(
    req: Request,
    case_id: int,
    segment_id: int,
    editable_drivers: List[int],
    session: Session = Depends(get_session),
):
    """
    Runs the optimization model for a given case and segment.

    :param req: The HTTP request.
    :param case_id: The case ID.
    :param segment_id: The segment ID.
    :param editable_drivers: List of editable driver IDs.
    :param session: SQLAlchemy session dependency.
    :return: The computed current net income.
    """

    # Get the segment data
    segment = get_segment_by_id(
        session=session, id=segment_id
    ).serialize_with_answers

    # Get the case questions (commodities)
    questions = get_question_by_case(session=session, case_id=case_id)

    # Calculate net income
    current_net_income = calculate_total_income(
        commodities=questions, segment_data=segment, mode="current"
    )

    return {"current_net_income": current_net_income}

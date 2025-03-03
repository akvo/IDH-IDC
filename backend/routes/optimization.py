import re
import numpy as np

from fastapi import APIRouter, Request, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

from db.crud_segment import get_segment_by_id
from db.crud_question import get_question_by_case
from db.connection import get_session

from scipy.optimize import minimize

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


# ---------------------------------------------------------
# Function: optimize_income
# ---------------------------------------------------------
def optimize_income(
    feasible_income,
    percentage,
    parameter_bounds,
    current_values,
    editable_indices,
    target_p,
    penalty_factor,
    questions,
):
    def objective_function(params):
        params_dict = {
            key: value for (key, _, _), value in zip(parameter_bounds, params)
        }
        params_answers = {
            "answers": {
                f"param-{key}": value for key, value in params_dict.items()
            }
        }
        neg_net_income = -calculate_total_income(
            commodities=questions, segment_data=params_answers, mode="param"
        )
        # Compute penalty for deviation from current values
        penalty = 0.0
        for key_item in editable_indices:
            editable_value = params_dict.get(key_item, 0)
            current_value = dict(current_values).get(key_item, 0)

            percentage_change = (editable_value - current_value) / (
                current_value + 1e-9
            )
            penalty += penalty_factor * percentage_change**2

        return neg_net_income + penalty

    # Constraint: net income should be equal to target_p
    def constraint_function(params):
        params_dict = {
            key: value for (key, _, _), value in zip(parameter_bounds, params)
        }
        params_answers = {
            "answers": {
                f"param-{key}": value for key, value in params_dict.items()
            }
        }
        return (
            calculate_total_income(
                commodities=questions,
                segment_data=params_answers,
                mode="param",
            )
            - target_p
        )

    constraints = [{"type": "eq", "fun": constraint_function}]

    # Adjust bounds: fix non-editable parameters at current values
    bounds = []
    for i, (key, low, high) in enumerate(parameter_bounds):
        if key in editable_indices:
            bounds.append((low, high))
        else:
            bounds.append(
                (
                    dict(current_values).get(key, low),
                    dict(current_values).get(key, high),
                )
            )

    # Initial guess: Use current values for editable parameters
    x0 = np.array([value for _, value in current_values])
    # print("Bounds:", bounds)
    # print("x0:", x0)

    # Solve optimization
    result = minimize(
        objective_function, x0, bounds=bounds, constraints=constraints
    )

    if not result.success:
        print("Warning: Optimization failed to meet the target income.")

    return result


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
    editable_indices: List[str],
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
    current_income = calculate_total_income(
        commodities=questions, segment_data=segment, mode="current"
    )

    target_income = segment.get("target", 0)
    feasible_income = calculate_total_income(
        commodities=questions, segment_data=segment, mode="feasible"
    )
    percentage = 0.5

    segment_answers = segment.get("answers", {})

    # start creating parameter bounds
    # Extract unique (case_commodity_id, question_id) pairs
    # while ignoring question_id = 1
    question_ids = {
        (case_commodity_id, qid)
        for k in segment_answers.keys()
        if (case_commodity_id := k.split("-")[1])
        and (qid := k.split("-")[2]) != "1"
    }

    # Build the list of (key, current, feasible) tuples dynamically,
    # replacing None with 0
    parameter_bounds = [
        (
            f"{case_commodity_id}-{qid}",
            segment_answers.get(f"current-{case_commodity_id}-{qid}", 0) or 0,
            segment_answers.get(f"feasible-{case_commodity_id}-{qid}", 0) or 0,
        )
        for case_commodity_id, qid in question_ids
    ]

    # Sort the list by case_commodity_id and qid
    # (convert to integers for sorting)
    parameter_bounds.sort(
        key=lambda x: (int(x[0].split("-")[0]), int(x[0].split("-")[1]))
    )
    # eol creating parameter bounds

    current_values = [(key, current) for key, current, _ in parameter_bounds]
    target_p = current_income + (feasible_income - current_income) * percentage

    # Optimize
    result = optimize_income(
        feasible_income,
        percentage,
        parameter_bounds,
        current_values,
        editable_indices,
        target_p,
        penalty_factor=1000,
        questions=questions,
    )
    optimized_values = result.x
    # Map optimized results to parameter keys
    optimized_params_dict = {
        key: value
        for (key, _, _), value in zip(parameter_bounds, optimized_values)
    }
    optimized_answers = {
        "answers": {
            f"optimized-{key}": value
            for key, value in optimized_params_dict.items()
        }
    }
    achieved_income = calculate_total_income(
        commodities=questions, segment_data=optimized_answers, mode="optimized"
    )

    return {
        "target_income": target_income,
        "current_income": current_income,
        "feasible_income": feasible_income,
        "achieved_income": achieved_income,
    }

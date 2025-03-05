import re
import numpy as np

from fastapi import APIRouter, Request, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

from db.crud_segment import get_segment_by_id
from db.crud_question import get_question_by_case
from db.connection import get_session
from models.case_commodity import CaseCommodityType

from scipy.optimize import minimize

optimization_route = APIRouter()
placeholder_pattern = re.compile(r"#(\d+)")


def extract_dependencies(formula) -> List[str]:
    if not isinstance(formula, str):
        return []
    return placeholder_pattern.findall(formula)


def evaluate_formula(
    formula: str,
    answers: dict,
    mode: str,
    case_commodity_id: Optional[int],
    question_id: Optional[int] = None,
) -> float:
    def replace_placeholder(match):
        referenced_qid = match.group(1)
        if question_id and referenced_qid == str(question_id):
            raise ValueError(
                f"Self-referencing detected in question {question_id}"
            )
        return str(
            answers.get(f"{mode}-{case_commodity_id}-{referenced_qid}", 0) or 0
        )

    formula_with_values = placeholder_pattern.sub(replace_placeholder, formula)
    try:
        return eval(formula_with_values)
    except Exception as e:
        print(f"Error evaluating formula: {formula_with_values} -> {e}")
        return 0.0


def flatten_questions(questions):
    flat_questions = {}
    child_to_parent = {}

    def _flatten(q_list, parent_id=None):
        for q in q_list:
            flat_questions[q["id"]] = q
            if parent_id:
                child_to_parent[q["id"]] = parent_id
            if "childrens" in q and q["childrens"]:
                _flatten(q["childrens"], q["id"])

    _flatten(questions)
    return flat_questions, child_to_parent


def recalculate_answers(
    answers, flat_questions, child_to_parent, field_key, question_id
):
    for qid, parent in child_to_parent.items():
        if parent == question_id:
            answers[f"{field_key}-{qid}"] = 0

    while question_id in child_to_parent:
        parent_id = child_to_parent[question_id]
        parent_key = f"{field_key}-{parent_id}"
        children = [
            qid for qid, p in child_to_parent.items() if p == parent_id
        ]

        if (
            "default_value" in flat_questions[parent_id]
            and flat_questions[parent_id]["default_value"]
        ):
            answers[parent_key] = evaluate_formula(
                flat_questions[parent_id]["default_value"],
                answers,
                field_key.split("-")[0],
                field_key.split("-")[1],
            )
        else:
            answers[parent_key] = sum(
                answers.get(f"{field_key}-{child}", 0) for child in children
            )

        question_id = parent_id


def calculate_total_income(
    commodities: list, segment_data: dict, mode: str = "current"
) -> tuple:
    total_income = 0.0
    answers = segment_data.get("answers", {})
    updated_answers = answers.copy()

    for commodity in commodities:
        case_commodity_id = commodity["case_commodity_id"]
        field_key = f"{mode}-{case_commodity_id}"
        flat_questions, child_to_parent = flatten_questions(
            commodity.get("questions", [])
        )

        for question_id, question in flat_questions.items():
            question_key = f"{field_key}-{question_id}"
            if "default_value" in question and question["default_value"]:
                updated_answers[question_key] = evaluate_formula(
                    question["default_value"],
                    updated_answers,
                    mode,
                    case_commodity_id,
                )
            elif question_id in child_to_parent:
                children = [
                    qid
                    for qid, p in child_to_parent.items()
                    if p == question_id
                ]
                updated_answers[question_key] = sum(
                    updated_answers.get(f"{field_key}-{child}", 0) or 0
                    for child in children
                )
            elif question_key not in updated_answers:
                updated_answers[question_key] = 0

        for question_id, question in flat_questions.items():
            if question.get("question_type") == "aggregator":
                q_key = f"{field_key}-{question_id}"
                if q_key not in updated_answers or updated_answers[q_key] == 0:
                    children = [
                        qid
                        for qid, p in child_to_parent.items()
                        if p == question_id
                    ]
                    updated_answers[q_key] = sum(
                        updated_answers.get(f"{field_key}-{child}", 0)
                        for child in children
                    )
        # only use aggregator
        if (
            commodity["case_commodity_type"]
            != CaseCommodityType.diversified.value
        ):
            commodity_income = updated_answers.get(f"{field_key}-{1}", 0)
        else:
            diversified_qids = [
                q["id"] for q in commodity.get("questions", [])
            ]
            commodity_income = sum(
                updated_answers.get(f"{field_key}-{qid}", 0) or 0
                for qid in diversified_qids
            )
        # updated_answers[f"{field_key}-income"] = commodity_income
        total_income += commodity_income

    return total_income, updated_answers


def optimize_income(
    parameter_bounds,
    current_values,
    editable_indices,
    target_p,
    questions,
    penalty_factor,
):
    """Optimizes income based on editable parameters."""

    def objective_function(params):
        params_dict = {
            key: value for (key, _, _), value in zip(parameter_bounds, params)
        }
        params_answers = {
            "answers": {
                f"param-{key}": value for key, value in params_dict.items()
            }
        }
        neg_net_income, _ = calculate_total_income(
            commodities=questions, segment_data=params_answers, mode="param"
        )
        neg_net_income = -neg_net_income

        # Compute penalty for deviation from current values
        penalty = sum(
            penalty_factor
            * (
                (params_dict.get(k, 0) - dict(current_values).get(k, 0))
                / (dict(current_values).get(k, 1e-9))
            )
            ** 2
            for k in editable_indices
        )

        return neg_net_income + penalty

    def constraint_function(params):
        params_dict = {
            key: value for (key, _, _), value in zip(parameter_bounds, params)
        }
        params_answers = {
            "answers": {
                f"param-{key}": value for key, value in params_dict.items()
            }
        }
        constraint_income, _ = calculate_total_income(
            commodities=questions,
            segment_data=params_answers,
            mode="param",
        )
        return constraint_income - target_p

    constraints = [{"type": "eq", "fun": constraint_function}]

    # recalculate parameter bounds by editable_indices
    bounds_temp = [
        (
            (
                k,
                dict(current_values).get(k, low),
                dict(current_values).get(k, high),
            )
            if k not in editable_indices
            else (k, low, high)
        )
        for k, low, high in parameter_bounds
    ]
    current_answers = {}
    feasible_answers = {}
    for k, low, high in bounds_temp:
        current_answer_key = f"current-{k}"
        feasible_answer_key = f"feasible-{k}"  # Fix here: Should be "feasible"

        current_answers[current_answer_key] = low
        feasible_answers[feasible_answer_key] = high

    _, current_recalculated_bounds = calculate_total_income(
        commodities=questions,
        segment_data={"answers": current_answers},
        mode="current",
    )
    filtered_current_recalculated_bounds = {
        k: v for k, v in current_recalculated_bounds.items() if v != 0
    }
    current_recalculated_bounds = (
        current_answers | filtered_current_recalculated_bounds
    )

    _, feasible_recalculated_bounds = calculate_total_income(
        commodities=questions,
        segment_data={"answers": feasible_answers},
        mode="feasible",
    )
    filtered_feasible_recalculated_bounds = {
        k: v for k, v in feasible_recalculated_bounds.items() if v != 0
    }
    feasible_recalculated_bounds = (
        feasible_answers | filtered_feasible_recalculated_bounds
    )
    # eol recalculate

    # merge the bounds recalculated
    merged_tuples = []
    # Extract unique keys ignoring "current-" and "feasible-" prefixes
    all_keys = set(
        re.sub(r"^(current-|feasible-)", "", key)
        for key in current_recalculated_bounds.keys()
        | feasible_recalculated_bounds.keys()
    )

    for key in all_keys:
        # Ignore question 1
        if key.endswith("-1"):
            continue
        current_key = f"current-{key}"
        feasible_key = f"feasible-{key}"
        current_value = current_recalculated_bounds.get(current_key, None)
        feasible_value = feasible_recalculated_bounds.get(feasible_key, None)
        merged_tuples.append((key, current_value, feasible_value))
    # Sort using integer conversion
    merged_tuples.sort(key=lambda x: tuple(map(int, x[0].split("-"))))

    # Set up bounds: Fix non-editable parameters at current values
    # TODO :: check for parents of editable_indices and zremove the value from bounds
    bounds = [(low, high) for _, low, high in merged_tuples]
    # bounds = [
    #     (
    #         (
    #             dict(current_values).get(k, low),
    #             dict(current_values).get(k, high),
    #         )
    #         if k not in editable_indices
    #         else (low, high)
    #     )
    #     for k, low, high in parameter_bounds
    # ]

    x0 = np.array([value for _, value in current_values])

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
    """Runs the optimization model for a given case and segment."""

    segment = get_segment_by_id(
        session=session, id=segment_id
    ).serialize_with_answers
    questions = get_question_by_case(session=session, case_id=case_id)
    current_income, _ = calculate_total_income(
        commodities=questions, segment_data=segment, mode="current"
    )
    feasible_income, _ = calculate_total_income(
        commodities=questions, segment_data=segment, mode="feasible"
    )

    segment_answers = segment.get("answers", {})

    percentage = 0.5
    target_p = current_income + (feasible_income - current_income) * percentage

    # Extract (case_commodity_id, question_id) pairs
    # while ignoring question_id = 1
    question_ids = {
        (k.split("-")[1], k.split("-")[2])
        for k in segment_answers.keys()
        if k.split("-")[2] != "1"
    }

    # Build parameter bounds
    parameter_bounds = [
        (
            f"{case_commodity_id}-{qid}",
            segment_answers.get(f"current-{case_commodity_id}-{qid}", 0) or 0,
            segment_answers.get(f"feasible-{case_commodity_id}-{qid}", 0) or 0,
        )
        for case_commodity_id, qid in question_ids
    ]
    # Sort using integer conversion
    parameter_bounds.sort(key=lambda x: tuple(map(int, x[0].split("-"))))

    current_values = [(key, current) for key, current, _ in parameter_bounds]

    result = optimize_income(
        parameter_bounds=parameter_bounds,
        current_values=current_values,
        editable_indices=editable_indices,
        target_p=target_p,
        questions=questions,
        penalty_factor=1000,
    )

    optimized_values = result.x
    optimized_params_dict = {
        key: value
        for (key, _, _), value in zip(parameter_bounds, optimized_values)
    }
    optimized_answers = {
        f"optimized-{key}": value
        for key, value in optimized_params_dict.items()
    }
    achieved_income, _ = calculate_total_income(
        commodities=questions,
        segment_data={"answers": optimized_answers},
        mode="optimized",
    )

    return {
        "target_income": segment.get("target", 0),
        "current_income": current_income,
        "feasible_income": feasible_income,
        "achieved_income": achieved_income,
        "target_p": target_p,
        "segment_answers": segment_answers,
        "optimized_answers": optimized_answers,
    }

import re
import numpy as np

from fastapi import APIRouter, Request, Depends
from sqlalchemy.orm import Session
from typing import List, Optional, Tuple

from db.crud_segment import get_segment_by_id
from db.crud_question import get_question_by_case
from db.connection import get_session

from scipy.optimize import minimize
from collections import defaultdict, deque

optimization_route = APIRouter()
placeholder_pattern = re.compile(r"#(\d+)")


def extract_dependencies(formula: str) -> List[str]:
    """Extracts dependencies (question IDs) from a formula."""
    return placeholder_pattern.findall(formula)


def evaluate_formula(
    formula: str, answers: dict, mode: str, case_commodity_id: Optional[int]
) -> float:
    """
    Evaluates a formula dynamically by replacing placeholders with answer
    values.
    """

    def replace_placeholder(match):
        question_id = match.group(1)
        return str(
            answers.get(f"{mode}-{case_commodity_id}-{question_id}", 0) or 0
        )

    formula_with_values = placeholder_pattern.sub(replace_placeholder, formula)

    try:
        return eval(formula_with_values)
    except Exception as e:
        print(f"Error evaluating formula: {formula_with_values} -> {e}")
        return 0.0


def build_dependency_graph(commodities: List[dict], mode: str) -> tuple:
    """Builds a dependency graph for topological sorting."""
    dependency_graph = defaultdict(set)
    in_degree = defaultdict(int)

    # Track commodities by case_commodity_id for quick lookup
    commodity_map = {c["case_commodity_id"]: c for c in commodities}

    # Build dependency graph
    for commodity in commodities:
        case_commodity_id = commodity["case_commodity_id"]

        for q in commodity.get("questions", []):
            if q.get("question_type") == "aggregator" and q.get(
                "default_value"
            ):
                dependencies = extract_dependencies(q["default_value"])
                for dep in dependencies:
                    # dep_key = f"{mode}-{case_commodity_id}-{dep}"

                    # If dependent question exists in another commodity,
                    # add dependency
                    for other_commodity in commodities:
                        for other_q in other_commodity.get("questions", []):
                            if str(other_q["id"]) == dep:
                                dep_case_commodity_id = other_commodity[
                                    "case_commodity_id"
                                ]
                                dependency_graph[dep_case_commodity_id].add(
                                    case_commodity_id
                                )
                                in_degree[case_commodity_id] += 1

    return dependency_graph, in_degree, commodity_map


def topological_sort(commodities: List[dict], mode: str) -> List[dict]:
    """
    Sorts commodities in an order that ensures children are processed before
    parents.
    """
    dependency_graph, in_degree, commodity_map = build_dependency_graph(
        commodities, mode
    )

    # Start with nodes that have no dependencies
    queue = deque(
        [
            c["case_commodity_id"]
            for c in commodities
            if in_degree[c["case_commodity_id"]] == 0
        ]
    )
    sorted_commodities = []

    while queue:
        case_commodity_id = queue.popleft()
        sorted_commodities.append(commodity_map[case_commodity_id])

        # Process children
        for dependent in dependency_graph[case_commodity_id]:
            in_degree[dependent] -= 1
            if in_degree[dependent] == 0:
                queue.append(dependent)

    return sorted_commodities


def calculate_total_income(
    commodities: List[dict], segment_data: dict, mode: str = "current"
) -> Tuple[float, dict]:
    """
    Calculates total income dynamically, ensuring child dependencies are
    processed first.
    Returns:
    - total_income: The sum of all computed values.
    - updated_answers: A dictionary with all calculated values per question.
    """

    total_income = 0.0
    updated_answers = segment_data.get(
        "answers", {}
    ).copy()  # Copy existing answers

    # Process commodities in the correct order (children first)
    sorted_commodities = topological_sort(commodities, mode)

    for commodity in sorted_commodities:
        case_commodity_id = commodity["case_commodity_id"]

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
            commodity_income = evaluate_formula(
                income_question["default_value"],
                updated_answers,
                mode,
                case_commodity_id,
            )
            updated_answers[
                f"{mode}-{case_commodity_id}-{income_question['id']}"
            ] = commodity_income  # Store computed value
        else:
            # Sum up individual answers if no formula
            question_keys = [
                f"{mode}-{case_commodity_id}-{q['id']}"
                for q in commodity.get("questions", [])
            ]
            commodity_income = sum(
                updated_answers.get(key, 0) or 0 for key in question_keys
            )

        # Store computed income for the commodity
        updated_answers[f"{mode}-{case_commodity_id}-income"] = (
            commodity_income
        )

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
        neg_net_income = -calculate_total_income(
            commodities=questions, segment_data=params_answers, mode="param"
        )

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
        return (
            calculate_total_income(
                commodities=questions,
                segment_data=params_answers,
                mode="param",
            )
            - target_p
        )

    constraints = [{"type": "eq", "fun": constraint_function}]

    # Set up bounds: Fix non-editable parameters at current values
    bounds = [
        (
            (
                dict(current_values).get(k, low),
                dict(current_values).get(k, high),
            )
            if k not in editable_indices
            else (low, high)
        )
        for k, low, high in parameter_bounds
    ]

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

    current_income, test = calculate_total_income(
        commodities=questions, segment_data=segment, mode="current"
    )
    feasible_income, _ = calculate_total_income(
        commodities=questions, segment_data=segment, mode="feasible"
    )

    segment_answers = segment.get("answers", {})
    return {
        "target_income": segment.get("target", 0),
        "current_income": current_income,
        "feasible_income": feasible_income,
        "test": test,
        "segment_answers": segment_answers,
    }

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
    achieved_income = calculate_total_income(
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

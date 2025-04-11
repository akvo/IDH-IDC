import re
import numpy as np

from fastapi import APIRouter, Request, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from collections import defaultdict

from db.crud_segment import get_segment_by_id
from db.crud_question import (
    get_question_by_case,
    # get_cost_production_questions,
    # get_loss_questions,
)
from db.connection import get_session

# from models.case_commodity import CaseCommodityType

from scipy.optimize import minimize

optimization_route = APIRouter()
placeholder_pattern = re.compile(r"#(\d+)")


def find_case_commodity_by_case_commodity_id(
    data: List[dict], case_commodity_id: int
):
    for item in data:
        if item.get("case_commodity_id") == case_commodity_id:
            return item
    return None


def get_parents(data: dict, key: int):
    parents = []
    while key in data:  # Continue until key is not found in dictionary
        key = data[key]  # Get the parent of the current key
        parents.append(key)  # Store the parent
    return parents


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


def get_parents_chain(qid, child_to_parent):
    chain = []
    while qid in child_to_parent:
        parent = child_to_parent[qid]
        chain.append(parent)
        qid = parent
    return chain


def calculate_values(
    flat_questions,
    child_to_parent,
    field_key,
    updated_answers,
    mode,
    case_commodity_id,
):
    parent_to_children = defaultdict(list)
    for child, parent in child_to_parent.items():
        parent_to_children[parent].append(child)

    # Sort by depth (deepest first)
    sorted_questions = sorted(
        flat_questions.items(),
        key=lambda x: len(get_parents_chain(x[0], child_to_parent)),
        reverse=True,
    )

    for question_id, question in sorted_questions:
        question_key = f"{field_key}-{question_id}"

        if question_key in updated_answers:
            continue  # already provided in answers

        if "default_value" in question and question["default_value"]:
            updated_answers[question_key] = evaluate_formula(
                question["default_value"],
                updated_answers,
                mode,
                case_commodity_id,
                question_id=question_id,
            )
        else:
            children = parent_to_children.get(question_id, [])
            if children:
                updated_answers[question_key] = sum(
                    updated_answers.get(f"{field_key}-{child}", 0) or 0
                    for child in children
                )
            else:
                updated_answers[question_key] = 0


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

        # Core: caculate all of question values
        calculate_values(
            flat_questions,
            child_to_parent,
            field_key,
            updated_answers,
            mode,
            case_commodity_id,
        )

        # Get income from aggregator (id = 1) or
        # sum of root/child if diversified
        income = 0
        if commodity["case_commodity_type"] != "diversified":
            income = updated_answers.get(f"{field_key}-1", 0) or 0
        else:
            root_question_ids = [
                q["id"] for q in commodity.get("questions", [])
            ]
            income = (
                sum(
                    updated_answers.get(f"{field_key}-{qid}", 0) or 0
                    for qid in root_question_ids
                )
                or 0
            )
        total_income += income

    return total_income, updated_answers


def calculate_true_feasible_income(
    parameter_bounds, editable_indices, current_values, questions
):
    values = []
    for param in parameter_bounds:
        qid, first, second = param
        find_curr_values = next((v for k, v in current_values if k == qid), 0)
        if qid in editable_indices:
            if find_curr_values > first:
                values.append((qid, first))
            else:
                values.append((qid, second))
        else:
            values.append((qid, find_curr_values))

    answers = {f"tf-{key}": value for key, value in values}
    tf_income, _ = calculate_total_income(
        commodities=questions,
        segment_data={"answers": answers},
        mode="tf",
    )
    return tf_income


def find_max_percentage(true_feasible_income, current_income, feasible_income):
    denominator = feasible_income - current_income
    if denominator == 0:
        return 0
    percentage = (true_feasible_income - current_income) / (denominator)
    return percentage


def optimize_income(
    parameter_bounds,
    current_values,
    editable_indices,
    target_p,
    questions,
    penalty_factor,
):
    """Optimizes income based on editable parameters."""
    # print("=========== TARGET P")
    # print(target_p)
    # print("=========== PARAMETER BOUNDS")
    # print(parameter_bounds)
    # print("=========== CURRENT VALUES")
    # print(current_values)
    # print("=========== DRIVERS")
    # print(editable_indices)

    def objective_function(params):
        params_dict = {
            key: value for (key, _, _), value in zip(parameter_bounds, params)
        }
        params_answers = {
            f"param-{key}": value for key, value in params_dict.items()
        }
        neg_net_income, _ = calculate_total_income(
            commodities=questions,
            segment_data={"answers": params_answers},
            mode="param",
        )
        neg_net_income = -neg_net_income

        # Compute penalty for deviation from current values
        penalty = 0.0
        for k in editable_indices:
            percentage_change = (
                params_dict.get(k, 0) - dict(current_values).get(k, 0)
            ) / (dict(current_values).get(k, 0) + 1e-9)
            penalty += penalty_factor * percentage_change**2
        # print(neg_net_income, penalty, "in")
        return neg_net_income + penalty

    def constraint_function(params):
        params_dict = {
            key: value for (key, _, _), value in zip(parameter_bounds, params)
        }
        params_answers = {
            f"param-{key}": value for key, value in params_dict.items()
        }
        constraint_income, _ = calculate_total_income(
            commodities=questions,
            segment_data={"answers": params_answers},
            mode="param",
        )
        return constraint_income - target_p

    constraints = [{"type": "eq", "fun": constraint_function}]

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
    "/optimize/run-model/{case_id:path}/{segment_id:path}",
    summary="Calculate the optimization value",
    name="optimization:run_model",
    tags=["Optimization"],
)
async def run_model(
    req: Request,
    case_id: int,
    segment_id: int,
    percentages: List[float],
    editable_indices: List[str],
    session: Session = Depends(get_session),
):
    """Runs the optimization model for a given case and segment."""

    # GENERATE list of COP question IDS
    # cop_questions = get_cost_production_questions(session=session)
    # flatten_cop_questions, _ = flatten_questions(cop_questions)
    # cop_qids = [f"-{key}" for key in flatten_cop_questions.keys()]
    # EOL GENERATE list of COP question IDS

    # LOSS qids
    # loss_qids = get_loss_questions(session=session)
    # loss_qids = [f"-{value}" for value in loss_qids]
    # EOLS LOSS qids

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
    print("=== CURRENT FEASIBLE INCOME ===")
    print(current_income, feasible_income)

    # Extract (case_commodity_id, question_id) pairs
    # while ignoring question_id = 1
    question_ids = {
        (k.split("-")[1], k.split("-")[2])
        for k in segment_answers.keys()
        if k.split("-")[2] != "1"
    }

    # Build parameter bound
    actual_bounds = []
    parameter_bounds = []
    for case_commodity_id, qid in question_ids:
        key = f"{case_commodity_id}-{qid}"
        current_value = segment_answers.get(f"current-{key}", 0) or 0
        feasible_value = segment_answers.get(f"feasible-{key}", 0) or 0
        if feasible_value < current_value:
            # swap parameter bound value if feasible < current
            parameter_bounds.append((key, feasible_value, current_value))
        else:
            # normal current/feasible value
            parameter_bounds.append((key, current_value, feasible_value))
        # add to actual_bounds
        actual_bounds.append((key, current_value, feasible_value))
    # Sort using integer conversion
    parameter_bounds.sort(key=lambda x: tuple(map(int, x[0].split("-"))))
    actual_bounds.sort(key=lambda x: tuple(map(int, x[0].split("-"))))

    # check for parents of editable_indices and remove the value from bounds
    parents_to_remove = []
    for key, low, high in parameter_bounds:
        if key not in editable_indices:
            continue
        case_commodity_id = key.split("-")[0]
        qid = key.split("-")[1]
        case_commodity = find_case_commodity_by_case_commodity_id(
            data=questions, case_commodity_id=int(case_commodity_id)
        )
        case_commodity_questions = (
            case_commodity.get("questions", []) if case_commodity else []
        )
        _, child_to_parent = flatten_questions(case_commodity_questions)
        keys = set(child_to_parent.keys())  # All dictionary keys
        values = set(child_to_parent.values())  # All dictionary values
        # Find elements that appear as both keys and values
        # meaning this value is parent question
        keys_as_values = list(keys.intersection(values))

        # Find values in left that appear in any string in right
        editable_indices_qids = [
            int(v.split("-")[1]) for v in editable_indices
        ]
        appeared_values = list(
            set(keys_as_values) & set(editable_indices_qids)
        )
        # Remove appeared_values from left list
        keys_as_values = [
            x for x in keys_as_values if x not in appeared_values
        ]

        parents_to_remove += (
            get_parents(child_to_parent, key=int(qid)) + keys_as_values
        )
    parents_to_remove = list(set(parents_to_remove))

    parameter_bounds = [
        tup
        for tup in parameter_bounds
        if int(tup[0].split("-")[1]) not in parents_to_remove
    ]
    # Sort using integer conversion
    parameter_bounds.sort(key=lambda x: tuple(map(int, x[0].split("-"))))

    actual_bounds = [
        tup
        for tup in actual_bounds
        if int(tup[0].split("-")[1]) not in parents_to_remove
    ]
    # Sort using integer conversion
    actual_bounds.sort(key=lambda x: tuple(map(int, x[0].split("-"))))

    # Populate current/feasible values
    current_values = []
    for key, current, _ in actual_bounds:
        current_values.append((key, current))
    # EOL Populate current/feasible values

    print("===========TEST====================")
    test_answers = {f"current-{key}": value for key, value in current_values}
    # sub drivers combined value
    test_income, _ = calculate_total_income(
        commodities=questions,
        segment_data={"answers": test_answers},
        mode="current",
    )
    # print(test_answers)
    print(test_income, "TEST INCOME")
    print("===============================")

    """
    # REMAP CURRENT/FEASIBLE VALUE
    # handle adjust current feasible value by check feasible < current
    # and check by cost driver feasible > current
    adjusted_current_values = []
    adjusted_feasible_values = []
    for key, current, feasible in parameter_bounds:
        # SWAP LOGIC
        # key_in_cop = any(val in key for val in cop_qids)
        # key_in_loss = any(val in key for val in loss_qids)
        # if key_in_loss and feasible > current:
        #     adjusted_current_values.append((key, feasible))
        #     adjusted_feasible_values.append((key, current))
        #     continue
        # if key_in_cop and feasible > current:
        #     adjusted_current_values.append((key, feasible))
        #     adjusted_feasible_values.append((key, current))
        #     continue
        # if not key_in_cop and feasible < current:
        #     adjusted_current_values.append((key, feasible))
        #     adjusted_feasible_values.append((key, current))
        #     continue
        # EOL SWAP LOGIC
        adjusted_current_values.append((key, current))
        adjusted_feasible_values.append((key, feasible))

    # recalculate current value
    adjusted_current_answers = {
        f"current-{key}": value for key, value in adjusted_current_values
    }
    # TODO:: fix the calculate_total_income function when we have parent and
    # sub drivers combined value
    adjusted_current_income, _ = calculate_total_income(
        commodities=questions,
        segment_data={"answers": adjusted_current_answers},
        mode="current",
    )

    # recalculate current value
    adjusted_feasible_answers = {
        f"feasible-{key}": value for key, value in adjusted_feasible_values
    }
    adjusted_feasible_income, _ = calculate_total_income(
        commodities=questions,
        segment_data={"answers": adjusted_feasible_answers},
        mode="feasible",
    )
    # EOL REMAP CURRENT/FEASIBLE VALUE
    """

    true_feasible_income = calculate_true_feasible_income(
        parameter_bounds=parameter_bounds,
        editable_indices=editable_indices,
        current_values=current_values,
        questions=questions,
    )
    max_percentage = find_max_percentage(
        true_feasible_income=true_feasible_income,
        current_income=current_income,
        feasible_income=feasible_income,
    )

    # loop optimize in percentages param
    optimization_result = []
    for i, percentage in enumerate(percentages):
        increase = i + 1

        # use adjusted income to calculate target_p
        target_p = (
            current_income + (feasible_income - current_income) * percentage
        )
        # print(percentage, target_p, "====", current_income, feasible_income)
        # print(adjusted_current_income, adjusted_feasible_income)

        # INCREASE ERROR CHECK
        if true_feasible_income < target_p:
            optimization_result.append(
                {
                    "key": increase,
                    "name": f"percentage_{increase}",
                    "value": {},
                    "percentage": percentage,
                    "increase_error": True,
                    "max_percentage": max_percentage,
                }
            )
            continue
        # EOL INCREASE ERROR CHECK

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

        # create editable_indices_result
        results = {}
        for key in editable_indices:
            # use adjusted current/feasible values here
            current = segment_answers.get(f"current-{key}", 0)
            feasible = segment_answers.get(f"feasible-{key}", 0)
            optimized = optimized_answers.get(f"optimized-{key}", 0)
            results[key] = [
                {"name": "current", "value": current or 0},
                {"name": "feasible", "value": feasible or 0},
                {"name": "optimized", "value": optimized or 0},
            ]

        value = {}
        value["target_p"] = target_p
        value["achieved_income"] = achieved_income
        value["optimization"] = results
        optimization_result.append(
            {
                "key": increase,
                "name": f"percentage_{increase}",
                "value": value,
                "percentage": percentage,
                "increase_error": False,
                "max_percentage": None,
            }
        )

    return {
        "target_income": segment.get("target", 0),
        "current_income": current_income,
        "feasible_income": feasible_income,
        "optimization_result": optimization_result,
    }

import os
import sys
import pandas as pd
import numpy as np
from db.connection import Base, engine, SessionLocal

from utils.truncator import truncatedb
from sqlalchemy.orm import Session
from models.question import Question
from models.commodity_category_question import CommodityCategoryQuestion
from seeder.question_public_key_map import PUBLIC_KEY_MAP

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MASTER_DIR = BASE_DIR + "/source/master/"
sys.path.append(BASE_DIR)


def validate_public_key_map(session):
    """
    Validation rules:
    1. Every question in DB must have a public_key mapping
    2. Every public_key must be unique
    3. No orphan mappings (IDs not in DB)
    """

    questions = session.query(Question.id).all()
    question_ids = {q.id for q in questions}
    mapped_ids = set(PUBLIC_KEY_MAP.keys())

    # 1. Missing mappings
    missing = question_ids - mapped_ids
    if missing:
        raise RuntimeError(
            f"[SEED ERROR] Missing public_key mapping for question IDs: {sorted(missing)}"  # noqa
        )

    # 2. Orphan mappings
    orphan = mapped_ids - question_ids
    if orphan:
        raise RuntimeError(
            f"[SEED ERROR] public_key_map contains unknown question IDs: {sorted(orphan)}"  # noqa
        )

    # 3. Duplicate keys
    values = list(PUBLIC_KEY_MAP.values())
    duplicates = {k for k in values if values.count(k) > 1}
    if duplicates:
        raise RuntimeError(
            f"[SEED ERROR] Duplicate public_key values detected: {duplicates}"
        )


def seeder_question(session: Session):
    truncatedb(session=session, table="commodity_category_question")

    # LOAD CSV
    data = pd.read_csv(MASTER_DIR + "question.csv")
    data.replace({np.nan: None}, inplace=True)

    # UPSERT QUESTIONS
    for _, row in data.iterrows():
        question = (
            session.query(Question)
            .filter(Question.id == int(row["id"]))
            .first()
        )

        if question:
            question.parent = row["parent"]
            question.text = row["text"]
            question.unit = row["unit"]
            question.description = row["description"]
            question.question_type = row["question_type"]
            question.default_value = row["default_value"]
        else:
            question = Question(
                id=int(row["id"]),
                parent=row["parent"],
                text=row["text"],
                unit=row["unit"],
                description=row["description"],
                question_type=row["question_type"],
                default_value=row["default_value"],
                created_by=None,
            )
            session.add(question)
        session.flush()

    # VALIDATE PUBLIC KEYS
    validate_public_key_map(session)

    # APPLY PUBLIC KEYS
    for q_id, public_key in PUBLIC_KEY_MAP.items():
        session.query(Question).filter(Question.id == q_id).update(
            {"public_key": public_key}
        )

    session.commit()
    print("[DATABASE UPDATED]: Questions + Public Keys")

    # COMMODITY CATEGORY RELATION
    commodities = pd.read_csv(MASTER_DIR + "commodities.csv")
    commodity_group = commodities[["group_id", "group_name"]]

    data = data.dropna(subset=["commodity_category"])
    data["commodity_group_names"] = data["commodity_category"].apply(
        lambda x: [i.strip() for i in x.split(",")]
    )

    group_question = data.explode("commodity_group_names")
    group_question["commodity_category"] = group_question[
        "commodity_group_names"
    ].apply(
        lambda x: commodity_group[commodity_group["group_name"] == x][
            "group_id"
        ].values[0]
    )

    for _, row in group_question.iterrows():
        session.add(
            CommodityCategoryQuestion(
                commodity_category=int(row["commodity_category"]),
                question=int(row["id"]),
            )
        )

    session.commit()
    print("[DATABASE UPDATED]: Question Category Relations")
    session.close()


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    seeder_question(session=session)

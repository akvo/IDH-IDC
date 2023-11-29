import os
import sys
import pandas as pd
import numpy as np
from db.connection import Base, engine, SessionLocal
from utils.truncator import truncatedb
from sqlalchemy.orm import Session
from models.question import Question
from models.commodity_category_question import CommodityCategoryQuestion

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MASTER_DIR = BASE_DIR + "/source/master/"
sys.path.append(BASE_DIR)


def seeder_question(session: Session):
    truncatedb(session=session, table="commodity_category_question")
    truncatedb(session=session, table="question")
    data = pd.read_csv(MASTER_DIR + "question.csv")
    data.replace({np.nan: None}, inplace=True)
    question = data[
        [
            "id",
            "parent",
            "text",
            "unit",
            "description",
            "question_type",
            "default_value",
        ]
    ]
    for index, row in question.iterrows():
        question = Question(
            id=row["id"],
            parent=row["parent"],
            text=row["text"],
            unit=row["unit"],
            description=row["description"],
            question_type=row["question_type"],
            default_value=row["default_value"],
            created_by=None,
        )
        session.add(question)
        session.commit()
        session.flush()
        session.refresh(question)
    print("[DATABASE UPDATED]: Question")

    ## Commodity Categories Questions
    commodities = pd.read_csv(MASTER_DIR + "commodities.csv")
    commodity_group = commodities[["group_id", "group_name"]]
    data = data.dropna(subset=["description"])
    data["commodity_group_names"] = data["description"].apply(
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
    group_question = group_question[["id", "commodity_category"]].rename(
        columns={"id": "question"}
    )
    group_question = group_question[["commodity_category", "question"]]
    for index, row in group_question.iterrows():
        gp = CommodityCategoryQuestion(
            commodity_category=int(row["commodity_category"]),
            question=int(row["question"]),
        )
        session.add(gp)
        session.commit()
        session.flush()
        session.refresh(gp)
    print("[DATABASE UPDATED]: Question Category")
    session.close()


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    seeder_question(session=session)

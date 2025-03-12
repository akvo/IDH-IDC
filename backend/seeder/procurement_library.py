import os
import sys
import pandas as pd
from db.connection import Base, engine, SessionLocal

from utils.truncator import truncatedb
from sqlalchemy.orm import Session
from models.procurement_library.procurement_process import ProcurementProcess
from models.procurement_library.practice import Practice
from models.procurement_library.practice_indicator import PracticeIndicator
from models.procurement_library.practice_indicator_score import PracticeIndicatorScore
from models.procurement_library.assessment_question import AssessmentQuestion
from models.procurement_library.assessment_question_option import (
    AssessmentQuestionOption,
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MASTER_DIR = BASE_DIR + "/source/master/"
sys.path.append(BASE_DIR)


def truncate_all_tables(session: Session):
    truncatedb(session=session, table="pl_assessment_question_option")
    truncatedb(session=session, table="pl_practice_indicator_score")
    truncatedb(session=session, table="pl_practice_indicator")
    truncatedb(session=session, table="pl_assessment_question")
    truncatedb(session=session, table="pl_practice")
    truncatedb(session=session, table="pl_procurement_process")


def seeder_procurement_practices(session: Session):
    try:
        df = pd.read_csv(MASTER_DIR + "procurement_practices.csv")

        non_indicator_fields = [
            "Area",
            "Procurement Processes",
            "Practice",
            "intervention_definition",
            "enabling_conditions",
            "business_rationale",
            "farmer_rationale",
            "risks_n_trade_offs",
            "intervention_impact_income",
            "intervention_impact_env",
            "source_or_evidence",
            "nan",
            "nan.1",
            "nan.2",
            "nan.3",
            "nan.4",
            "nan.5",
        ]

        indicator_fields = [
            col
            for col in df.columns
            if col not in non_indicator_fields and pd.notna(col)
        ]
        indicator_ids = {}
        for i in indicator_fields:
            name = i.lower().strip().replace(" ", "_")
            indicator = session.query(PracticeIndicator).filter_by(
                name=name
            ).first() or PracticeIndicator(name=name, label=i)
            session.add(indicator)
            session.flush()

            indicator_ids[i] = indicator.id

        procurement_practices = df.to_dict("records")
        for p in procurement_practices:
            procurement_processes = p["Procurement Processes"].split(",")

            practice = session.query(Practice).filter_by(
                label=p["Practice"]
            ).first() or Practice(
                label=p["Practice"],
                intervention_definition=p["intervention_definition"],
                enabling_conditions=p["enabling_conditions"],
                business_rationale=p["business_rationale"],
                farmer_rationale=p["farmer_rationale"],
                risks_n_trade_offs=p["risks_n_trade_offs"],
                intervention_impact_income=p["intervention_impact_income"],
                intervention_impact_env=p["intervention_impact_env"],
                source_or_evidence=p["source_or_evidence"],
            )
            session.add(practice)
            session.flush()

            for proc_label in procurement_processes:
                proc_label = proc_label.strip()
                procurement_process = session.query(ProcurementProcess).filter_by(
                    label=proc_label
                ).first() or ProcurementProcess(label=proc_label)
                session.add(procurement_process)
                session.flush()

                if procurement_process not in practice.procurement_processes:
                    practice.procurement_processes.append(procurement_process)
            session.flush()

            for icol in indicator_fields:
                score = session.query(PracticeIndicatorScore).filter_by(
                    practice_id=practice.id, indicator_id=indicator_ids[icol]
                ).first() or PracticeIndicatorScore(
                    practice_id=practice.id,
                    indicator_id=indicator_ids[icol],
                    score=p[icol],
                )
                session.add(score)

        session.commit()
    except Exception as e:
        session.rollback()
        print(f"An error occurred: {e}")
        raise


def seeder_procurement_questions(session: Session):
    try:
        df = pd.read_csv(MASTER_DIR + "procurement_questions.csv")

        selected_indicator_labels = {
            "Farmer income": "Income Impact",
            "Environment": "Environmental Impact",
            "Both": "Combined impact",
            "Informal–small Markets": "Informal-Small",
            "Informal-large Markets": "Informal-Large",
            "Formal-small Markets": "Formal-Small",
            "Formal-Large Markets": "Formal-Large",
        }
        df["Select answer"] = df["Select answer"].apply(
            lambda x: selected_indicator_labels.get(x, x)
        )

        questions = df.to_dict("records")
        for q in questions:
            name = q["Select answer"].lower().strip().replace(" ", "_")
            question = session.query(AssessmentQuestion).filter_by(
                label=q["Question"]
            ).first() or AssessmentQuestion(label=q["Question"])
            session.add(question)
            session.flush()
            indicator = session.query(PracticeIndicator).filter_by(name=name).first()
            if indicator:
                indicator.description = q["Description"]
                option_label = {v: k for k, v in selected_indicator_labels.items()}.get(
                    q["Select answer"], q["Select answer"]
                )
                option = session.query(AssessmentQuestionOption).filter_by(
                    question_id=question.id, indicator_id=indicator.id
                ).first() or AssessmentQuestionOption(
                    question_id=question.id,
                    indicator_id=indicator.id,
                    label=option_label,
                )
                session.add(option)
            else:
                print("Missing:", q["Select answer"])
        session.commit()
    except Exception as e:
        session.rollback()
        print(f"[ERROR]: {e}")
        raise


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    if not os.environ.get("TESTING"):
        print("[START]: Truncating all procurement tables...")
    truncate_all_tables(session=session)
    if not os.environ.get("TESTING"):
        print("[DONE]: All procurement tables truncated.")
    if not os.environ.get("TESTING"):
        print("[START]: Seeding procurement practices...")
    seeder_procurement_practices(session=session)
    if not os.environ.get("TESTING"):
        print("[DONE]: Procurement practices seeded.")

    if not os.environ.get("TESTING"):
        print("[START]: Seeding procurement questions...")
    seeder_procurement_questions(session=session)
    if not os.environ.get("TESTING"):
        print("[DONE]: Procurement questions seeded.")

    session.close()

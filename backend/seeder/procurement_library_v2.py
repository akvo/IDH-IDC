import os
import sys
import math
import pandas as pd
from sqlalchemy.orm import Session
from db.connection import Base, engine, SessionLocal
from utils.truncator import truncatedb

# Import models
from models.new_procurement_library.pl_models import (
    PLCategory,
    PLAttribute,
    PLPracticeIntervention,
    PLPracticeInterventionTag,
    PLIndicator,
    PLPracticeInterventionIndicatorScore,
)

# Define base paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MASTER_DIR = os.path.join(BASE_DIR, "source", "master")
sys.path.append(BASE_DIR)

# ============================================================
# Helper: Truncate all PL tables
# ============================================================
def truncate_pl_tables(session: Session):
    print("[INFO] Truncating all Procurement Library tables...")
    truncatedb(session=session, table="pl_indicator")
    truncatedb(session=session, table="pl_practice_intervention")
    truncatedb(session=session, table="pl_attribute")
    truncatedb(session=session, table="pl_category")
    print("[DONE] All PL tables truncated.")


# ============================================================
# Helper: Load CSV safely and convert NaN -> None
# ============================================================
def load_csv(file_name: str) -> pd.DataFrame:
    file_path = os.path.join(MASTER_DIR, file_name)
    if not os.path.exists(file_path):
        print(f"[WARN] File not found: {file_path}")
        return pd.DataFrame()

    df = pd.read_csv(file_path, dtype=str)  # read everything as string
    df = df.map(lambda x: x.strip() if isinstance(x, str) else x)
    df = df.map(lambda x: None if (isinstance(x, float) and math.isnan(x)) else x)

    # Normalize NaN-like values to None
    df = df.replace(
        {
            "NaN": None,
            "nan": None,
            "NAN": None,
            "": None,
            "None": None,
            "null": None,
            "NULL": None,
        }
    )
    return df


# ============================================================
# Seeder: Category
# ============================================================
def seed_categories(session: Session):
    df = load_csv("pl_category.csv")
    if df.empty:
        return

    for _, row in df.iterrows():
        category = PLCategory(
            id=int(row["id"]),
            name=row["name"],
            description=row.get("description"),
        )
        session.add(category)
    session.commit()
    print(f"[OK] Seeded {len(df)} categories.")


# ============================================================
# Seeder: Attribute
# ============================================================
def seed_attributes(session: Session):
    df = load_csv("pl_attribute.csv")
    if df.empty:
        return

    for _, row in df.iterrows():
        attr = PLAttribute(
            id=int(row["id"]),
            category_id=int(row["category_id"]) if row.get("category_id") else None,
            label=row["label"],
            description=row.get("description"),
        )
        session.add(attr)
    session.commit()
    print(f"[OK] Seeded {len(df)} attributes.")


# ============================================================
# Seeder: Practice Interventions
# ============================================================
def seed_practices(session: Session):
    df = load_csv("pl_practice_intervention.csv")
    if df.empty:
        return

    for _, row in df.iterrows():
        practice = PLPracticeIntervention(
            id=int(row["id"]),
            label=row["label"],
            intervention_definition=row.get("intervention_definition"),
            enabling_conditions=row.get("enabling_conditions"),
            business_rationale=row.get("business_rationale"),
            farmer_rationale=row.get("farmer_rationale"),
            risks_n_trade_offs=row.get("risks_n_trade_offs"),
            intervention_impact_income=row.get("intervention_impact_income"),
            intervention_impact_env=row.get("intervention_impact_env"),
            source_or_evidence=row.get("source_or_evidence"),
        )
        session.add(practice)
    session.commit()
    print(f"[OK] Seeded {len(df)} practice interventions.")


# ============================================================
# Seeder: Practice Tags
# ============================================================
def seed_practice_tags(session: Session):
    df = load_csv("pl_practice_intervention_tag.csv")
    if df.empty:
        return

    for _, row in df.iterrows():
        tag = PLPracticeInterventionTag(
            practice_intervention_id=int(row["practice_intervention_id"]),
            attribute_id=int(row["attribute_id"]),
        )
        session.add(tag)
    session.commit()
    print(f"[OK] Seeded {len(df)} practice tags.")


# ============================================================
# Seeder: Indicators
# ============================================================
def seed_indicators(session: Session):
    df = load_csv("pl_indicator.csv")
    if df.empty:
        return

    for _, row in df.iterrows():
        indicator = PLIndicator(
            id=int(row["id"]),
            name=row["name"],
            label=row["label"],
            description=row.get("description"),
        )
        session.add(indicator)
    session.commit()
    print(f"[OK] Seeded {len(df)} indicators.")


# ============================================================
# Seeder: Indicator Scores
# ============================================================
def seed_scores(session: Session):
    df = load_csv("pl_practice_indicator_score.csv")
    if df.empty:
        return

    for _, row in df.iterrows():
        score = PLPracticeInterventionIndicatorScore(
            id=int(row["id"]),
            practice_intervention_id=int(row["practice_intervention_id"]),
            indicator_id=int(row["indicator_id"]),
            score=float(row["score"]) if row.get("score") is not None else None,
        )
        session.add(score)
    session.commit()
    print(f"[OK] Seeded {len(df)} indicator scores.")


# ============================================================
# Main Seeder Runner
# ============================================================
if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    try:
        truncate_pl_tables(session)

        seed_categories(session)
        seed_attributes(session)
        seed_practices(session)
        seed_practice_tags(session)
        seed_indicators(session)
        seed_scores(session)

        print("\n✅ [DONE] Procurement Library seeding completed successfully.")
    except Exception as e:
        session.rollback()
        print(f"\n❌ [ERROR] Seeding failed: {e}")
        raise
    finally:
        session.close()

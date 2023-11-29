import os
import sys

from datetime import datetime
from sqlalchemy.orm import Session
from db.connection import Base, SessionLocal, engine

from models.user_business_unit import UserBusinessUnit
from models.case import Case, LivingIncomeStudyEnum


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

Base.metadata.create_all(bind=engine)
session = SessionLocal()
current_datetime = datetime.now()


def seed_fake_case(session: Session):
    # create cases
    for i in range(3):
        # Get a random regular/internal user (user with BU)
        internal_user = session.query(UserBusinessUnit).first()
        if not internal_user:
            print("No Regular/Internal user found")

        # private case
        private_case = Case(
            name=f"Example Private Fake Case {i}",
            description="Lorem ipsum...",
            date=current_datetime.date(),
            year=current_datetime.year,
            country=2,
            focus_commodity=2,
            currency="USD",
            area_size_unit="acre",
            volume_measurement_unit="liters",
            cost_of_production_unit="Per-area",
            reporting_period="Per-year",
            segmentation=0,
            living_income_study=LivingIncomeStudyEnum.better_income.value,
            multiple_commodities=0,
            private=1,
            created_by=internal_user.user,
            logo=None,
        )
        session.add(private_case)
        session.commit()
        session.flush()
        session.refresh(private_case)

        # public case
        public_case = Case(
            name=f"Example Public Fake Case {i}",
            description="Lorem ipsum...",
            date=current_datetime.date(),
            year=current_datetime.year,
            country=2,
            focus_commodity=2,
            currency="USD",
            area_size_unit="acre",
            volume_measurement_unit="liters",
            cost_of_production_unit="Per-area",
            reporting_period="Per-year",
            segmentation=0,
            living_income_study=LivingIncomeStudyEnum.better_income.value,
            multiple_commodities=0,
            private=0,
            created_by=internal_user.user,
            logo=None,
        )
        session.add(public_case)
        session.commit()
        session.flush()
        session.refresh(public_case)
    session.close()


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    seed_fake_case(session=session)

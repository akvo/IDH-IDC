import os
import sys

from faker import Faker
from sqlalchemy.orm import Session
from db.connection import Base, SessionLocal, engine
from middleware import get_password_hash

from models.user import User, UserRole
from models.business_unit import BusinessUnit
from models.user_business_unit import UserBusinessUnit, UserBusinessUnitRole
from models.organisation import Organisation


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

Base.metadata.create_all(bind=engine)
session = SessionLocal()
fake = Faker()


def seed_fake_user(session: Session):
    # Get organisation
    org = session.query(Organisation).first()

    # Get business unit
    business_units = session.query(BusinessUnit).limit(3).all()

    for bu in business_units:
        # Seed Business Unit Admin
        bu_admin = User(
            fullname=fake.name(),
            email=fake.email(),
            password=get_password_hash("password"),
            organisation=org.id,
            is_active=1,
            all_cases=1,
            role=UserRole.admin,
        )
        session.add(bu_admin)
        session.commit()
        session.flush()
        session.refresh(bu_admin)
        # add business unit
        bu = UserBusinessUnit(
            business_unit=bu.id, role=UserBusinessUnitRole.admin, user=bu_admin.id
        )
        session.add(bu)
        session.commit()
        session.flush()
        session.refresh(bu)

    # Seed Regular/Internal User (User with BU)
    for i in range(2):
        for bu in business_units:
            reg_user = User(
                fullname=fake.name(),
                email=fake.email(),
                password=get_password_hash("password"),
                organisation=org.id,
                is_active=1,
                all_cases=1,
                role=UserRole.user,
            )
            session.add(reg_user)
            session.commit()
            session.flush()
            session.refresh(reg_user)
            # add business unit
            bu = UserBusinessUnit(
                business_unit=bu.id, role=UserBusinessUnitRole.member, user=reg_user.id
            )
            session.add(bu)
            session.commit()
            session.flush()
            session.refresh(bu)

    # Seed External User (User without BU)
    for i in range(5):
        reg_user = User(
            fullname=fake.name(),
            email=fake.email(),
            password=get_password_hash("password"),
            organisation=org.id,
            is_active=1,
            all_cases=0,
            role=UserRole.user,
        )
        session.add(reg_user)
        session.commit()
        session.flush()
        session.refresh(reg_user)
    session.close()


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    seed_fake_user(session=session)

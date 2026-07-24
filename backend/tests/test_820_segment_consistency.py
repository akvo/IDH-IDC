import sys
import gzip
import json
import pytest
from datetime import date
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy.orm import Session
from tests.test_000_main import Acc
from models.visualization import VisualizationTab
from models.case import Case, LivingIncomeStudyEnum
from models.segment import Segment
from models.user import User, UserRole
from models.country import Country
from models.commodity import Commodity
from models.organisation import Organisation

sys.path.append("..")

admin_account = Acc(email="super_admin@akvo.org", token=None)


class TestSegmentConsistencyCaseList:
    @pytest.mark.asyncio
    async def test_case_list_reconciles_stale_segments(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # Create test records using SQL Session to guarantee isolation
        org = session.query(Organisation).first()
        if not org:
            org = Organisation(id=None, name="Akvo")
            session.add(org)
            session.commit()

        user = session.query(User).filter_by(email=admin_account.email).first()
        if not user:
            user = User(
                organisation=org.id,
                email=admin_account.email,
                fullname="Super Admin",
                role=UserRole.super_admin,
                is_active=1,
            )
            session.add(user)
            session.commit()

        country = session.query(Country).first()
        if not country:
            country = Country(name="Indonesia")
            session.add(country)
            session.commit()

        commodity = session.query(Commodity).first()
        if not commodity:
            commodity = Commodity(name="Coffee")
            session.add(commodity)
            session.commit()

        # Insert dummy case
        test_case_db = Case(
            name="Bali Test Case Consistency",
            date=date(2023, 10, 3),
            year=2023,
            country=country.id,
            focus_commodity=commodity.id,
            currency="USD",
            area_size_unit="hectare",
            volume_measurement_unit="liters",
            cost_of_production_unit="Per-area",
            segmentation=0,
            reporting_period="Per-season",
            living_income_study=LivingIncomeStudyEnum.better_income.value,
            description="Testing segment consistency",
            multiple_commodities=0,
            logo=None,
            created_by=user.id,
        )
        session.add(test_case_db)
        session.commit()

        # Insert dummy segment
        test_segment_db = Segment(
            name="Live Segment A",
            case=test_case_db.id,
            target=1000.0,
            adult=2,
            child=3,
        )
        session.add(test_segment_db)
        session.commit()

        # 1. Create a visualization config containing
        # scenarioData and scenarioOutcomeDataSource
        # Referencing segment test_segment_db.id and a non-existent
        # segment 999 (ghost segment)
        payload = [
            {
                "case": test_case_db.id,
                "tab": VisualizationTab.scenario_modeling.value,
                "config": {
                    "scenarioData": [
                        {
                            "key": 1,
                            "name": "Scenario 1",
                            "scenarioValues": [
                                {
                                    "segmentId": test_segment_db.id,
                                    "name": "Stale Segment Name A",
                                    "selectedDrivers": [],
                                    "allNewValues": {},
                                    "currentSegmentValue": {},
                                    "updatedSegmentScenarioValue": {},
                                    "updatedSegment": {},
                                },
                                {
                                    "segmentId": 999,
                                    "name": "Ghost Segment",
                                    "selectedDrivers": [],
                                    "allNewValues": {},
                                    "currentSegmentValue": {},
                                    "updatedSegmentScenarioValue": {},
                                    "updatedSegment": {},
                                },
                            ],
                        }
                    ],
                    "scenarioOutcomeDataSource": [
                        {
                            "segmentId": test_segment_db.id,
                            "segmentName": "Stale Segment Name A",
                            "scenarioOutcome": [],
                        },
                        {
                            "segmentId": 999,
                            "segmentName": "Ghost Segment",
                            "scenarioOutcome": [],
                        },
                    ],
                },
            }
        ]

        compressed_payload = gzip.compress(json.dumps(payload).encode("utf-8"))

        # Save the visualization
        save_res = await client.post(
            app.url_path_for("visualization:create_or_update"),
            headers={
                "Authorization": f"Bearer {admin_account.token}",
                "Content-Encoding": "gzip",
                "Accept-Encoding": "gzip",
            },
            content=compressed_payload,
        )
        assert save_res.status_code == 200

        # 2. Fetch the case list
        list_res = await client.get(
            app.url_path_for("case:get_all"),
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert list_res.status_code == 200
        cases = list_res.json()["data"]

        # Find our test case
        test_case_res = next(
            (c for c in cases if c["id"] == test_case_db.id), None
        )
        assert test_case_res is not None

        # Verify that the ghost segment 999 has been removed from
        # outcome data source
        outcome_ds = test_case_res["scenario_outcome_data_source"]
        assert len(outcome_ds) == 1
        assert outcome_ds[0]["segmentId"] == test_segment_db.id
        # Also verify the segment name was synced with the
        # live database segment name
        assert outcome_ds[0]["segmentName"] == "Live Segment A"

        # Verify that the scenario_data has also purged segment 999
        cleaned_scenarios = test_case_res["scenario_data"]
        assert len(cleaned_scenarios) == 1
        assert "scenarioValues" not in cleaned_scenarios[0]

import pytest
import sys
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy.orm import Session
from sqlalchemy import and_
from models.procurement_library.practice_indicator import PracticeIndicator
from models.procurement_library.practice_indicator_score import PracticeIndicatorScore
from models.procurement_library.procurement_process import ProcurementProcess
from models.procurement_library.practice import ImpactArea, Practice

sys.path.append("..")


class TestPracticeRoute:
    @pytest.mark.asyncio
    async def test_get_all_practices(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        res = await client.get(
            app.url_path_for("pl:get_all_practices"),
        )
        assert res.status_code == 200
        res = res.json()
        assert res["current"] == 1
        assert res["total"] == 51
        assert res["total_page"] == 6
        assert len(res["data"]) == 10
        assert list(res["data"][0].keys()) == [
            "id",
            "procurement_process_label",
            "label",
            "is_environmental",
            "is_income",
            "created_at",
        ]

    @pytest.mark.asyncio
    async def test_get_all_practices_with_search(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        search = "soil"
        total_results = (
            session.query(Practice)
            .filter(
                Practice.label.ilike(f"%{search}%")
                | Practice.intervention_definition.ilike(f"%{search}%")
                | Practice.enabling_conditions.ilike(f"%{search}%")
                | Practice.business_rationale.ilike(f"%{search}%")
                | Practice.farmer_rationale.ilike(f"%{search}%")
                | Practice.risks_n_trade_offs.ilike(f"%{search}%")
            )
            .count()
        )
        res = await client.get(
            app.url_path_for("pl:get_all_practices"),
            params={"search": search},
        )
        assert res.status_code == 200
        res = res.json()
        assert res["total"] == total_results

    @pytest.mark.asyncio
    async def test_get_all_practices_with_procurement_process_ids(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        procs = session.query(ProcurementProcess).limit(2).all()
        total_results = (
            session.query(Practice)
            .filter(Practice.procurement_process_id.in_([proc.id for proc in procs]))
            .count()
        )
        procurement_process_ids = ",".join(str(proc.id) for proc in procs)
        res = await client.get(
            app.url_path_for("pl:get_all_practices"),
            params={"procurement_process_ids": procurement_process_ids},
        )
        assert res.status_code == 200
        res = res.json()
        assert res["total"] == total_results
        assert all(
            any(proc.label in practice["procurement_process_label"] for proc in procs)
            for practice in res["data"]
        )

    @pytest.mark.asyncio
    async def test_get_all_practices_with_impact_area(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        impact_area = ImpactArea.income
        indicator = (
            session.query(PracticeIndicator).filter_by(name=impact_area.value).first()
        )
        indicator_id = indicator.id
        total_results = (
            session.query(Practice)
            .filter(
                Practice.scores.any(
                    and_(
                        PracticeIndicatorScore.indicator_id == indicator_id,
                        PracticeIndicatorScore.score > 3,
                    )
                )
            )
            .count()
        )
        res = await client.get(
            app.url_path_for("pl:get_all_practices"),
            params={"impact_area": impact_area.value},
        )
        assert res.status_code == 200
        res = res.json()
        assert res["total"] == total_results
        assert all(practice["is_income"] for practice in res["data"])

    @pytest.mark.asyncio
    async def test_get_practice_by_id(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        practice_id = 1
        res = await client.get(
            app.url_path_for("pl:get_practice_by_id", practice_id=practice_id)
        )
        assert res.status_code == 200
        res = res.json()
        assert res["id"] == practice_id
        assert list(res.keys()) == [
            "id",
            "procurement_process_label",
            "label",
            "intervention_definition",
            "enabling_conditions",
            "business_rationale",
            "farmer_rationale",
            "risks_n_trade_offs",
            "intervention_impact_income",
            "intervention_impact_env",
            "source_or_evidence",
            "created_at",
        ]

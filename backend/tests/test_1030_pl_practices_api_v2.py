import pytest
import sys
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy.orm import Session

from models.procurement_library_v2.pl_models import (
    PLPracticeIntervention,
    PLAttribute,
    PLIndicator,
)

sys.path.append("..")


class TestProcurementLibraryV2PracticeRoutes:
    # ============================================================
    # /plv2/practices — GET all practices
    # ============================================================
    @pytest.mark.asyncio
    async def test_get_all_practices(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        res = await client.get(app.url_path_for("plv2:get_all_practices"))
        assert res.status_code == 200
        res_json = res.json()

        assert "current" in res_json
        assert "total" in res_json
        assert "total_page" in res_json
        assert "data" in res_json
        assert isinstance(res_json["data"], list)

        if res_json["total"] > 0:
            practice = res_json["data"][0]
            expected_keys = {
                "id",
                "label",
                "tags",
                "is_environmental",
                "is_income",
                "scores",
                "created_at",
                "updated_at",
            }
            assert expected_keys.issubset(
                practice.keys()
            ), "Response missing required fields"

    # ============================================================
    # /plv2/practices?search=...
    # ============================================================
    @pytest.mark.asyncio
    async def test_get_all_practices_with_search(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        search = "soil"
        res = await client.get(
            app.url_path_for("plv2:get_all_practices"),
            params={"search": search},
        )
        assert res.status_code == 200
        res_json = res.json()
        assert res_json["total"] > 0

    # ============================================================
    # /plv2/practices?impact_area=...
    # ============================================================
    @pytest.mark.asyncio
    async def test_get_practices_with_impact_area_filter(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        # Try with one of the known impact areas (income or environmental)
        indicator = (
            session.query(PLIndicator)
            .filter(
                PLIndicator.name.in_(["income_impact", "environmental_impact"])
            )
            .first()
        )
        if not indicator:
            pytest.skip("No impact indicator found in DB")

        res = await client.get(
            app.url_path_for("plv2:get_all_practices"),
            params={"impact_area": indicator.name},
        )
        assert res.status_code == 200
        res_json = res.json()

        assert "data" in res_json
        assert isinstance(res_json["data"], list)

        # Optionally check that the filter works
        if res_json["data"]:
            assert any(
                p["is_environmental"] or p["is_income"]
                for p in res_json["data"]
            ), "Expected impact area practices but found none"

    # ============================================================
    # /plv2/practices?sourcing_strategy_cycle=...
    # ============================================================
    @pytest.mark.asyncio
    async def test_get_practices_with_sourcing_strategy_cycle_filter(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        attr = session.query(PLAttribute).first()
        if not attr:
            pytest.skip("No attribute found in DB")

        res = await client.get(
            app.url_path_for("plv2:get_all_practices"),
            params={"sourcing_strategy_cycle": attr.id},
        )
        assert res.status_code == 200
        res_json = res.json()
        assert "data" in res_json
        assert isinstance(res_json["data"], list)

    # ============================================================
    # /plv2/practices?procurement_principles=...
    # ============================================================
    @pytest.mark.asyncio
    async def test_get_practices_with_procurement_principles_filter(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        attr = session.query(PLAttribute).first()
        if not attr:
            pytest.skip("No attribute found in DB")

        res = await client.get(
            app.url_path_for("plv2:get_all_practices"),
            params={"procurement_principles": attr.id},
        )
        assert res.status_code == 200
        res_json = res.json()
        assert "data" in res_json
        assert isinstance(res_json["data"], list)

    # ============================================================
    # Combined filters (impact_area + attribute filters)
    # ============================================================
    @pytest.mark.asyncio
    async def test_get_practices_with_combined_filters(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        indicator = (
            session.query(PLIndicator)
            .filter(
                PLIndicator.name.in_(["income_impact", "environmental_impact"])
            )
            .first()
        )
        attr = session.query(PLAttribute).first()

        if not (indicator and attr):
            pytest.skip("Missing data for combined filter test")

        res = await client.get(
            app.url_path_for("plv2:get_all_practices"),
            params={
                "impact_area": indicator.name,
                "sourcing_strategy_cycle": attr.id,
                "procurement_principles": attr.id,
            },
        )
        assert res.status_code == 200
        res_json = res.json()
        assert "data" in res_json
        assert isinstance(res_json["data"], list)
        assert "total" in res_json

    # ============================================================
    # /plv2/practice/{id}
    # ============================================================
    @pytest.mark.asyncio
    async def test_get_practice_by_id(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        practice = session.query(PLPracticeIntervention).first()
        assert practice, "No practice found in DB for test"
        res = await client.get(
            app.url_path_for(
                "plv2:get_detail_by_practice_id", practice_id=practice.id
            )
        )
        assert res.status_code == 200
        res_json = res.json()

        expected_keys = {
            "id",
            "label",
            "intervention_definition",
            "enabling_conditions",
            "business_rationale",
            "farmer_rationale",
            "risks_n_trade_offs",
            "intervention_impact_income",
            "intervention_impact_env",
            "source_or_evidence",
            "is_environmental",
            "is_income",
            "created_at",
            "tags",
            "scores",
        }
        assert expected_keys.issubset(
            res_json.keys()
        ), "Detail response missing fields"
        assert res_json["id"] == practice.id

    # ============================================================
    # /plv2/practice/{id} — not found
    # ============================================================
    @pytest.mark.asyncio
    async def test_get_practice_by_id_not_found(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        invalid_id = 999999
        res = await client.get(
            app.url_path_for(
                "plv2:get_detail_by_practice_id", practice_id=invalid_id
            )
        )
        assert res.status_code == 404
        assert res.json() == {"detail": "Practice not found"}

        # ============================================================

    # /plv2/practices-by-attribute-ids
    # ============================================================
    @pytest.mark.asyncio
    async def test_get_practices_by_attribute_ids(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        # Get at least one or more attributes from the DB
        attributes = session.query(PLAttribute).limit(2).all()
        if not attributes:
            pytest.skip("No attributes found in DB")

        attribute_ids = [attr.id for attr in attributes]

        res = await client.get(
            app.url_path_for("plv2:get_practices_by_attribute_ids"),
            params={"attribute_ids": attribute_ids, "limit": 3},
        )

        assert (
            res.status_code == 200
        ), f"Unexpected status code: {res.status_code}"
        res_json = res.json()

        # Expect a list of practices
        assert isinstance(res_json, list), "Response should be a list"
        if res_json:
            practice = res_json[0]
            expected_keys = {
                "id",
                "label",
                "is_environmental",
                "is_income",
                "tags",
            }
            assert expected_keys.issubset(
                practice.keys()
            ), "Missing keys in practice response"
            assert isinstance(practice["tags"], list), "Tags should be a list"

    # ============================================================
    # /plv2/practices-by-attribute-ids — empty result
    # ============================================================
    @pytest.mark.asyncio
    async def test_get_practices_by_attribute_ids_no_result(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        # Use random non-existing attribute IDs
        fake_ids = [999999, 888888]

        res = await client.get(
            app.url_path_for("plv2:get_practices_by_attribute_ids"),
            params={"attribute_ids": fake_ids, "limit": 3},
        )

        assert res.status_code == 200
        res_json = res.json()
        assert isinstance(res_json, list)
        assert (
            len(res_json) == 0
        ), "Expected empty list when no practices match"

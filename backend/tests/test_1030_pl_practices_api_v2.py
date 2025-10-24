import pytest
import sys
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy.orm import Session

from models.procurement_library_v2.pl_models import (
    PLPracticeIntervention,
    PLAttribute,
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

        # Pagination checks
        assert res_json["current"] == 1
        assert len(res_json["data"]) <= 10

        # Validate data fields
        practice = res_json["data"][0]
        expected_keys = {
            "id",
            "label",
            "procurement_processes",
            "is_environmental",
            "is_income",
            "scores",
            "created_at",
            "updated_at",
        }
        assert expected_keys.issubset(practice.keys()), "Response missing required fields"

    # ============================================================
    # /plv2/practices?search=... — search filter
    # ============================================================
    @pytest.mark.asyncio
    async def test_get_all_practices_with_search(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        search = "soil"
        total_results = (
            session.query(PLPracticeIntervention)
            .filter(PLPracticeIntervention.label.ilike(f"%{search}%"))
            .count()
        )

        res = await client.get(
            app.url_path_for("plv2:get_all_practices"), params={"search": search}
        )
        assert res.status_code == 200
        res_json = res.json()
        assert res_json["total"] == total_results

    # ============================================================
    # /plv2/practice/{id} — GET detail
    # ============================================================
    @pytest.mark.asyncio
    async def test_get_practice_by_id(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        practice = session.query(PLPracticeIntervention).first()
        assert practice, "No practice found in DB for test"
        res = await client.get(
            app.url_path_for("plv2:get_detail_by_practice_id", practice_id=practice.id)
        )
        assert res.status_code == 200
        res_json = res.json()

        expected_keys = {
            'id', 'label', 'procurement_processes', 'is_environmental', 'is_income', 'scores', 'created_at', 'updated_at'
        }
        assert expected_keys.issubset(res_json.keys()), "Detail response missing fields"
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
            app.url_path_for("plv2:get_detail_by_practice_id", practice_id=invalid_id)
        )
        assert res.status_code == 404
        assert res.json() == {"detail": "Practice not found"}

    # ============================================================
    # /plv2/practices-by-attribute/{attribute_id}
    # ============================================================
    @pytest.mark.asyncio
    async def test_get_practices_by_attribute_id(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        # pick an existing attribute that is linked to practices
        attribute = (
            session.query(PLAttribute)
            .join(PLAttribute.tags)
            .first()
        )
        assert attribute is not None, "No attribute found with linked practices"

        res = await client.get(
            app.url_path_for("plv2:get_practices_by_attribute_id", attribute_id=attribute.id),
            params={"page": 1, "limit": 5},
        )
        assert res.status_code == 200
        res_json = res.json()

        assert "current" in res_json
        assert "total" in res_json
        assert "total_page" in res_json
        assert "data" in res_json

        if res_json["total"] > 0:
            practice = res_json["data"][0]
            assert "id" in practice
            assert "label" in practice
            assert "is_environmental" in practice
            assert "is_income" in practice
            assert "tags" in practice

    @pytest.mark.asyncio
    async def test_get_practices_by_attribute_with_search(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        attribute = (
            session.query(PLAttribute)
            .join(PLAttribute.tags)
            .first()
        )
        assert attribute is not None, "No attribute found for search test"

        search = "water"
        res = await client.get(
            app.url_path_for("plv2:get_practices_by_attribute_id", attribute_id=attribute.id),
            params={"search": search},
        )
        assert res.status_code == 200
        res_json = res.json()
        assert "data" in res_json
        assert isinstance(res_json["data"], list)

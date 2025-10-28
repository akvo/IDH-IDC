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

        assert res_json["current"] == 1
        assert len(res_json["data"]) <= 10

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
    # /plv2/practices?search=...
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
    # /plv2/practice/{id}
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

    # ============================================================
    # /plv2/practices-by-attribute/{attribute_id}?attribute_ids=...
    # ============================================================
    @pytest.mark.asyncio
    async def test_get_practices_by_attribute_with_extra_filters(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        res = await client.get(
            app.url_path_for("plv2:get_practices_by_attribute_id", attribute_id=1),
            params={"attribute_ids": [1]},
        )
        assert res.status_code == 200
        res_json = res.json()
        assert "data" in res_json
        assert isinstance(res_json["data"], list)

    @pytest.mark.asyncio
    async def test_get_practices_by_attribute_with_multiple_extra_ids(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        # collect multiple attribute IDs
        attributes = (
            session.query(PLAttribute)
            .join(PLAttribute.tags)
            .limit(3)
            .all()
        )
        assert len(attributes) >= 2, "Need at least 2 attributes with linked practices"

        base_attr = attributes[0]
        extra_ids = [a.id for a in attributes]

        res = await client.get(
            app.url_path_for("plv2:get_practices_by_attribute_id", attribute_id=base_attr.id),
            params={"attribute_ids": extra_ids},
        )
        assert res.status_code == 200
        res_json = res.json()
        assert "data" in res_json
        assert isinstance(res_json["data"], list)

    @pytest.mark.asyncio
    async def test_get_practices_by_attribute_with_no_results(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        # pick attribute_id that doesn't link to any practices
        unused_attr = (
            session.query(PLAttribute)
            .outerjoin(PLAttribute.tags)
            .filter(PLAttribute.tags is None)
            .first()
        )
        if not unused_attr:
            pytest.skip("No unused attribute found for empty result test")

        res = await client.get(
            app.url_path_for("plv2:get_practices_by_attribute_id", attribute_id=unused_attr.id)
        )
        assert res.status_code == 200
        res_json = res.json()
        assert res_json["total"] == 0
        assert res_json["data"] == []

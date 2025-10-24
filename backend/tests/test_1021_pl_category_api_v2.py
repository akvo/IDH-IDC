import pytest
import sys
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy.orm import Session

from models.procurement_library_v2.pl_models import PLCategory

sys.path.append("..")


class TestProcurementLibraryV2CategoryRoutes:
    # ============================================================
    # /plv2/category/attributes — GET all categories with attributes
    # ============================================================
    @pytest.mark.asyncio
    async def test_get_categories_with_attributes(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        # Fetch data directly from DB for comparison
        db_categories = session.query(PLCategory).all()
        total_categories = len(db_categories)

        res = await client.get(
            app.url_path_for("plv2:get_cattegory_with_attributes"))
        assert res.status_code == 200

        res_json = res.json()
        assert isinstance(res_json, list), "Response should be a list"
        assert len(res_json) == total_categories

        # Validate one example structure
        if total_categories > 0:
            category = res_json[0]
            expected_category_keys = {
                "id",
                "name",
                "attributes",
            }
            assert expected_category_keys.issubset(
                category.keys()
            ), "Category response missing expected fields"

            # Check nested attributes
            attributes = category["attributes"]
            assert isinstance(attributes, list)
            if attributes:
                attr = attributes[0]
                expected_attr_keys = {
                    "id",
                    "label",
                }
                assert expected_attr_keys.issubset(
                    attr.keys()
                ), "Attribute response missing expected fields"

    # ============================================================
    # /plv2/category/attributes — Ensure attributes belong to the right category
    # ============================================================
    @pytest.mark.asyncio
    async def test_category_attributes_match_db(
        self, app: FastAPI, session: Session, client: AsyncClient
    ):
        # Fetch one category from DB that has attributes
        category = (
            session.query(PLCategory)
            .join(PLCategory.attributes)
            .first()
        )
        if not category:
            pytest.skip("No category with attributes found in DB")

        res = await client.get(
            app.url_path_for("plv2:get_cattegory_with_attributes"))
        assert res.status_code == 200

        res_json = res.json()
        found_cat = next((c for c in res_json if c["id"] == category.id), None)
        assert found_cat is not None, "Category not found in API response"

        db_attr_ids = {a.id for a in category.attributes}
        api_attr_ids = {a["id"] for a in found_cat["attributes"]}
        assert db_attr_ids == api_attr_ids, "Mismatch between DB and API attributes"

import sys
import pytest
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy.orm import Session
from tests.test_000_main import Acc

sys.path.append("..")

non_admin_account = Acc(email="support@akvo.org", token=None)
admin_account = Acc(email="super_admin@akvo.org", token=None)


class TestReferenceRoute:
    @pytest.mark.asyncio
    async def test_get_all_reference_data_return_404(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # without cred
        res = await client.get(app.url_path_for("tag:get_all"))
        assert res.status_code == 403
        res = await client.get(
            app.url_path_for("reference_data:get_all"),
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code == 404

    @pytest.mark.asyncio
    async def test_create_reference_data(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        payload = {
            "country": 1,
            "commodity": 1,
            "region": "Sample Region",
            "currency": "USD",
            "year": "2023",
            "source": "Sample Source",
            "link": "http://example.com",
            "notes": "Sample Notes",
            "confidence_level": "High",
            "range": "Sample Range",
            "area": "100.5",
            "volume": "50.3",
            "price": "10.2",
            "cost_of_production": "30.1",
            "diversified_income": "15.5",
            "area_size_unit": "acres",
            "volume_measurement_unit": "liters",
            "cost_of_production_unit": "USD / acres",
            "diversified_income_unit": "USD",
            "price_unit": "USD / liters",
            "type_area": "Sample Type Area",
            "type_volume": "Sample Type Volume",
            "type_price": "Sample Type Price",
            "type_cost_of_production": "Sample Type CoP",
            "type_diversified_income": "Sample Type DI",
        }
        # without cred
        res = await client.post(
            app.url_path_for("reference_data:create"),
            json=payload,
        )
        assert res.status_code == 403
        # with normal user cred
        res = await client.post(
            app.url_path_for("reference_data:create"),
            headers={"Authorization": f"Bearer {non_admin_account.token}"},
            json=payload,
        )
        assert res.status_code == 403
        # with admin user cred
        res = await client.post(
            app.url_path_for("reference_data:create"),
            headers={"Authorization": f"Bearer {admin_account.token}"},
            json=payload,
        )
        assert res.status_code == 200
        res = res.json()
        assert res == {
            "id": 1,
            "country": 1,
            "commodity": 1,
            "region": "Sample Region",
            "currency": "USD",
            "year": "2023",
            "source": "Sample Source",
            "link": "http://example.com",
            "notes": "Sample Notes",
            "confidence_level": "High",
            "range": "Sample Range",
            "area": "100.5",
            "volume": "50.3",
            "price": "10.2",
            "cost_of_production": "30.1",
            "diversified_income": "15.5",
            "area_size_unit": "acres",
            "volume_measurement_unit": "liters",
            "cost_of_production_unit": "USD / acres",
            "diversified_income_unit": "USD",
            "price_unit": "USD / liters",
            "type_area": "Sample Type Area",
            "type_volume": "Sample Type Volume",
            "type_price": "Sample Type Price",
            "type_cost_of_production": "Sample Type CoP",
            "type_diversified_income": "Sample Type DI",
            "visible_to_external_user": False,
        }

        # add second data
        payload = {
            "country": 1,
            "commodity": 1,
            "region": "Sample Region",
            "currency": "USD",
            "year": "2022",
            "source": "Sample Source 2",
            "link": "http://example.com",
            "notes": "Sample Notes",
            "confidence_level": "Low",
            "range": "Sample Range",
            "area": None,
            "volume": None,
            "price": None,
            "cost_of_production": None,
            "diversified_income": None,
            "area_size_unit": "acres",
            "volume_measurement_unit": "liters",
            "cost_of_production_unit": "USD / acres",
            "diversified_income_unit": "USD",
            "price_unit": "USD / liters",
            "type_area": None,
            "type_volume": None,
            "type_price": None,
            "type_cost_of_production": None,
            "type_diversified_income": None,
            "visible_to_external_user": True,
        }
        res = await client.post(
            app.url_path_for("reference_data:create"),
            headers={"Authorization": f"Bearer {admin_account.token}"},
            json=payload,
        )
        assert res.status_code == 200
        res = res.json()
        assert res["id"] == 2
        assert res["area"] is None

    @pytest.mark.asyncio
    async def test_get_all_reference_data(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # with normal user cred
        res = await client.get(
            app.url_path_for("reference_data:get_all"),
            headers={"Authorization": f"Bearer {non_admin_account.token}"},
        )
        assert res.status_code == 200
        # with admin user cred
        res = await client.get(
            app.url_path_for("reference_data:get_all"),
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code == 200
        res = res.json()
        assert res == {
            "current": 1,
            "data": [
                {
                    "id": 2,
                    "country": "Indonesia",
                    "commodity": "Wheat",
                    "source": "Sample Source 2",
                    "link": "http://example.com",
                    "confidence_level": "Low",
                },
                {
                    "id": 1,
                    "country": "Indonesia",
                    "commodity": "Wheat",
                    "source": "Sample Source",
                    "link": "http://example.com",
                    "confidence_level": "High",
                },
            ],
            "total": 2,
            "total_page": 1,
        }

        # Filter test
        res = await client.get(
            app.url_path_for("reference_data:get_all")
            + "?country=1&source=Simple Source",
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code in [200, 404]

        # Pagination test
        res = await client.get(
            app.url_path_for("reference_data:get_all") + "?page=2&limit=1",
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code in [200, 404]

    @pytest.mark.asyncio
    async def test_get_reference_data_count_by_country(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # with normal user cred
        res = await client.get(
            app.url_path_for("reference_data:count_by_country"),
            headers={"Authorization": f"Bearer {non_admin_account.token}"},
        )
        assert res.status_code == 200
        # with admin user cred
        res = await client.get(
            app.url_path_for("reference_data:count_by_country"),
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code == 200
        res = res.json()
        assert res == [{"COUNTRY": "Indonesia", "count": 2, "country_id": 1}]

        # Filter test
        res = await client.get(
            app.url_path_for("reference_data:get_all")
            + "?country=1&source=Simple Source",
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code in [200, 404]

        # Pagination test
        res = await client.get(
            app.url_path_for("reference_data:get_all") + "?page=2&limit=1",
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code in [200, 404]

    @pytest.mark.asyncio
    async def test_get_reference_data_by_id(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # without cred
        res = await client.get(
            app.url_path_for("reference_data:get_by_id", reference_data_id=1)
        )
        assert res.status_code == 200
        # return 404
        res = await client.get(
            app.url_path_for(
                "reference_data:get_by_id", reference_data_id=100
            ),
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code == 404
        # with normal user cred
        res = await client.get(
            app.url_path_for("reference_data:get_by_id", reference_data_id=1),
            headers={"Authorization": f"Bearer {non_admin_account.token}"},
        )
        assert res.status_code == 200
        # with admin user cred
        res = await client.get(
            app.url_path_for("reference_data:get_by_id", reference_data_id=1),
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code == 200
        res = res.json()
        assert res["id"] == 1
        assert res["area"] is not None

    @pytest.mark.asyncio
    async def test_update_reference_data(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        payload = {
            "country": 1,
            "commodity": 1,
            "region": "Region",
            "currency": "USD",
            "year": "2022",
            "source": "Google",
            "link": "http://google.com",
            "notes": "Sample Notes",
            "confidence_level": "Low",
            "range": "Sample Range",
            "area": None,
            "volume": None,
            "price": None,
            "cost_of_production": None,
            "diversified_income": None,
            "area_size_unit": "acres",
            "volume_measurement_unit": "liters",
            "cost_of_production_unit": "USD / acres",
            "diversified_income_unit": "USD",
            "price_unit": "USD / liters",
            "type_area": None,
            "type_volume": None,
            "type_price": None,
            "type_cost_of_production": None,
            "type_diversified_income": None,
            "visible_to_external_user": False,
        }
        # without cred
        res = await client.put(
            app.url_path_for("reference_data:update", reference_data_id=2),
            json=payload,
        )
        assert res.status_code == 403
        # with normal user cred
        res = await client.put(
            app.url_path_for("reference_data:update", reference_data_id=2),
            headers={"Authorization": f"Bearer {non_admin_account.token}"},
            json=payload,
        )
        assert res.status_code == 403
        # with admin user cred
        res = await client.put(
            app.url_path_for("reference_data:update", reference_data_id=2),
            headers={"Authorization": f"Bearer {admin_account.token}"},
            json=payload,
        )
        assert res.status_code == 200
        res = res.json()
        assert res["id"] == 2
        assert res["region"] == "Region"
        assert res["source"] == "Google"
        assert res["link"] == "http://google.com"
        assert res["area"] is None

    @pytest.mark.asyncio
    async def test_get_reference_value(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # with normal user cred
        res = await client.get(
            app.url_path_for("reference_data:get_reference_value"),
            headers={"Authorization": f"Bearer {non_admin_account.token}"},
            params={"country": 100, "commodity": 100, "driver": "area"},
        )
        assert res.status_code == 200
        res = res.json()
        assert res == []
        # with admin user cred
        res = await client.get(
            app.url_path_for("reference_data:get_reference_value"),
            headers={"Authorization": f"Bearer {admin_account.token}"},
            params={"country": 1, "commodity": 1, "driver": "area"},
        )
        assert res.status_code == 200
        res = res.json()
        assert res == [
            {
                "id": 1,
                "source": "Sample Source",
                "link": "http://example.com",
                "value": "100.5",
                "unit": "acres",
                "region": "Sample Region",
                "year": "2023",
                "confidence_level": "High",
                "type": "Sample Type Area",
            }
        ]

    @pytest.mark.asyncio
    async def test_delete_reference_data(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # without cred
        res = await client.delete(
            app.url_path_for("reference_data:delete", reference_data_id=1)
        )
        assert res.status_code == 403
        # return 404
        res = await client.delete(
            app.url_path_for("reference_data:delete", reference_data_id=100),
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code == 404
        # with normal user cred
        res = await client.delete(
            app.url_path_for("reference_data:delete", reference_data_id=1),
            headers={"Authorization": f"Bearer {non_admin_account.token}"},
        )
        assert res.status_code == 403
        # with admin user cred
        res = await client.delete(
            app.url_path_for("reference_data:delete", reference_data_id=1),
            headers={"Authorization": f"Bearer {admin_account.token}"},
        )
        assert res.status_code == 204

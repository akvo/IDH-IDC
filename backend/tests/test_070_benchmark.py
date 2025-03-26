import sys
import pytest
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy.orm import Session
from tests.test_000_main import Acc

sys.path.append("..")

non_admin_account = Acc(email="support@akvo.org", token=None)
admin_account = Acc(email="super_admin@akvo.org", token=None)


class TestBenchmarkRoute:
    @pytest.mark.asyncio
    async def test_get_benchmark_by_country_region_year_1(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # without cred
        res = await client.get(
            app.url_path_for(
                "lib:get_by_country_region_year",
            ),
            params={
                "country_id": 1,
                "region_id": 1,
                "year": 2020,
            },
        )
        assert res.status_code == 200
        res = res.json()
        assert res == {
            "id": 1,
            "country": 1,
            "region": 1,
            "household_size": 4.0,
            "year": 2020,
            "value": {"lcu": 1200.5, "usd": 2200.5, "eur": 3200.5},
            "case_year_cpi": 5000.0,
            "last_year_cpi": 7000.0,
            "cpi_factor": -0.2857142857142857,
            "message": None,
            "household_equiv": None,
            "links": None,
            "nr_adults": None,
            "source": "www.akvo.org",
        }

    @pytest.mark.asyncio
    async def test_get_benchmark_by_country_region_year_2(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # without cred
        res = await client.get(
            app.url_path_for(
                "lib:get_by_country_region_year",
            ),
            params={
                "country_id": 1,
                "region_id": 1,
                "year": 2021,
            },
        )
        assert res.status_code == 200
        res = res.json()
        assert res == {
            "id": 1,
            "country": 1,
            "region": 1,
            "household_size": 4.0,
            "year": 2020,
            "value": {"lcu": 1200.5, "usd": 2200.5, "eur": 3200.5},
            "case_year_cpi": 6000.0,
            "last_year_cpi": 7000.0,
            "message": None,
            "cpi_factor": -0.14285714285714285,
            "household_equiv": None,
            "links": None,
            "nr_adults": None,
            "source": "www.akvo.org",
        }

    @pytest.mark.asyncio
    async def test_get_benchmark_by_country_region_year_3(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # without cred
        res = await client.get(
            app.url_path_for(
                "lib:get_by_country_region_year",
            ),
            params={
                "country_id": 100,
                "region_id": 100,
                "year": 2020,
            },
        )
        assert res.status_code == 404
        res = res.json()
        assert res == {"detail": "Benchmark value not found."}

    @pytest.mark.asyncio
    async def test_get_benchmark_by_country_region_year_4(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        # without cred
        res = await client.get(
            app.url_path_for(
                "lib:get_by_country_region_year",
            ),
            params={
                "country_id": 1,
                "region_id": 1,
                "year": 2023,
            },
        )
        assert res.status_code == 200
        res = res.json()
        assert res == {
            "id": 1,
            "country": 1,
            "region": 1,
            "household_size": 4.0,
            "year": 2020,
            "nr_adults": None,
            "household_equiv": None,
            "source": "www.akvo.org",
            "links": None,
            "value": {"lcu": 1200.5, "usd": 2200.5, "eur": 3200.5},
            "case_year_cpi": None,
            "last_year_cpi": 7000.0,
            "cpi_factor": None,
            "message": (
                "This is the benchmark value for 2020, which is the most "
                "recent available. If you wish to adjust it for inflation "
                "and update the value manually, you can use the 'Set the "
                "target yourself' option."
            ),
        }

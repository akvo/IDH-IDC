import sys
import pytest
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy.orm import Session
from tests.test_000_main import Acc

sys.path.append("..")

non_admin_account = Acc(email="support@akvo.org", token=None)
admin_account = Acc(email="super_admin@akvo.org", token=None)


class TestBenchmarkRoute():
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
                'country_id': 1,
                'region_id': 1,
                'year': 2020,
            }
        )
        assert res.status_code == 200
        res = res.json()
        assert res == {
            'id': 1,
            'country': 1,
            'region': 1,
            'household_size': 4,
            'year': 2020,
            'value': {
                'lcu': 1200.5,
                'usd': 2200.5,
                'eur': 3200.5
            },
            'cpi': None
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
                'country_id': 1,
                'region_id': 1,
                'year': 2021,
            }
        )
        assert res.status_code == 200
        res = res.json()
        assert res == {
            'id': 1,
            'country': 1,
            'region': 1,
            'household_size': 4,
            'year': 2021,
            'value': {
                'lcu': 1200.5,
                'usd': 2200.5,
                'eur': 3200.5
            },
            'cpi': 7000.0
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
                'country_id': 100,
                'region_id': 100,
                'year': 2020,
            }
        )
        assert res.status_code == 404

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
                'country_id': 1,
                'region_id': 1,
                'year': 2012,
            }
        )
        assert res.status_code == 404
import os
import sys
import pytest
from main import app
from httpx import AsyncClient
from fastapi.testclient import TestClient
from fastapi import FastAPI
from middleware import create_access_token
from middleware import decode_token
from sqlalchemy.orm import Session
from models.commodity_category import CommodityCategory
from models.commodity import Commodity
from models.country import Country
from models.business_unit import BusinessUnit
from models.region import Region
from models.country_region import CountryRegion
from models.living_income_benchmark import LivingIncomeBenchmark
from models.cpi import Cpi

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

client = TestClient(app)


class Acc:
    def __init__(self, email, token):
        self.email = email if email else "support@akvo.org"
        self.data = {"email": self.email}
        self.token = token if token else create_access_token(data=self.data)
        self.decoded = decode_token(self.token)


def test_read_main():
    response = client.get("/")
    assert response.json() == "OK"
    assert response.status_code == 200


class TestAddMasterDataWithoutDedenpentToUser:
    @pytest.mark.asyncio
    async def test_add_business_unit_master_data(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        payload = [
            {"name": "Acme Technologies Sales Division"},
            {"name": "Global Marketing Solutions"},
            {"name": "Finance and Accounting Services, Inc."},
            {"name": "Human Resources and Talent Management"},
            {"name": "Research and Development Labs"},
        ]
        for val in payload:
            business_unit = BusinessUnit(name=val["name"])
            session.add(business_unit)
            session.commit()
            session.flush()
            session.refresh(business_unit)
        business_units = session.query(BusinessUnit).all()
        business_units = [val.serialize for val in business_units]
        assert business_units == [
            {"id": 1, "name": "Acme Technologies Sales Division"},
            {"id": 2, "name": "Global Marketing Solutions"},
            {"id": 3, "name": "Finance and Accounting Services, Inc."},
            {"id": 4, "name": "Human Resources and Talent Management"},
            {"id": 5, "name": "Research and Development Labs"},
        ]

    @pytest.mark.asyncio
    async def test_add_commodity_categories_and_commodities_master_data(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        payload = [
            {
                "name": "Grains",
                "children": [{"name": "Wheat"}, {"name": "Rice"}, {"name": "Corn"}],
            },
            {
                "name": "Nuts",
                "children": [
                    {"name": "Almonds"},
                    {"name": "Walnuts"},
                    {"name": "Pecans"},
                ],
            },
        ]
        for val in payload:
            commodity_category = CommodityCategory(name=val["name"])
            for child in val["children"]:
                commodity = Commodity(name=child["name"])
                commodity_category.commodities.append(commodity)
            session.add(commodity_category)
            session.commit()
            session.flush()
            session.refresh(commodity_category)
        commodity_categories = session.query(CommodityCategory).all()
        commodity_categories = [
            val.serialize_with_commodities for val in commodity_categories
        ]
        assert commodity_categories == [
            {
                "id": 1,
                "name": "Grains",
                "commodities": [
                    {"id": 1, "name": "Wheat"},
                    {"id": 2, "name": "Rice"},
                    {"id": 3, "name": "Corn"},
                ],
            },
            {
                "id": 2,
                "name": "Nuts",
                "commodities": [
                    {"id": 4, "name": "Almonds"},
                    {"id": 5, "name": "Walnuts"},
                    {"id": 6, "name": "Pecans"},
                ],
            },
        ]

    @pytest.mark.asyncio
    async def test_add_country_master_data(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        payload = [
            {"name": "Indonesia", "children": [{"name": "Bali"}, {"name": "Lombok"}]},
            {"name": "India", "children": [{"name": "Delhi"}, {"name": "Mumbai"}]},
        ]
        for val in payload:
            country = Country(name=val["name"])
            for child in val["children"]:
                country_child = Country(name=child["name"])
                country.children.append(country_child)
            session.add(country)
            session.commit()
            session.flush()
            session.refresh(country)
        countries = session.query(Country).filter(Country.parent.is_(None)).all()
        countries = [c.serialize for c in countries]
        assert countries == [
            {
                "id": 1,
                "parent": None,
                "name": "Indonesia",
                "children": [
                    {"id": 2, "parent": 1, "name": "Bali", "children": []},
                    {"id": 3, "parent": 1, "name": "Lombok", "children": []},
                ],
            },
            {
                "id": 4,
                "parent": None,
                "name": "India",
                "children": [
                    {"id": 5, "parent": 4, "name": "Delhi", "children": []},
                    {"id": 6, "parent": 4, "name": "Mumbai", "children": []},
                ],
            },
        ]

    @pytest.mark.asyncio
    async def test_add_region_master_data(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        payload = [
            {
                "id": 1,
                "name": "Rural",
            },
            {
                "id": 2,
                "name": "Urban",
            },
        ]
        for val in payload:
            region = Region(id=val["id"], name=val["name"])
            session.add(region)
            session.commit()
            session.flush()
            session.refresh(region)
        regions = session.query(Region).all()
        regions = [c.serialize for c in regions]
        assert regions == [
            {
                "id": 1,
                "name": "Rural",
            },
            {
                "id": 2,
                "name": "Urban",
            },
        ]
        # add country region
        payload = [
            {
                "id": 1,
                "region": 1,
                "country": 1,
            },
            {
                "id": 2,
                "region": 1,
                "country": 4,
            },
        ]
        for val in payload:
            country_region = CountryRegion(
                id=val["id"], country=val["country"], region=val["region"]
            )
            session.add(country_region)
            session.commit()
            session.flush()
            session.refresh(country_region)
        country_regions = session.query(CountryRegion).count()
        assert country_regions == 2

    @pytest.mark.asyncio
    async def test_add_benchmark_n_region_master_data(
        self, app: FastAPI, session: Session, client: AsyncClient
    ) -> None:
        payload = [
            {
                "id": 1,
                "country": 1,
                "region": 1,
                "household_size": 4,
                "year": 2020,
                "source": "www.akvo.org",
                "lcu": 1200.50,
                "usd": 2200.50,
                "eur": 3200.50,
            },
            {
                "id": 2,
                "country": 4,
                "region": 1,
                "household_size": 5,
                "year": 2020,
                "source": "www.akvo.org",
                "lcu": 1000,
                "usd": 2000,
                "eur": 3000,
            },
        ]
        for val in payload:
            lib = LivingIncomeBenchmark(
                id=val["id"],
                country=val["country"],
                region=val["region"],
                household_size=val["household_size"],
                year=val["year"],
                source=val["source"],
                lcu=val["lcu"],
                usd=val["usd"],
                eur=val["eur"],
            )
            session.add(lib)
            session.commit()
            session.flush()
            session.refresh(lib)
        libs = session.query(LivingIncomeBenchmark).all()
        libs = [lib.serialize for lib in libs]
        assert libs == [
            {
                "id": 1,
                "country": 1,
                "region": 1,
                "year": 2020,
                "household_size": 4.0,
                "nr_adults": None,
                "household_equiv": None,
                "source": "www.akvo.org",
                "links": None,
                "value": {"lcu": 1200.5, "usd": 2200.5, "eur": 3200.5},
                "case_year_cpi": None,
                "last_year_cpi": None,
            },
            {
                "id": 2,
                "country": 4,
                "region": 1,
                "year": 2020,
                "household_size": 5.0,
                "nr_adults": None,
                "household_equiv": None,
                "source": "www.akvo.org",
                "links": None,
                "value": {"lcu": 1000.0, "usd": 2000.0, "eur": 3000.0},
                "case_year_cpi": None,
                "last_year_cpi": None,
            },
        ]
        # cpi
        payload = [
            {
                "id": 1,
                "country": 1,
                "year": 2020,
                "value": 5000,
            },
            {
                "id": 2,
                "country": 1,
                "year": 2021,
                "value": 6000,
            },
            {
                "id": 3,
                "country": 1,
                "year": 2022,
                "value": 7000,
            },
        ]
        for val in payload:
            cpi = Cpi(
                id=val["id"],
                country=val["country"],
                year=val["year"],
                value=val["value"],
            )
            session.add(cpi)
            session.commit()
            session.flush()
            session.refresh(cpi)
        cpis = session.query(Cpi).all()
        cpis = [c.serialize for c in cpis]
        assert cpis == [
            {"id": 1, "country": 1, "year": 2020, "value": 5000.0},
            {"id": 2, "country": 1, "year": 2021, "value": 6000.0},
            {"id": 3, "country": 1, "year": 2022, "value": 7000.0},
        ]

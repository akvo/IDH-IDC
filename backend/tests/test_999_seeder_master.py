import sys
import pytest
from sqlalchemy.orm import Session

from models.commodity_category import CommodityCategory
from models.country import Country

# from models.currency import Currency
# from models.commodity import Commodity
# from models.business_unit import BusinessUnit
# from models.organisation import Organisation
# from models.tag import Tag
# from models.region import Region
# from models.country_region import CountryRegion
# from models.living_income_benchmark import LivingIncomeBenchmark
# from models.cpi import Cpi
# from models.question import Question
# from models.commodity_category_question import CommodityCategoryQuestion

# from seeder.country import seeder_country
# from seeder.commodity import seeder_commodity
# from seeder.business_unit import seeder_business_unit
# from seeder.organisation import seeder_organisation
# from seeder.tag import seeder_tag
# from seeder.region import seeder_region
# from seeder.benchmark import seeder_benchmark
# from seeder.question import seeder_question

pytestmark = pytest.mark.asyncio
sys.path.append("..")


class TestSeederMaster:
    @pytest.mark.asyncio
    async def test_seeder_master(self, session: Session) -> None:
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
        countries = (
            session.query(Country).filter(Country.parent.is_(None)).all()
        )
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

    # @pytest.mark.asyncio
    # async def test_seeder_country(self, session: Session) -> None:
    #     seeder_country(session=session)
    #     countries_count = session.query(Country).count()
    #     assert countries_count == 10
    #     currency_count = session.query(Currency).count()
    #     assert currency_count == 10

    # @pytest.mark.asyncio
    # async def test_seeder_commodity(self, session: Session) -> None:
    #     seeder_commodity(session=session)
    #     commodity_category_count = session.query(CommodityCategory).count()
    #     assert commodity_category_count == 3
    #     commodity_count = session.query(Commodity).count()
    #     assert commodity_count == 11

    # @pytest.mark.asyncio
    # async def test_seeder_business_unit_org_tag(self, session: Session) -> None:
    #     seeder_business_unit(session=session)
    #     business_unit_count = session.query(BusinessUnit).count()
    #     assert business_unit_count == 5

    #     seeder_organisation(session=session)
    #     org_count = session.query(Organisation).count()
    #     assert org_count == 0

    #     seeder_tag(session=session)
    #     tag_count = session.query(Tag).count()
    #     assert tag_count == 0

    # @pytest.mark.asyncio
    # async def test_seeder_region(self, session: Session) -> None:
    #     seeder_region(session=session)
    #     region_count = session.query(Region).count()
    #     assert region_count == 0
    #     country_region_count = session.query(CountryRegion).count()
    #     assert country_region_count == 0

    # @pytest.mark.asyncio
    # async def test_seeder_benchmark(self, session: Session) -> None:
    #     seeder_benchmark(session=session)
    #     benchmark_count = session.query(LivingIncomeBenchmark).count()
    #     assert benchmark_count == 0
    #     cpi_count = session.query(Cpi).count()
    #     assert cpi_count == 0

    # @pytest.mark.asyncio
    # async def test_seeder_question(self, session: Session) -> None:
    #     seeder_question(session=session)
    #     question_count = session.query(Question).count()
    #     assert question_count == 0
    #     category_question = session.query(CommodityCategoryQuestion).count()
    #     assert category_question == 0

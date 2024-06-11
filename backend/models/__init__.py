from sqlalchemy.orm import configure_mappers

from models.user import User
from models.business_unit import BusinessUnit
from models.commodity_category import CommodityCategory
from models.currency import Currency
from models.country import Country
from models.question import Question

# Ensure all models are imported before configuring mappers
configure_mappers()

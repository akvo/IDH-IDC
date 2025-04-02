import enum
from sqlalchemy import Column, Integer, Float, ForeignKey, Enum
from sqlalchemy.orm import relationship
from db.connection import Base
from typing import Optional


class CurrencyEnum(enum.Enum):
    USD = "USD"
    EUR = "EUR"


class ConversionRate(Base):
    __tablename__ = "conversion_rate"

    id = Column(Integer, primary_key=True)
    country = Column(Integer, ForeignKey("country.id"), nullable=False)
    year = Column(Integer, nullable=False)
    value = Column(Float, nullable=False)
    currency = Column(Enum(CurrencyEnum, name="currency_enum"), nullable=False)

    def __init__(
        self,
        country: int,
        year: int,
        value: float,
        currency: Optional[CurrencyEnum] = CurrencyEnum.USD,
        id: Optional[int] = None,
    ):
        self.id = id
        self.country = country
        self.year = year
        self.value = value
        self.currency = currency

    def __repr__(self) -> int:
        return f"<ConversionRate {self.id}>"

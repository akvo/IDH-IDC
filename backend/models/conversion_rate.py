from sqlalchemy import Column, Integer, Float, ForeignKey
from sqlalchemy.orm import relationship
from db.connection import Base
from typing import Optional


class ConversionRate(Base):
    __tablename__ = "conversion_rate"

    id = Column(Integer, primary_key=True, autoincrement=True)
    country = Column(Integer, ForeignKey("country.id"), nullable=False)
    year = Column(Integer, nullable=False)
    value = Column(Float, nullable=False)

    country = relationship("Country", back_populates="conversion_rates")

    def __init__(
        self, country: int, year: int, value: float, id: Optional[int] = None
    ):
        self.id = id
        self.country = country
        self.year = year
        self.value = value

    def __repr__(self) -> int:
        return f"<ConversionRate {self.id}>"

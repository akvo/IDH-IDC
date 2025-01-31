from db.connection import Base
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from typing import Optional
from typing_extensions import TypedDict
from pydantic import BaseModel


class CountryDict(TypedDict):
    id: int
    parent: Optional[int]
    name: str


class CountryDropdown(TypedDict):
    value: int
    label: str


class Country(Base):
    __tablename__ = "country"

    id = Column(Integer, primary_key=True)
    parent = Column(Integer, ForeignKey("country.id"), nullable=True)
    name = Column(String, nullable=False)

    children = relationship("Country")
    parent_detail = relationship(
        "Country", remote_side=[id], overlaps="children"
    )

    def __init__(
        self, name: str, id: Optional[int] = None, parent: Optional[int] = None
    ):
        self.id = id
        self.parent = parent
        self.name = name

    def __repr__(self) -> int:
        return f"<Country {self.id}>"

    @property
    def serialize(self) -> CountryDict:
        return {
            "id": self.id,
            "parent": self.parent,
            "name": self.name,
            "children": [c.serialize for c in self.children],
        }

    @property
    def to_dropdown(self) -> CountryDropdown:
        return {
            "value": self.id,
            "label": self.name,
        }


class CountryBase(BaseModel):
    id: int
    parent: Optional[int] = None
    name: str

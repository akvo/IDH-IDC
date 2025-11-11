from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db.connection import get_session
from db.procurement_library_v2 import crud_category
from models.procurement_library_v2.pl_schemas import PLCategoryWithAttributesRead

pl_cat_router_v2 = APIRouter(prefix="/plv2/category")


@pl_cat_router_v2.get(
    "/attributes",
    name="plv2:get_cattegory_with_attributes",
    summary="Retrieve all Procurement Library categories with their associated attributes.",
    response_description="List of categories, each including its attributes.",
    response_model=list[PLCategoryWithAttributesRead],
    tags=["Procurement Library V2"],
)
def list_categories(db: Session = Depends(get_session)):
    """
    Fetch all categories in the Procurement Library along with their linked attributes.
    Each category includes metadata (id, label, description, timestamps)
    and a nested list of attributes.
    """
    return crud_category.get_categories_with_attributes(db)

from sqlalchemy.orm import Session, joinedload
from typing import List, Dict

from models.procurement_library_v2.pl_models import PLCategory


def get_categories_with_attributes(db: Session) -> List[Dict]:
    """Return all categories with their attributes using ORM query."""
    categories = (
        db.query(PLCategory)
        .options(joinedload(PLCategory.attributes))
        .order_by(PLCategory.id)
        .all()
    )

    return [
        cat.category_with_attributes for cat in categories
    ]

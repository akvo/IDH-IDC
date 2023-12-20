"""add price unit column to reference data table

Revision ID: c50aa947afb3
Revises: 331d556254b2
Create Date: 2023-12-18 22:38:29.375084

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c50aa947afb3"
down_revision: Union[str, None] = "331d556254b2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "reference_data",
        sa.Column("price_unit", sa.String(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("reference_data", "price_unit")

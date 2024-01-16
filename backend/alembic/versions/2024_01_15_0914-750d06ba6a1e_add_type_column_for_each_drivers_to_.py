"""add type column for each drivers to reference data table

Revision ID: 750d06ba6a1e
Revises: 38b9239aba9e
Create Date: 2024-01-15 09:14:01.928810

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "750d06ba6a1e"
down_revision: Union[str, None] = "38b9239aba9e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    #
    op.drop_column("reference_data", "type")
    #
    op.add_column(
        "reference_data",
        sa.Column("type_area", sa.String(), nullable=True),
    )
    op.add_column(
        "reference_data",
        sa.Column("type_volume", sa.String(), nullable=True),
    )
    op.add_column(
        "reference_data",
        sa.Column("type_price", sa.String(), nullable=True),
    )
    op.add_column(
        "reference_data",
        sa.Column("type_cost_of_production", sa.String(), nullable=True),
    )
    op.add_column(
        "reference_data",
        sa.Column("type_diversified_income", sa.String(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("reference_data", "type_area")
    op.drop_column("reference_data", "type_volume")
    op.drop_column("reference_data", "type_price")
    op.drop_column("reference_data", "type_cost_of_production")
    op.drop_column("reference_data", "type_diversified_income")
    #
    op.add_column(
        "reference_data",
        sa.Column("type", sa.String(), nullable=True),
    )
    #

"""alter living income benchmark add new columns

Revision ID: 586a2ba6c965
Revises: 07ab8a041566
Create Date: 2023-12-08 00:39:25.762782

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "586a2ba6c965"
down_revision: Union[str, None] = "07ab8a041566"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "living_income_benchmark",
        sa.Column("nr_adults", sa.Integer(), nullable=True),
    )
    op.add_column(
        "living_income_benchmark",
        sa.Column("household_equiv", sa.Float(), nullable=True),
    )
    op.add_column(
        "living_income_benchmark",
        sa.Column("links", sa.String(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("living_income_benchmark", "nr_adults")
    op.drop_column("living_income_benchmark", "household_equiv")
    op.drop_column("living_income_benchmark", "links")

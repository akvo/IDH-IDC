"""add visible to external user column into reference data table

Revision ID: 13a41267eaff
Revises: 9947ad426a22
Create Date: 2025-03-27 03:02:09.827197

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '13a41267eaff'
down_revision: Union[str, None] = '9947ad426a22'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "reference_data",
        sa.Column(
            "visible_to_external_user",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )


def downgrade() -> None:
    op.drop_column("reference_data", "visible_to_external_user")

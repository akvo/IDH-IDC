"""change score datatype on practice indicator score table

Revision ID: 99be4b85ddb9
Revises: a877bc13e512
Create Date: 2025-03-05 11:58:56.680743

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '99be4b85ddb9'
down_revision: Union[str, None] = 'a877bc13e512'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "pl_practice_indicator_score",
        "score",
        existing_type=sa.String(),
        type_=sa.Float(),
        nullable=True,
        postgresql_using="score::double precision"
    )


def downgrade() -> None:
    op.alter_column(
        "pl_practice_indicator_score",
        "score",
        existing_type=sa.Float(),
        type_=sa.String(length=255),
        nullable=False,
    )

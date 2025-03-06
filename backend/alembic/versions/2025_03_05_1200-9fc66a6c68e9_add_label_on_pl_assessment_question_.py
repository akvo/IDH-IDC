"""add label on pl_assessment_question_option table

Revision ID: 9fc66a6c68e9
Revises: 99be4b85ddb9
Create Date: 2025-03-05 12:00:43.687009

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9fc66a6c68e9'
down_revision: Union[str, None] = '99be4b85ddb9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "pl_assessment_question_option",
        sa.Column("label", sa.String(length=125), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("pl_assessment_question_option", "label")

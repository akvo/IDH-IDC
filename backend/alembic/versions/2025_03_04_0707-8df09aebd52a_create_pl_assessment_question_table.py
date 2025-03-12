"""create pl_assessment_question table

Revision ID: 8df09aebd52a
Revises: 47ee5b184ac9
Create Date: 2025-03-04 07:07:47.010853

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8df09aebd52a'
down_revision: Union[str, None] = '47ee5b184ac9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "pl_assessment_question",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("label", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index(op.f("ix_pl_assessment_question_id"), "pl_assessment_question", ["id"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_pl_assessment_question_id"), table_name="pl_assessment_question")
    op.drop_table("pl_assessment_question")

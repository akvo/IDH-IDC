"""create pl_assessment_question_option table

Revision ID: a877bc13e512
Revises: c38333f71504
Create Date: 2025-03-04 07:08:42.244697

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a877bc13e512"
down_revision: Union[str, None] = "c38333f71504"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "pl_assessment_question_option",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "question_id", sa.Integer(), sa.ForeignKey("pl_assessment_question.id")
        ),
        sa.Column(
            "indicator_id",
            sa.Integer(),
            sa.ForeignKey("pl_practice_indicator.id", ondelete="CASCADE"),
        ),
        sa.Column(
            "created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()
        ),
    )
    op.create_index(
        op.f("ix_pl_assessment_question_option_id"),
        "pl_assessment_question_option",
        ["id"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_pl_assessment_question_option_id"),
        table_name="pl_assessment_question_option",
    )
    op.drop_table("pl_assessment_question_option")

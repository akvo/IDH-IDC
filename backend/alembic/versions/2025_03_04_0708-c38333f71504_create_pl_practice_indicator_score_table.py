"""create pl_practice_indicator_score table

Revision ID: c38333f71504
Revises: 8df09aebd52a
Create Date: 2025-03-04 07:08:24.388011

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c38333f71504"
down_revision: Union[str, None] = "8df09aebd52a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "pl_practice_indicator_score",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("practice_id", sa.Integer(), sa.ForeignKey("pl_practice.id")),
        sa.Column(
            "indicator_id",
            sa.Integer(),
            sa.ForeignKey("pl_practice_indicator.id", ondelete="CASCADE"),
        ),
        sa.Column("score", sa.String(length=255), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
    )
    op.create_index(
        op.f("ix_pl_practice_indicator_score_id"),
        "pl_practice_indicator_score",
        ["id"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_pl_practice_indicator_score_id"),
        table_name="pl_practice_indicator_score",
    )
    op.drop_table("pl_practice_indicator_score")

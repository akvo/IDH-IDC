"""create pl_practice table

Revision ID: 0961d6a8663f
Revises: 52df2bfa0f8a
Create Date: 2025-03-04 07:06:40.025022

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0961d6a8663f'
down_revision: Union[str, None] = '52df2bfa0f8a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "pl_practice",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("procurement_process_id", sa.Integer(), sa.ForeignKey("pl_procurement_process.id", ondelete="CASCADE")),
        sa.Column("label", sa.String(length=225), nullable=False),
        sa.Column("intervention_definition", sa.Text(), nullable=True),
        sa.Column("enabling_conditions", sa.Text(), nullable=True),
        sa.Column("business_rationale", sa.Text(), nullable=True),
        sa.Column("farmer_rationale", sa.Text(), nullable=True),
        sa.Column("risks_n_trade_offs", sa.Text(), nullable=True),
        sa.Column("intervention_impact_income", sa.Text(), nullable=True),
        sa.Column("intervention_impact_env", sa.Text(), nullable=True),
        sa.Column("source_or_evidence", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index(op.f("ix_pl_practice_id"), "pl_practice", ["id"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_pl_practice_id"), table_name="pl_practice")
    op.drop_table("pl_practice")

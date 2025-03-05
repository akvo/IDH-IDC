"""create pl_procurement_process table

Revision ID: 52df2bfa0f8a
Revises: 8b7de96e5e55
Create Date: 2025-03-04 07:06:23.092336

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '52df2bfa0f8a'
down_revision: Union[str, None] = '8b7de96e5e55'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "pl_procurement_process",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("label", sa.String(length=125), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_pl_procurement_process_id"), "pl_procurement_process", ["id"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_pl_procurement_process_id"), table_name="pl_procurement_process")
    op.drop_table("pl_procurement_process")

"""create_academy_module_table

Revision ID: d3e1a2b3c4d5
Revises: cb29ec330c92
Create Date: 2026-11-05 10:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd3e1a2b3c4d5'
down_revision: Union[str, None] = 'cb29ec330c92'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "academy_module",
        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            autoincrement=True,
            nullable=False,
        ),
        sa.Column("order_index", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "estimated_minutes",
            sa.Integer(),
            nullable=False,
            server_default="16",
        ),
        sa.Column("icon_theme", sa.String(length=50), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
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
        "ix_academy_module_id",
        "academy_module",
        ["id"],
        unique=False,
    )
    op.create_index(
        "ix_academy_module_order_index",
        "academy_module",
        ["order_index"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_academy_module_order_index", table_name="academy_module")
    op.drop_index("ix_academy_module_id", table_name="academy_module")
    op.drop_table("academy_module")

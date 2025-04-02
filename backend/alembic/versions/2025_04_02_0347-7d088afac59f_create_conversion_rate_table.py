"""create conversion_rate table

Revision ID: 7d088afac59f
Revises: 13a41267eaff
Create Date: 2025-04-02 03:47:12.405918

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "7d088afac59f"
down_revision: Union[str, None] = "13a41267eaff"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "conversion_rate",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("country", sa.Integer(), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("value", sa.Float(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_foreign_key(
        None, "conversion_rate", "country", ["country"], ["id"]
    )
    op.create_index(
        op.f("ix_conversion_rate_id"), "conversion_rate", ["id"], unique=True
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_conversion_rate_id"), table_name="conversion_rate")
    op.drop_table("conversion_rate")

"""expand academy resource type enum

Revision ID: e5f6a1b2c3d4
Revises: d4e5f6a1b2c3
Create Date: 2026-11-26 09:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "e5f6a1b2c3d4"
down_revision: Union[str, None] = "d4e5f6a1b2c3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE academy_resource_type ADD VALUE IF NOT EXISTS 'Benchmark'")
        op.execute("ALTER TYPE academy_resource_type ADD VALUE IF NOT EXISTS 'Platform'")
        op.execute("ALTER TYPE academy_resource_type ADD VALUE IF NOT EXISTS 'Research'")


def downgrade() -> None:
    pass  # PostgreSQL does not support dropping enum values without recreating the type

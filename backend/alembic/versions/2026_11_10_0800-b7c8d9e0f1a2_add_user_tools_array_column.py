"""add user tools array column

Revision ID: b7c8d9e0f1a2
Revises: a6b4d5e6f7a8
Create Date: 2026-11-10 08:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "b7c8d9e0f1a2"
down_revision: Union[str, None] = "a6b4d5e6f7a8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "user",
        sa.Column(
            "tools",
            postgresql.ARRAY(sa.String()),
            nullable=False,
            server_default=sa.text("'{}'"),
        ),
    )
    # Data migration: Existing users receive IDC and Academy access
    op.execute(
        'UPDATE "user" SET tools = \'{"idc", "academy"}\' WHERE tools = \'{}\''
    )


def downgrade() -> None:
    op.drop_column("user", "tools")

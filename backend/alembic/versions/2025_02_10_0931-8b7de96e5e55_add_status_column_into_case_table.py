"""add status column into case table

Revision ID: 8b7de96e5e55
Revises: a5f7676a8a23
Create Date: 2025-02-10 09:31:43.233088

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "8b7de96e5e55"
down_revision: Union[str, None] = "a5f7676a8a23"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # Add the status column with a default value of 0 (incompleted)
    op.add_column(
        "case",
        sa.Column("status", sa.Integer(), nullable=False, server_default="0"),
    )


def downgrade():
    op.drop_column("case", "status")

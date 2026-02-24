"""add user_type to user table

Revision ID: 3g4h5i6j7k8l
Revises: 2f45df3c0bfd
Create Date: 2026-02-24 14:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "3g4h5i6j7k8l"
down_revision: Union[str, None] = "2f45df3c0bfd"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "user",
        sa.Column(
            "user_type",
            sa.String(length=150),
            server_default=None,
            nullable=True,
        ),
    )
    # Data migration: Set user_type based on role and BU presence
    op.execute(
        """
        UPDATE "user"
        SET user_type = 'internal'
        WHERE role != 'user' OR id IN (
            SELECT DISTINCT "user" FROM user_business_unit
        )
        """
    )
    op.execute(
        """
        UPDATE "user"
        SET user_type = 'external_regular'
        WHERE role = 'user' AND id NOT IN (
            SELECT DISTINCT "user" FROM user_business_unit
        )
        """
    )


def downgrade() -> None:
    op.drop_column("user", "user_type")

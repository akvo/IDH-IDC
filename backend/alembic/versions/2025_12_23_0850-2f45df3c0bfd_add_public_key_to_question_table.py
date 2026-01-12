"""add public_key to question table

Revision ID: 2f45df3c0bfd
Revises: 51fdd4c2c795
Create Date: 2025-12-23 08:50:51.585373

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "2f45df3c0bfd"
down_revision: Union[str, None] = "51fdd4c2c795"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # 1. Add column (nullable first to allow backfill)
    op.add_column(
        "question",
        sa.Column("public_key", sa.String(length=255), nullable=True),
    )

    # 2. Add unique constraint (NULL-safe in Postgres)
    op.create_unique_constraint(
        "uq_question_public_key",
        "question",
        ["public_key"],
    )


def downgrade():
    op.drop_constraint("uq_question_public_key", "question", type_="unique")
    op.drop_column("question", "public_key")

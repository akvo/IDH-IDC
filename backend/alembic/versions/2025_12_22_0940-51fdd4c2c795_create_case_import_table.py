"""create case_import table

Revision ID: 51fdd4c2c795
Revises: 92819753edfb
Create Date: 2025-12-22 09:40:51.277385

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "51fdd4c2c795"
down_revision: Union[str, None] = "92819753edfb"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.create_table(
        "case_import",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "case_id",
            sa.Integer(),
            sa.ForeignKey("case.id", ondelete="CASCADE"),
            nullable=True,
        ),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("user.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "file_path",
            sa.String(),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "expires_at",
            sa.DateTime(),
            nullable=False,
        ),
    )

    op.create_index(
        "ix_case_import_case_id",
        "case_import",
        ["case_id"],
    )

    op.create_index(
        "ix_case_import_user_id",
        "case_import",
        ["user_id"],
    )


def downgrade():
    op.drop_index("ix_case_import_user_id", table_name="case_import")
    op.drop_index("ix_case_import_case_id", table_name="case_import")
    op.drop_table("case_import")

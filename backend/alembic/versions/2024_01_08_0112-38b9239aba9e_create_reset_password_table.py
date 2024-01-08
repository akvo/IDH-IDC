"""create reset password table

Revision ID: 38b9239aba9e
Revises: 9bafa33c5c7e
Create Date: 2024-01-08 01:12:20.856951

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "38b9239aba9e"
down_revision: Union[str, None] = "9bafa33c5c7e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "reset_password",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user", sa.Integer(), nullable=False),
        sa.Column("url", sa.String, nullable=False),
        sa.Column(
            "valid",
            sa.DateTime(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user"],
            ["user.id"],
            name="user_reset_password_constraint",
            ondelete="CASCADE",
        ),
    )
    op.create_index(op.f("ix_reset_password"), "reset_password", ["id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_reset_password"), table_name="user")
    op.drop_table("reset_password")

"""add updated_by column to case table

Revision ID: 9bafa33c5c7e
Revises: c50aa947afb3
Create Date: 2024-01-05 04:04:12.817493

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9bafa33c5c7e"
down_revision: Union[str, None] = "c50aa947afb3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "case",
        sa.Column(
            "updated_by", sa.Integer(), sa.ForeignKey("user.id"), nullable=True
        ),
    )
    op.create_foreign_key(
        "case_updated_by_user_constraint",
        "case",
        "user",
        ["updated_by"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint(
        "case_updated_by_user_constraint", "case", type_="foreignkey"
    )
    op.drop_column("case", "updated_by")

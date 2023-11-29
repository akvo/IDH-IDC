"""remove segment column from visualization table

Revision ID: 07ab8a041566
Revises: d52c10a01532
Create Date: 2023-11-13 04:17:58.416148

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "07ab8a041566"
down_revision: Union[str, None] = "d52c10a01532"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint(
        "visualization_segment_constraint", "visualization", type_="foreignkey"
    )
    op.drop_constraint(
        "visualization_segment_tab_unique", "visualization", type_="unique"
    )
    op.drop_column("visualization", "segment")


def downgrade() -> None:
    op.add_column(
        "visualization",
        sa.Column("segment", sa.Integer(), sa.ForeignKey("segment.id")),
    )
    op.create_foreign_key(
        "visualization_segment_constraint",
        "visualization",
        "segment",
        ["segment"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_unique_constraint(
        "visualization_segment_tab_unique",
        "visualization",
        ["segment", "tab"],
    )

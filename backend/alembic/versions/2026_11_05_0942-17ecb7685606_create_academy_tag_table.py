"""create_academy_tag_table

Revision ID: 17ecb7685606
Revises: 413e4c18b8eb
Create Date: 2026-11-05 09:42:18.431994

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '17ecb7685606'
down_revision: Union[str, None] = '413e4c18b8eb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "academy_tag",
        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            autoincrement=True,
            nullable=False,
        ),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("slug", sa.String(length=100), nullable=False),
        sa.Column(
            "order_index",
            sa.Integer(),
            nullable=False,
            server_default=sa.text("0"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )

    op.create_index(
        "ix_academy_tag_id",
        "academy_tag",
        ["id"],
        unique=False,
    )
    op.create_index(
        "ix_academy_tag_name",
        "academy_tag",
        ["name"],
        unique=True,
    )
    op.create_index(
        "ix_academy_tag_slug",
        "academy_tag",
        ["slug"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_academy_tag_slug", table_name="academy_tag")
    op.drop_index("ix_academy_tag_name", table_name="academy_tag")
    op.drop_index("ix_academy_tag_id", table_name="academy_tag")
    op.drop_table("academy_tag")

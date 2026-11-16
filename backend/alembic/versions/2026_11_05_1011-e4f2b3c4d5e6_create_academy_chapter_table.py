"""create_academy_chapter_table

Revision ID: e4f2b3c4d5e6
Revises: d3e1a2b3c4d5
Create Date: 2026-11-05 10:11:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e4f2b3c4d5e6'
down_revision: Union[str, None] = 'd3e1a2b3c4d5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "academy_chapter",
        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            autoincrement=True,
            nullable=False,
        ),
        sa.Column(
            "module_id",
            sa.Integer(),
            sa.ForeignKey("academy_module.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("chapter_number", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("content_html", sa.Text(), nullable=True),
        sa.Column(
            "estimated_minutes",
            sa.Integer(),
            nullable=False,
            server_default="5",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
        sa.UniqueConstraint(
            "module_id",
            "chapter_number",
            name="uq_academy_chapter_module_number",
        ),
    )

    op.create_index(
        "ix_academy_chapter_id",
        "academy_chapter",
        ["id"],
        unique=False,
    )
    op.create_index(
        "ix_academy_chapter_module_id",
        "academy_chapter",
        ["module_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_academy_chapter_module_id", table_name="academy_chapter")
    op.drop_index("ix_academy_chapter_id", table_name="academy_chapter")
    op.drop_table("academy_chapter")

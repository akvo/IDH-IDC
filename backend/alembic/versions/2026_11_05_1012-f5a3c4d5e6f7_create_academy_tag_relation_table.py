"""create_academy_tag_relation_table

Revision ID: f5a3c4d5e6f7
Revises: e4f2b3c4d5e6
Create Date: 2026-11-05 10:12:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f5a3c4d5e6f7'
down_revision: Union[str, None] = 'e4f2b3c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "academy_tag_relation",
        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            autoincrement=True,
            nullable=False,
        ),
        sa.Column(
            "tag_id",
            sa.Integer(),
            sa.ForeignKey("academy_tag.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "module_id",
            sa.Integer(),
            sa.ForeignKey("academy_module.id", ondelete="CASCADE"),
            nullable=True,
        ),
        sa.Column(
            "chapter_id",
            sa.Integer(),
            sa.ForeignKey("academy_chapter.id", ondelete="CASCADE"),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.CheckConstraint(
            "(module_id IS NOT NULL AND chapter_id IS NULL) OR "
            "(module_id IS NULL AND chapter_id IS NOT NULL)",
            name="ck_academy_tag_relation_target_xor",
        ),
        sa.UniqueConstraint(
            "tag_id",
            "module_id",
            name="uq_academy_tag_relation_tag_module",
        ),
        sa.UniqueConstraint(
            "tag_id",
            "chapter_id",
            name="uq_academy_tag_relation_tag_chapter",
        ),
    )

    op.create_index(
        "ix_academy_tag_relation_id",
        "academy_tag_relation",
        ["id"],
        unique=False,
    )
    op.create_index(
        "ix_academy_tag_relation_tag_id",
        "academy_tag_relation",
        ["tag_id"],
        unique=False,
    )
    op.create_index(
        "ix_academy_tag_relation_module_id",
        "academy_tag_relation",
        ["module_id"],
        unique=False,
    )
    op.create_index(
        "ix_academy_tag_relation_chapter_id",
        "academy_tag_relation",
        ["chapter_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_academy_tag_relation_chapter_id",
        table_name="academy_tag_relation",
    )
    op.drop_index(
        "ix_academy_tag_relation_module_id",
        table_name="academy_tag_relation",
    )
    op.drop_index(
        "ix_academy_tag_relation_tag_id",
        table_name="academy_tag_relation",
    )
    op.drop_index(
        "ix_academy_tag_relation_id",
        table_name="academy_tag_relation",
    )
    op.drop_table("academy_tag_relation")

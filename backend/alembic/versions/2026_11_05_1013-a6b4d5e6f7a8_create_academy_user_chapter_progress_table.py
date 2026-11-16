"""create_academy_user_chapter_progress_table

Revision ID: a6b4d5e6f7a8
Revises: f5a3c4d5e6f7
Create Date: 2026-11-05 10:13:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'a6b4d5e6f7a8'
down_revision: Union[str, None] = 'f5a3c4d5e6f7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Safely create enum type if it does not already exist
    status_enum = postgresql.ENUM(
        "not_started",
        "in_progress",
        "completed",
        name="academy_chapter_progress_status",
        create_type=False,
    )
    status_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "academy_user_chapter_progress",
        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            autoincrement=True,
            nullable=False,
        ),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("user.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "chapter_id",
            sa.Integer(),
            sa.ForeignKey("academy_chapter.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "status",
            status_enum,
            nullable=False,
            server_default="not_started",
        ),
        sa.Column("last_opened_at", sa.DateTime(), nullable=True),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
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
            "user_id",
            "chapter_id",
            name="uq_academy_user_chapter_progress_user_chapter",
        ),
    )

    op.create_index(
        "ix_academy_user_chapter_progress_id",
        "academy_user_chapter_progress",
        ["id"],
        unique=False,
    )
    op.create_index(
        "ix_academy_user_chapter_progress_user_id",
        "academy_user_chapter_progress",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        "ix_academy_user_chapter_progress_chapter_id",
        "academy_user_chapter_progress",
        ["chapter_id"],
        unique=False,
    )
    op.create_index(
        "ix_academy_user_chapter_progress_status",
        "academy_user_chapter_progress",
        ["status"],
        unique=False,
    )
    op.create_index(
        "ix_academy_user_chapter_progress_last_opened_at",
        "academy_user_chapter_progress",
        ["last_opened_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_academy_user_chapter_progress_last_opened_at",
        table_name="academy_user_chapter_progress",
    )
    op.drop_index(
        "ix_academy_user_chapter_progress_status",
        table_name="academy_user_chapter_progress",
    )
    op.drop_index(
        "ix_academy_user_chapter_progress_chapter_id",
        table_name="academy_user_chapter_progress",
    )
    op.drop_index(
        "ix_academy_user_chapter_progress_user_id",
        table_name="academy_user_chapter_progress",
    )
    op.drop_index(
        "ix_academy_user_chapter_progress_id",
        table_name="academy_user_chapter_progress",
    )
    op.drop_table("academy_user_chapter_progress")
    op.execute(sa.text("DROP TYPE IF EXISTS academy_chapter_progress_status;"))

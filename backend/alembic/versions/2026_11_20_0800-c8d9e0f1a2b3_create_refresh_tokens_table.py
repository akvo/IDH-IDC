"""create refresh_tokens table

Revision ID: c8d9e0f1a2b3
Revises: b7c8d9e0f1a2
Create Date: 2026-11-20 08:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c8d9e0f1a2b3"
down_revision: Union[str, None] = "b7c8d9e0f1a2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    table_existed = inspector.has_table("refresh_tokens")
    if not table_existed:
        op.create_table(
            "refresh_tokens",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("token_hash", sa.String(length=64), nullable=False),
            sa.Column("family_id", sa.String(length=64), nullable=False),
            sa.Column(
                "remember_me",
                sa.Boolean(),
                nullable=False,
                server_default=sa.text("false"),
            ),
            sa.Column("expires_at", sa.DateTime(), nullable=False),
            sa.Column("revoked_at", sa.DateTime(), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(),
                nullable=False,
                server_default=sa.func.now(),
            ),
            sa.ForeignKeyConstraint(
                ["user_id"], ["user.id"], ondelete="CASCADE"
            ),
            sa.PrimaryKeyConstraint("id"),
        )

    existing_indexes = (
        {idx["name"] for idx in inspector.get_indexes("refresh_tokens")}
        if table_existed
        else set()
    )
    index_specs = [
        (op.f("ix_refresh_tokens_id"), ["id"], False),
        (op.f("ix_refresh_tokens_user_id"), ["user_id"], False),
        (op.f("ix_refresh_tokens_token_hash"), ["token_hash"], True),
        (op.f("ix_refresh_tokens_family_id"), ["family_id"], False),
    ]
    for name, cols, unique in index_specs:
        if name not in existing_indexes:
            op.create_index(name, "refresh_tokens", cols, unique=unique)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if not inspector.has_table("refresh_tokens"):
        return
    existing_indexes = {
        idx["name"] for idx in inspector.get_indexes("refresh_tokens")
    }
    for name in (
        op.f("ix_refresh_tokens_family_id"),
        op.f("ix_refresh_tokens_token_hash"),
        op.f("ix_refresh_tokens_user_id"),
        op.f("ix_refresh_tokens_id"),
    ):
        if name in existing_indexes:
            op.drop_index(name, table_name="refresh_tokens")
    op.drop_table("refresh_tokens")

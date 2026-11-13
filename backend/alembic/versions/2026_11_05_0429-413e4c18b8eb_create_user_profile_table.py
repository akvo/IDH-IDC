"""create_user_profile_table

Revision ID: 413e4c18b8eb
Revises: 3g4h5i6j7k8l
Create Date: 2026-11-05 04:29:09.049390

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "413e4c18b8eb"
down_revision: Union[str, None] = "3g4h5i6j7k8l"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_profile",
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
        sa.Column("first_name", sa.String(length=125), nullable=True),
        sa.Column("last_name", sa.String(length=125), nullable=True),
        sa.Column("company_name", sa.String(length=255), nullable=True),
        sa.Column("company_type", sa.String(length=100), nullable=True),
        sa.Column("sector", sa.String(length=100), nullable=True),
        sa.Column(
            "region_id",
            sa.Integer(),
            sa.ForeignKey("region.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("region_name", sa.String(length=125), nullable=True),
        sa.Column(
            "commodities",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
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
    )

    op.create_index(
        "ix_user_profile_id",
        "user_profile",
        ["id"],
        unique=True,
    )

    op.create_index(
        "ix_user_profile_user_id",
        "user_profile",
        ["user_id"],
        unique=True,
    )

    op.create_index(
        "ix_user_profile_region_id",
        "user_profile",
        ["region_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_user_profile_region_id", table_name="user_profile")
    op.drop_index("ix_user_profile_user_id", table_name="user_profile")
    op.drop_index("ix_user_profile_id", table_name="user_profile")
    op.drop_table("user_profile")

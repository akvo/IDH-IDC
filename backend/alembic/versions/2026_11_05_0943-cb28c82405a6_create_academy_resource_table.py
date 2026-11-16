"""create_academy_resource_table

Revision ID: cb28c82405a6
Revises: 17ecb7685606
Create Date: 2026-11-05 09:43:55.477457

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'cb28c82405a6'
down_revision: Union[str, None] = '17ecb7685606'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Safely create enum type if it does not already exist
    resource_type_enum = postgresql.ENUM(
        "Guidance",
        "Organisation",
        "Template",
        "Tool",
        name="academy_resource_type",
        create_type=False,
    )
    resource_type_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "academy_resource",
        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            autoincrement=True,
            nullable=False,
        ),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column(
            "resource_type",
            resource_type_enum,
            nullable=False,
        ),
        sa.Column("file_url", sa.String(length=500), nullable=False),
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
        "ix_academy_resource_id",
        "academy_resource",
        ["id"],
        unique=False,
    )
    op.create_index(
        "ix_academy_resource_resource_type",
        "academy_resource",
        ["resource_type"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_academy_resource_resource_type",
        table_name="academy_resource",
    )
    op.drop_index("ix_academy_resource_id", table_name="academy_resource")
    op.drop_table("academy_resource")
    op.execute(sa.text("DROP TYPE IF EXISTS academy_resource_type;"))

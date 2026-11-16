"""create_academy_glossary_term_table

Revision ID: cb29ec330c92
Revises: cb28c82405a6
Create Date: 2026-11-05 09:45:47.709083

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'cb29ec330c92'
down_revision: Union[str, None] = 'cb28c82405a6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Safely create enum type if it does not already exist
    term_type_enum = postgresql.ENUM(
        "Core",
        "Finance",
        "Additional",
        name="academy_glossary_term_type",
        create_type=False,
    )
    term_type_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "academy_glossary_term",
        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            autoincrement=True,
            nullable=False,
        ),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column(
            "term_type",
            term_type_enum,
            nullable=False,
        ),
        sa.Column("definition", sa.Text(), nullable=False),
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
        "ix_academy_glossary_term_id",
        "academy_glossary_term",
        ["id"],
        unique=False,
    )
    op.create_index(
        "ix_academy_glossary_term_name",
        "academy_glossary_term",
        ["name"],
        unique=False,
    )
    op.create_index(
        "ix_academy_glossary_term_term_type",
        "academy_glossary_term",
        ["term_type"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_academy_glossary_term_term_type",
        table_name="academy_glossary_term",
    )
    op.drop_index(
        "ix_academy_glossary_term_name",
        table_name="academy_glossary_term",
    )
    op.drop_index("ix_academy_glossary_term_id", table_name="academy_glossary_term")
    op.drop_table("academy_glossary_term")
    op.execute(sa.text("DROP TYPE IF EXISTS academy_glossary_term_type;"))

"""create pl_practice_indicator table

Revision ID: 47ee5b184ac9
Revises: 0961d6a8663f
Create Date: 2025-03-04 07:07:29.270949

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '47ee5b184ac9'
down_revision: Union[str, None] = '0961d6a8663f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "pl_practice_indicator",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "indicator_group",
            sa.Enum(
                "relative_potential_impact",
                "relative_ease_of_implementation",
                "position_of_business_in_supply_chain",
                "market_formality",
                "total_value_addition_lifecycle",
                "size_of_business_in_value_chain",
                name="indicator_group_type"
            ),
            nullable=True
        ),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("label", sa.String(length=125), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_option", sa.Boolean(), default=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index(op.f("ix_pl_practice_indicator_id"), "pl_practice_indicator", ["id"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_pl_practice_indicator_id"), table_name="pl_practice_indicator")
    op.drop_table("pl_practice_indicator")
    op.execute("DROP TYPE indicator_group_type")

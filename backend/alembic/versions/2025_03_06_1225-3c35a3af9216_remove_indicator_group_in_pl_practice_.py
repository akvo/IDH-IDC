"""remove indicator_group in pl_practice_indicator table

Revision ID: 3c35a3af9216
Revises: 9fc66a6c68e9
Create Date: 2025-03-06 12:25:46.385686

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "3c35a3af9216"
down_revision: Union[str, None] = "9fc66a6c68e9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # First drop the column
    op.drop_column("pl_practice_indicator", "indicator_group")
    # Then drop the enum type
    op.execute("DROP TYPE indicator_group_type")


def downgrade() -> None:
    # Recreate the enum type first
    op.execute(
        """
        CREATE TYPE indicator_group_type AS ENUM (
            'relative_potential_impact',
            'relative_ease_of_implementation',
            'position_of_business_in_supply_chain',
            'market_formality',
            'total_value_addition_lifecycle',
            'size_of_business_in_value_chain'
        )
    """
    )

    # Add back the column with the enum type
    op.add_column(
        "pl_practice_indicator",
        sa.Column(
            "indicator_group",
            sa.Enum(
                "relative_potential_impact",
                "relative_ease_of_implementation",
                "position_of_business_in_supply_chain",
                "market_formality",
                "total_value_addition_lifecycle",
                "size_of_business_in_value_chain",
                name="indicator_group_type",
            ),
            nullable=True,
        ),
    )

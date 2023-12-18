"""alter reference data table with new columns structure

Revision ID: 331d556254b2
Revises: 586a2ba6c965
Create Date: 2023-12-15 01:51:36.758711

"""
from typing import Sequence, Union

from alembic import op
from sqlalchemy import func
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "331d556254b2"
down_revision: Union[str, None] = "586a2ba6c965"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop previous columns
    op.drop_column("reference_data", "type")
    op.execute("DROP TYPE IF EXISTS reference_data_type")

    op.drop_column("reference_data", "farm_size")
    op.drop_column("reference_data", "farmer_production")
    op.drop_column("reference_data", "farmgate_price")
    op.drop_column("reference_data", "farmer_expenses")

    # Add new columns
    op.add_column(
        "reference_data",
        sa.Column("region", sa.String(), nullable=True),
    )
    op.add_column(
        "reference_data",
        sa.Column("currency", sa.String(), nullable=True),
    )
    op.add_column(
        "reference_data",
        sa.Column("source", sa.String(), nullable=True),
    )
    op.add_column(
        "reference_data",
        sa.Column("link", sa.String(), nullable=True),
    )
    op.add_column(
        "reference_data",
        sa.Column("notes", sa.String(), nullable=True),
    )
    op.add_column(
        "reference_data",
        sa.Column("confidence_level", sa.String(), nullable=True),
    )
    op.add_column(
        "reference_data",
        sa.Column("range", sa.String(), nullable=True),
    )
    op.add_column(
        "reference_data",
        sa.Column("type", sa.String(), nullable=True),
    )
    op.add_column(
        "reference_data",
        sa.Column(
            "area",
            sa.Float(),
            nullable=True,
        ),
    )
    op.add_column(
        "reference_data",
        sa.Column(
            "volume",
            sa.Float(),
            nullable=True,
        ),
    )
    op.add_column(
        "reference_data",
        sa.Column(
            "price",
            sa.Float(),
            nullable=True,
        ),
    )
    op.add_column(
        "reference_data",
        sa.Column(
            "cost_of_production",
            sa.Float(),
            nullable=True,
        ),
    )
    op.add_column(
        "reference_data",
        sa.Column("area_size_unit", sa.String(), nullable=True),
    )
    op.add_column(
        "reference_data",
        sa.Column("volume_measurement_unit", sa.String(), nullable=True),
    )
    op.add_column(
        "reference_data",
        sa.Column("cost_of_production_unit", sa.String(), nullable=True),
    )
    op.add_column(
        "reference_data",
        sa.Column("diversified_income_unit", sa.String(), nullable=True),
    )
    op.add_column(
        "reference_data",
        sa.Column(
            "created_by", sa.Integer(), sa.ForeignKey("user.id"), nullable=True
        ),
    )
    op.add_column(
        "reference_data",
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=func.now(),
        ),
    )
    op.add_column(
        "reference_data",
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=func.now(),
            onupdate=func.now(),
        ),
    )


def downgrade() -> None:
    # Drop new columns
    op.drop_column("reference_data", "region")
    op.drop_column("reference_data", "currency")
    op.drop_column("reference_data", "source")
    op.drop_column("reference_data", "link")
    op.drop_column("reference_data", "notes")
    op.drop_column("reference_data", "confidence_level")
    op.drop_column("reference_data", "range")
    op.drop_column("reference_data", "type")
    op.drop_column("reference_data", "area")
    op.drop_column("reference_data", "volume")
    op.drop_column("reference_data", "price")
    op.drop_column("reference_data", "cost_of_production")
    op.drop_column("reference_data", "area_size_unit")
    op.drop_column("reference_data", "volume_measurement_unit")
    op.drop_column("reference_data", "cost_of_production_unit")
    op.drop_column("reference_data", "diversified_income_unit")
    op.drop_column("reference_data", "created_by")
    op.drop_column("reference_data", "created_at")
    op.drop_column("reference_data", "updated_at")

    # Add previous columns
    op.execute(
        "CREATE TYPE reference_data_type AS ENUM ('baseline_average', 'segment_average')"
    )
    op.add_column(
        "reference_data",
        sa.Column(
            "type",
            sa.Enum(
                "baseline_average",
                "segment_average",
                name="reference_data_type",
            ),
        ),
    )

    op.add_column(
        "reference_data",
        sa.Column(
            "farm_size",
            sa.Float(),
            nullable=True,
            comment="The Farm Land Size in Hectare",
        ),
    )
    op.add_column(
        "reference_data",
        sa.Column(
            "farmer_production",
            sa.Float(),
            nullable=True,
            comment="Farmer Production in KG",
        ),
    )
    op.add_column(
        "reference_data",
        sa.Column(
            "farmgate_price",
            sa.Float(),
            nullable=True,
            comment="Farm Gate Price USD / KG",
        ),
    )
    op.add_column(
        "reference_data",
        sa.Column(
            "farmer_expenses",
            sa.Float(),
            nullable=True,
            comment="Cost of Production in USD",
        ),
    )

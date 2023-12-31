"""create case table

Revision ID: 23904705dc42
Revises: 12be64f1b34c
Create Date: 2023-09-22 09:45:44.914878

"""
from typing import Sequence, Union

from alembic import op
from sqlalchemy import func
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "23904705dc42"
down_revision: Union[str, None] = "12be64f1b34c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "case",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("country", sa.Integer(), sa.ForeignKey("country.id")),
        sa.Column("focus_commodity", sa.Integer(), sa.ForeignKey("commodity.id")),
        sa.Column("currency", sa.String(), nullable=False),
        sa.Column("area_size_unit", sa.String(), nullable=False),
        sa.Column("volume_measurement_unit", sa.String(), nullable=False),
        sa.Column("cost_of_production_unit", sa.String(), nullable=False),
        sa.Column("reporting_period", sa.String(), nullable=False),
        sa.Column(
            "segmentation", sa.SmallInteger(), nullable=False, server_default="0"
        ),
        sa.Column(
            "living_income_study",
            sa.Enum("better_income", "living_income", name="case_living_income_study"),
            nullable=True,
        ),
        sa.Column(
            "multiple_commodities",
            sa.SmallInteger(),
            nullable=False,
            server_default="0",
        ),
        sa.Column("logo", sa.String(), nullable=True),
        sa.Column("private", sa.SmallInteger(), nullable=False, server_default="0"),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("user.id")),
        sa.Column(
            "created_at", sa.DateTime(), nullable=False, server_default=func.now()
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=func.now(),
            onupdate=func.now(),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["country"],
            ["country.id"],
            name="case_country_constraint",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["created_by"],
            ["user.id"],
            name="case_created_by_constraint",
            ondelete="CASCADE",
        ),
    )
    op.create_index(op.f("ix_case_id"), "case", ["id"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_case_id"), table_name="case")
    op.drop_table("case")
    op.execute("DROP TYPE case_living_income_study")

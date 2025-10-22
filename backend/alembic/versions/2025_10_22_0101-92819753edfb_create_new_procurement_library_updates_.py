"""create new procurement library updates oct 2025

Revision ID: 92819753edfb
Revises: 7d088afac59f
Create Date: 2025-10-22 01:01:07.013270

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '92819753edfb'
down_revision: Union[str, None] = '7d088afac59f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # === pl_category ===
    op.create_table(
        "pl_category",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(length=125), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index(op.f("ix_pl_category_id"), "pl_category", ["id"], unique=True)
    op.create_index(op.f("ix_pl_category_name"), "pl_category", ["name"], unique=False)

    # === pl_attribute ===
    op.create_table(
        "pl_attribute",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "category_id",
            sa.Integer(),
            sa.ForeignKey("pl_category.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("label", sa.String(length=125), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index(op.f("ix_pl_attribute_id"), "pl_attribute", ["id"], unique=True)
    op.create_index(op.f("ix_pl_attribute_label"), "pl_attribute", ["label"], unique=False)
    op.create_index(op.f("ix_pl_attribute_category_id"), "pl_attribute", ["category_id"], unique=False)

    # === pl_practice_intervention ===
    op.create_table(
        "pl_practice_intervention",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("label", sa.String(length=225), nullable=False),
        sa.Column("intervention_definition", sa.Text(), nullable=True),
        sa.Column("enabling_conditions", sa.Text(), nullable=True),
        sa.Column("business_rationale", sa.Text(), nullable=True),
        sa.Column("farmer_rationale", sa.Text(), nullable=True),
        sa.Column("risks_n_trade_offs", sa.Text(), nullable=True),
        sa.Column("intervention_impact_income", sa.Text(), nullable=True),
        sa.Column("intervention_impact_env", sa.Text(), nullable=True),
        sa.Column("source_or_evidence", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index(op.f("ix_pl_practice_intervention_id"), "pl_practice_intervention", ["id"], unique=True)
    op.create_index(op.f("ix_pl_practice_intervention_label"), "pl_practice_intervention", ["label"], unique=False)

    # === pl_practice_intervention_tag ===
    op.create_table(
        "pl_practice_intervention_tag",
        sa.Column(
            "practice_intervention_id",
            sa.Integer(),
            sa.ForeignKey("pl_practice_intervention.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "attribute_id",
            sa.Integer(),
            sa.ForeignKey("pl_attribute.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index(op.f("ix_pl_practice_intervention_tag_practice_intervention_id"), "pl_practice_intervention_tag", ["practice_intervention_id"], unique=False)
    op.create_index(op.f("ix_pl_practice_intervention_tag_attribute_id"), "pl_practice_intervention_tag", ["attribute_id"], unique=False)

    # === pl_indicator ===
    op.create_table(
        "pl_indicator",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("label", sa.String(length=125), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_option", sa.Boolean(), server_default=sa.text("false"), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index(op.f("ix_pl_indicator_id"), "pl_indicator", ["id"], unique=True)
    op.create_index(op.f("ix_pl_indicator_name"), "pl_indicator", ["name"], unique=True)
    op.create_index(op.f("ix_pl_indicator_label"), "pl_indicator", ["label"], unique=False)

    # === pl_practice_intervention_indicator_score ===
    op.create_table(
        "pl_practice_intervention_indicator_score",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "practice_intervention_id",
            sa.Integer(),
            sa.ForeignKey("pl_practice_intervention.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "indicator_id",
            sa.Integer(),
            sa.ForeignKey("pl_indicator.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("score", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index(op.f("ix_pl_practice_intervention_indicator_score_id"), "pl_practice_intervention_indicator_score", ["id"], unique=True)
    op.create_index(op.f("ix_pl_practice_intervention_indicator_score_practice_intervention_id"), "pl_practice_intervention_indicator_score", ["practice_intervention_id"], unique=False)
    op.create_index(op.f("ix_pl_practice_intervention_indicator_score_indicator_id"), "pl_practice_intervention_indicator_score", ["indicator_id"], unique=False)
    op.create_unique_constraint(
        "uq_pl_practice_intervention_indicator_score_practice_indicator",
        "pl_practice_intervention_indicator_score",
        ["practice_intervention_id", "indicator_id"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_pl_practice_intervention_indicator_score_practice_indicator", "pl_practice_intervention_indicator_score", type_="unique")
    op.drop_index(op.f("ix_pl_practice_intervention_indicator_score_id"), table_name="pl_practice_intervention_indicator_score")
    op.drop_index(op.f("ix_pl_practice_intervention_indicator_score_practice_intervention_id"), table_name="pl_practice_intervention_indicator_score")
    op.drop_index(op.f("ix_pl_practice_intervention_indicator_score_indicator_id"), table_name="pl_practice_intervention_indicator_score")
    op.drop_table("pl_practice_intervention_indicator_score")

    op.drop_index(op.f("ix_pl_indicator_id"), table_name="pl_indicator")
    op.drop_index(op.f("ix_pl_indicator_name"), table_name="pl_indicator")
    op.drop_index(op.f("ix_pl_indicator_label"), table_name="pl_indicator")
    op.drop_table("pl_indicator")

    op.drop_index(op.f("ix_pl_practice_intervention_tag_practice_intervention_id"), table_name="pl_practice_intervention_tag")
    op.drop_index(op.f("ix_pl_practice_intervention_tag_attribute_id"), table_name="pl_practice_intervention_tag")
    op.drop_table("pl_practice_intervention_tag")

    op.drop_index(op.f("ix_pl_practice_intervention_id"), table_name="pl_practice_intervention")
    op.drop_index(op.f("ix_pl_practice_intervention_label"), table_name="pl_practice_intervention")
    op.drop_table("pl_practice_intervention")

    op.drop_index(op.f("ix_pl_attribute_id"), table_name="pl_attribute")
    op.drop_index(op.f("ix_pl_attribute_label"), table_name="pl_attribute")
    op.drop_index(op.f("ix_pl_attribute_category_id"), table_name="pl_attribute")
    op.drop_table("pl_attribute")

    op.drop_index(op.f("ix_pl_category_id"), table_name="pl_category")
    op.drop_index(op.f("ix_pl_category_name"), table_name="pl_category")
    op.drop_table("pl_category")

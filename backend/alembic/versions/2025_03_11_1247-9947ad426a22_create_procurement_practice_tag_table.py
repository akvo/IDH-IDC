"""create pl_procurement_practice_tag table

Revision ID: 9947ad426a22
Revises: 63323d731e3d
Create Date: 2025-03-11 12:47:08.090255

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9947ad426a22"
down_revision: Union[str, None] = "63323d731e3d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Check if the table already exists before creating it
    if not op.get_bind().dialect.has_table(
        op.get_bind(), "pl_procurement_practice_tag"
    ):
        op.create_table(
            "pl_procurement_practice_tag",
            sa.Column(
                "practice_id",
                sa.Integer(),
                sa.ForeignKey("pl_practice.id", ondelete="CASCADE"),
                primary_key=True,
            ),
            sa.Column(
                "procurement_process_id",
                sa.Integer(),
                sa.ForeignKey("pl_procurement_process.id", ondelete="CASCADE"),
                primary_key=True,
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
            op.f("ix_pl_procurement_practice_tag_practice_id"),
            "pl_procurement_practice_tag",
            ["practice_id"],
        )
        op.create_index(
            op.f("ix_pl_procurement_practice_tag_procurement_process_id"),
            "pl_procurement_practice_tag",
            ["procurement_process_id"],
        )


def downgrade() -> None:
    # Check if the table exists before dropping it
    if op.get_bind().dialect.has_table(op.get_bind(), "pl_procurement_practice_tag"):
        # Check if the indexes exist before dropping them
        if op.get_bind().dialect.has_index(
            op.get_bind(),
            "pl_procurement_practice_tag",
            "ix_pl_procurement_practice_tag_practice_id",
        ):
            op.drop_index(
                op.f("ix_pl_procurement_practice_tag_practice_id"),
                table_name="pl_procurement_practice_tag",
            )
        if op.get_bind().dialect.has_index(
            op.get_bind(),
            "pl_procurement_practice_tag",
            "ix_pl_procurement_practice_tag_procurement_process_id",
        ):
            op.drop_index(
                op.f("ix_pl_procurement_practice_tag_procurement_process_id"),
                table_name="pl_procurement_practice_tag",
            )
        # Drop the table
        op.drop_table("pl_procurement_practice_tag")

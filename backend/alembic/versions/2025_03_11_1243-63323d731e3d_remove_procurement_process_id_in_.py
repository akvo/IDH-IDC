"""remove procurement_process_id in practice table

Revision ID: 63323d731e3d
Revises: 3c35a3af9216
Create Date: 2025-03-11 12:43:14.528296

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "63323d731e3d"
down_revision: Union[str, None] = "3c35a3af9216"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint(
        "pl_practice_procurement_process_id_fkey", "pl_practice", type_="foreignkey"
    )
    op.drop_column("pl_practice", "procurement_process_id")


def downgrade() -> None:
    op.add_column(
        "pl_practice",
        sa.Column(
            "procurement_process_id",
            sa.Integer(),
            sa.ForeignKey("pl_procurement_process.id", ondelete="CASCADE"),
        ),
    )

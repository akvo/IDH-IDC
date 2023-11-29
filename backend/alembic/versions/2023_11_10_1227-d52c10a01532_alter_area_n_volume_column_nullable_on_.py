"""alter area n volume column nullable on case commodity table

Revision ID: d52c10a01532
Revises: 402fff266df0
Create Date: 2023-11-10 12:27:15.604318

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "d52c10a01532"
down_revision: Union[str, None] = "402fff266df0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("case_commodity", "area_size_unit", nullable=True)
    op.alter_column("case_commodity", "volume_measurement_unit", nullable=True)


def downgrade() -> None:
    op.alter_column("case_commodity", "area_size_unit", nullable=False)
    op.alter_column("case_commodity", "volume_measurement_unit", nullable=False)

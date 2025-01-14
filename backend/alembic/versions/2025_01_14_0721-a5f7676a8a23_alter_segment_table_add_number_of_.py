"""alter segment table add number_of_farmers column

Revision ID: a5f7676a8a23
Revises: 4bb17002ebca
Create Date: 2025-01-14 07:21:08.343305

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a5f7676a8a23"
down_revision: Union[str, None] = "4bb17002ebca"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "segment", sa.Column("number_of_farmers", sa.Integer(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("segment", "number_of_farmers")

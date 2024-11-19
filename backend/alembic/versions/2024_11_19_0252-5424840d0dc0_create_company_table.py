"""create company table

Revision ID: 5424840d0dc0
Revises: be2d762cd54b
Create Date: 2024-11-19 02:52:58.790970

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "5424840d0dc0"
down_revision: Union[str, None] = "be2d762cd54b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "company",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_company_id"), "company", ["id"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_company_id"), table_name="company")
    op.drop_table("company")

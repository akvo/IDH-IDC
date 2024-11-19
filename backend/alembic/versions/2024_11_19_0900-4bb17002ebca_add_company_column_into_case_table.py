"""add company column into case table

Revision ID: 4bb17002ebca
Revises: 3b081723dd88
Create Date: 2024-11-19 09:00:36.400177

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "4bb17002ebca"
down_revision: Union[str, None] = "3b081723dd88"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "case",
        sa.Column(
            "company", sa.Integer(), sa.ForeignKey("company.id"), nullable=True
        ),
    )
    op.create_foreign_key(
        "case_company_constraint",
        "case",
        "company",
        ["company"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint("case_company_constraint", "case", type_="foreignkey")
    op.drop_column("case", "company")

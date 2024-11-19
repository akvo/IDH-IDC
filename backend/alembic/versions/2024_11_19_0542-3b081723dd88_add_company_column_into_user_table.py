"""add company column into user table

Revision ID: 3b081723dd88
Revises: 5424840d0dc0
Create Date: 2024-11-19 05:42:35.225735

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "3b081723dd88"
down_revision: Union[str, None] = "5424840d0dc0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "user",
        sa.Column(
            "company", sa.Integer(), sa.ForeignKey("company.id"), nullable=True
        ),
    )
    op.create_foreign_key(
        "user_company_constraint",
        "user",
        "company",
        ["company"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint("user_company_constraint", "user", type_="foreignkey")
    op.drop_column("user", "company")

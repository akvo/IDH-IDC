"""create count case by country n company view

Revision ID: 9d3ab730e481
Revises: a5f7676a8a23
Create Date: 2025-01-28 04:06:40.868191

"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "9d3ab730e481"
down_revision: Union[str, None] = "a5f7676a8a23"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
            CREATE VIEW case_count_by_company_and_country AS
            SELECT
                c.country AS country_id,
                co.name AS country,
                com.id AS company_id,
                com.name AS company,
                COUNT(DISTINCT c.id) AS case_count,
                COALESCE(SUM(s.number_of_farmers), 0) AS total_farmers
            FROM
                public.case c
            JOIN
                country co ON c.country = co.id
            JOIN
                company com ON c.company = com.id
            LEFT JOIN
                segment s ON s.case = c.id
            GROUP BY
                c.country, co.name, com.id, com.name
            ORDER BY
                country_id, company_id;
        """
    )


def downgrade() -> None:
    op.execute("DROP VIEW case_count_by_company_and_country")

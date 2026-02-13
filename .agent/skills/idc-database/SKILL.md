---
name: idc-database
description: Database management, seeding, and migrations for IDH-IDC.
---

# IDC Database Skills

Instructions for database operations including seeding and migrations.

## Data Seeding

- **Seed Master Data**:
  ```bash
  ./dc.sh exec backend ./seed_master.sh
  ```
- **Seed Users**:
  ```bash
  ./dc.sh exec backend python -m seeder.user
  ```
  _Note: Default password for new CLI-added users is `password`_

## Migrations

- **Create Migration**:
  ```bash
  ./dc.sh exec backend alembic revision --autogenerate -m "description"
  ```
- **Apply Migrations**:
  ```bash
  ./dc.sh exec backend alembic upgrade head
  ```

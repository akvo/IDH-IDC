---
description: Seed master data and users for IDH-IDC
---

1. Seed master data:
// turbo
   ```bash
   ./dc.sh exec backend ./seed_master.sh
   ```
2. Seed administrative users:
// turbo
   ```bash
   ./dc.sh exec backend python -m seeder.user
   ```
3. Verify seeding by checking the database or logging in.

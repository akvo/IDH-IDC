---
description: View logs of specific containers
---

1. ASK the user for the container name (e.g., `backend`, `frontend`, `db`).
2. Run the log command:
// turbo
   ```bash
   ./dc.sh log --follow <container_name>
   ```

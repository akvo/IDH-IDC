---
description: Analyze active vs idle time spent on tasks and issues
---

1. Run the automated time analysis script for the specific issue or task keyword:
// turbo
   ```bash
   ./.agent/scripts/analyze_time.py <issue_number_or_keyword>
   ```
2. Verify the output against your own memory of the day's activities.
3. If the script missed some early sessions (e.g., sessions where the issue number starting being used later), manually check the `brain` logs for those conversation IDs.
4. Prepare the final summary table based on the script's output.

---
description: Run automated time analysis and group activities by issue number
---

1. **Ask the user for analysis criteria**:
   - Prompt the user to confirm if they want to check for **Today** or a **Specific Date**.
   - Ask if they wish to filter by **Specific Issue(s)** or keywords.
   - Wait for the user's input before proceeding.

2. **Run the automated time analysis script** based on the user's choice:
   - **Scenario A: All activities for today**
     ```bash
     ./.agent/scripts/analyze_time.py
     ```
   - **Scenario B: Today's activities filtered by issue**
     ```bash
     ./.agent/scripts/analyze_time.py #713
     ```
   - **Scenario C: All activities for a specific date**
     ```bash
     ./.agent/scripts/analyze_time.py --date 2026-02-13
     ```
   - **Scenario D: Specific date filtered by multiple keywords**
     ```bash
     ./.agent/scripts/analyze_time.py 713 Persistence --date 2026-02-13
     ```

3. The script will automatically group activities by issue number and provide an explanation for idle gaps.
4. Verify the output against your own memory of the activities.
5. Prepare the final summary table based on the script's output.

---
description: Analyze active vs idle time spent on tasks and issues
---

1. Analyze conversation history in `.gemini/antigravity/brain/` to identify sessions related to the user's request (e.g., specific issue number or topic).
2. For each relevant session:
    - Identify the first activity timestamp (e.g., initial research or `task_boundary` call).
    - Identify the last activity timestamp (final `notify_user` or commit).
    - Note any gaps longer than 45 minutes as "Idle/Screen Asleep" time.
3. Use `git log` on modified files to verify the "Heads-down" time based on commit intervals and file modification times.
4. Calculate the "Total Active Time" by subtracting the Idle gaps from the total session duration.
5. Provide a tabular summary including:
    - Session Focus
    - Active Start/End
    - Duration
    - Total Heads-down time.

---
description: Commit changes to git following project guidelines
---
1. Ask the user for the Issue Number (e.g., #123).
2. Analyze the changes and PROPOSE a descriptive, informative commit message to the user.
3. Update `GEMINI.md` under the "Recent Changes" section with the new features or fixes.
4. Stage all changes:
   ```bash
   git add .
   ```
5. Commit the changes using the issue number and confirmed message:
   ```bash
   git commit -m "[#ISSUE_NUMBER] <Message>"
   ```
6. Confirm the commit was successful.
7. Ask the user if they want to push the changes now or later.
    - If now, ask for the branch name and run:
      ```bash
      git push origin <branch_name>
      ```
    - If later, remind them to push manually.

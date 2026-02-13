---
description: Commit changes to git following project guidelines
---
11. Inspect the changes by running `git status` and `git diff --stat`.
// turbo
   ```bash
   git status && git diff --stat
   ```
2. Analyze the changes to determine if they should be a single commit or split into multiple commits.
   - If there are many files changed or unrelated changes, propose splitting the commits.
   - If the changes are focused and related, propose a single commit.
3. Ask the user for the Issue Number (e.g., #123) and if they agree with your proposed commit structure (single vs split).
4. Analyze the changes deeply and PROPOSE detailed commit message(s) to the user.
5. Update `GEMINI.md` under the "Recent Changes" section with the new features or fixes.
6. Stage the changes.
   - If single commit: `git add .`
   - If split commits: `git add <file_paths>` for the first batch.
7. Commit the changes:
   ```bash
   git commit -m "[#ISSUE_NUMBER] <Message>"
   ```
   *Repeat steps 6-7 if splitting commits.*
8. Confirm the commit(s) were successful.
9. Ask the user if they want to push the changes now or later.
    - If now, ask for the branch name and run:
      ```bash
      git push origin <branch_name>
      ```
    - If later, remind them to push manually.

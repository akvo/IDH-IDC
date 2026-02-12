---
description: Create a Pull Request with an informative title and clear description
---

1. ASK the user for the **Base Branch** (e.g., `staging`, `main`) and the **Issue Number** (e.g., `#713`).
2. Identify the current branch name and ensure all changes are committed and pushed.
// turbo
   ```bash
   git branch --show-current
   ```
// turbo
   ```bash
   git push origin $(git branch --show-current)
   ```
3. Analyze the changes since the **Base Branch** to generate the PR content.
   - Run `git diff <base_branch>...<current_branch> --stat` to see the changed files.
   - Run `git log <base_branch>...<current_branch> --oneline` to see the commit history.
4. Ensure `GEMINI.md` is updated with the summarized changes under the "Recent Changes" section.
5. PROPOSE a Pull Request Title and Description to the user for approval.
   - **PR Title**: `[#ISSUE_NUMBER] Concise summary of the feature/fix`.
   - **PR Description**:
     - **Summary**: Overview of accomplishments.
     - **Key Changes**: List of main technical changes.
     - **Verification**: Proof of work (e.g., linting, manual tests).
5. Once approved, create the PR:
   - **Option A: GitHub CLI**
     ```bash
     gh pr create --base <base_branch> --title "<APPROVED_TITLE>" --body "<APPROVED_DESCRIPTION>"
     ```
   - **Option B: Web UI**
     - Provide link: `https://github.com/[ORG]/[REPO]/compare/<base_branch>...[CURRENT_BRANCH]`
     - Provide title/description for copy-paste.
6. Confirm creation and share the PR link.

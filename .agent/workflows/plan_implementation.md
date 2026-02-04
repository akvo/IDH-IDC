---
description: Create a comprehensive implementation plan for a feature or bug fix following project standards.
---

1. **Analyze Request**: Understand the user's objective (Feature or Bug Fix).
2. **Context Gathering**: Read relevant files (`view_file`) to understand the current state.
3. **Draft Plan**: Create or update `implementation_plan.md` in the artifacts directory.
   - **Issue Number**: The Issue/Task ID (e.g. #123, [IMPORT-6]).
   - **Goal**: Brief summary of the problem and what the change accomplishes.
   - **User Review Required**: Highlight breaking changes or design decisions.
   - **Proposed Changes**: Detailed breakdown by file.
     - **Frontend Standards**:
       - **Framework**: React (Functional Components + Hooks).
       - **UI Library**: Ant Design (antd).
       - **State Management**: Pullstate.
       - **Linting**: Must pass `docker compose exec frontend yarn lint` (ESLint).
       - **Testing**: `docker compose exec frontend yarn test:ci` or interactive `yarn test`.
     - **Backend Standards**:
       - **Framework**: FastAPI (Python).
       - **Database**: SQLAlchemy + Alembic migrations.
       - **Linting/Testing**: Must pass `./dc.sh exec backend ./check.sh` (includes `flake8` and `pytest`).
   - **Verification Plan**:
     - **Automated**: List specific commands to run (e.g., `yarn lint`, `./check.sh`).
     - **Manual**: Step-by-step browser verification instructions.
4. **Review**: Notify user to review usage of `notify_user` with the plan file.
5. **Approval**: Wait for user approval before keeping the task.

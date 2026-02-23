---
description: Implement approved user stories using the IDH-IDC stack (FastAPI/React/Docker)
---

# 2-Implement — IDH-IDC Stack Workflow

Follow these steps to implement an approved user story in the IDH-IDC project.

## 1. Story Setup
- **Load Story**: Read the `agent_docs/stories/[id]-[slug].md`.
- **Verify Status**: Ensure `Status: Approved`.
- **Plan Tasks**: Break the story's acceptance criteria into specific code changes.

## 2. Red: Write Failing Test
- **Backend**:
  - Create a new test file in `backend/tests/` or add to existing one.
  - Prefix unit tests with `test_unit_`.
  - // turbo
  - `./dc.sh run --rm backend ./check.sh` (Confirm failure)
- **Frontend**:
  - Create/Update tests in `frontend/src/`.
  - // turbo
  - `./dc.sh run --rm frontend yarn test:ci` (Confirm failure)

## 3. Green: Implement Code
- Apply changes strictly following [.agent/rules/PROJECT_RULES.md](file:///Users/galihpratama/Sites/IDH-IDC/.agent/rules/PROJECT_RULES.md).
- Use `./dc.sh exec <service> <command>` for rapid iteration.

## 4. Refactor: Quality Check
- **Backend**:
  - // turbo
  - `./dc.sh run --rm backend ./check.sh` (Confirm pass)
- **Frontend**:
  - // turbo
  - `./dc.sh run --rm frontend yarn lint`
  - `./dc.sh run --rm frontend yarn test:ci` (Confirm pass)

## 5. Verification & Updates
- Verify UI changes manually if applicable.
- Update `GEMINI.md` "Recent Changes" with the issue number `[#ISSUE_NUMBER]`.
- Mark story as `Status: Implemented` in its markdown file.

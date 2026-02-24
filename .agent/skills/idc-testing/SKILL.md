---
name: idc-testing
description: Testing and linting for IDH-IDC backend and frontend. Use `/run_frontend_lint`, `/run_backend_test`, and `/run_frontend_test` for automated verification.
---

# IDC Testing Skills

Quality assurance workflows including unit tests and linting.

## Backend Verification

- **Full Check**:
  ```bash
  ./dc.sh exec backend ./check.sh
  ```
  _Includes pytest and flake8. **WARNING**: DO NOT run backend tests individually; they share state and depend on sequential execution. Always use `check.sh`._

- **Naming Conventions**:
    - **Unit Tests**: Use `test_unit_` prefix (e.g., `test_unit_logic.py`).
    - **Filenaming**: Do NOT include issue numbers in filenames. Use descriptive names instead.

## Frontend Verification

- **Linting**:
  ```bash
  ./dc.sh exec frontend yarn lint
  ```
- **Interactive Tests**:
  ```bash
  ./dc.sh exec frontend yarn test
  ```
- **CI Mode Tests**:
  ```bash
  ./dc.sh exec frontend yarn test:ci
  ```

---
name: idc-antigravity-skills
description: Specialized skills for the IDH-IDC project development and maintenance.
---

# IDC Antigravity Skills

This skill contains specialized workflows and instructions for the IDH-IDC project.

## Technology Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database ORM**: SQLAlchemy
- **Migrations**: Alembic
- **Testing**: Pytest

### Frontend
- **Framework**: React (Create React App)
- **UI Component Library**: Ant Design (antd)
- **State Management**: Pullstate
- **Testing**: Jest, React Testing Library

### Infrastructure
- **Containerization**: Docker, Docker Compose
- **Orchestration**: Kubernetes (Deployment via GitHub Actions)

## Development Workflows

### Environment Setup
- **Prerequisites**: Docker > v19, Docker Compose > v2.1, Docker Sync 0.7.1
- **Start Project**:
  ```bash
  docker volume create idc-docker-sync
  ./dc.sh up -d
  ```
- **Stop Project**:
  ```bash
  ./dc.sh stop
  ```
- **Teardown**:
  ```bash
  ./dc.sh down -t1
  docker volume rm idc-docker-sync
  ```

### Database Management
- **Seed Master Data**:
  ```bash
  ./dc.sh exec backend ./seed_master.sh
  ```
- **Seed Users**:
  ```bash
  ./dc.sh exec backend python -m seeder.user
  ```
  _Note: Default password for new CLI-added users is `password`_

### Testing
- **Backend Tests**:
  ```bash
  ./dc.sh exec backend ./check.sh
  ```
  _Uses `pytest` and `flake8`_

- **Frontend Tests (Interactive)**:
  ```bash
  docker compose exec frontend yarn test
  ```
  _Uses `react-scripts test` (Watch mode)_

- **Frontend Tests (CI/One-off)**:
  ```bash
  docker compose exec frontend yarn test:ci
  ```
  _Runs tests once with coverage (Non-interactive)_

- **Frontend Lint**:
  ```bash
  docker compose exec frontend yarn lint
  ```

### Logging
- **View Logs**:
  ```bash
  ./dc.sh log --follow <container_name>
  ```
  **Available Containers**: `backend`, `frontend`, `mainnetwork`, `db`, `pgadmin`

### Commit and Pull Request
Follow this workflow before submitting any changes:

1. **Verification**: Run the appropriate checks based on the files edited:
    - **Frontend**: Run linting and tests if any frontend files are modified.
      ```bash
      docker compose exec frontend yarn lint
      docker compose exec frontend yarn test:ci
      ```
    - **Backend**: Run checks if any backend files are modified.
      ```bash
      ./dc.sh exec backend ./check.sh
      ```
2. **Commit Message**: Use the issue number in brackets followed by a descriptive message.
   ```bash
   git add .
   git commit -m "[#ISSUE_NUMBER] Descriptive message about the change"
   ```
3. **GEMINI.md Update**: Always update the `Recent Changes` section in `GEMINI.md` to document the feature/fix.
4. **Push and PR**: Push the branch and create a PR into `staging` with a clear description of the logic, UI changes, and verification steps.
   ```bash
   git push origin <branch-name>
   gh pr create --base staging --head <branch-name> --title "[#ISSUE_NUMBER] ..." --body "..."
   ```

## Deployment
- **CI/CD**: GitHub Actions (`.github/workflows/deploy.yml`)
- **Target**: Deploy to "Test Cluster" on push to `main` branch.
- **Process**: Builds Docker images for frontend and backend, pushes to registry, and performs rollout.

## Project Specifics
- **Frontend URL**: [http://localhost:3000](http://localhost:3000)
- **Helper Script**: `dc.sh` is the primary interface for docker operations.

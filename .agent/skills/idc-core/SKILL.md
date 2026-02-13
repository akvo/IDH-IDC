---
name: idc-core
description: Core technology stack, environment setup, and basic usage for IDH-IDC.
---

# IDC Core Skills

General technical information and basic environment operations for the IDH-IDC project.

## Technology Stack

- **Backend**: FastAPI (Python), SQLAlchemy, Alembic, Pytest
- **Frontend**: React (CRA), Ant Design, Pullstate, Jest
- **Infra**: Docker, Docker Compose, Kubernetes

## Environment Setup

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

## Helper Script
- `dc.sh` is the primary interface for most container operations. All `docker compose` commands should ideally be run through `./dc.sh` for consistency.

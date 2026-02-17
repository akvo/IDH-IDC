---
name: idc-core
description: Core technology stack, environment setup, and basic usage for IDH-IDC.
---

# IDC Core Skills

General technical information and basic environment operations for the IDH-IDC project.

Note: For the detailed technical standards and tech stack requirements, refer to [.agent/rules/PROJECT_RULES.md](file:///Users/galihpratama/Sites/IDH-IDC/.agent/rules/PROJECT_RULES.md).

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

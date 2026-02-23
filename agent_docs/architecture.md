# Architecture: Income Driver Calculator (IDC)

## System Overview
The IDC is a classic three-tier web application designed for interactive data modeling and simulation.

```mermaid
graph TD
    User((User))
    Web[React Frontend]
    API[FastAPI Backend]
    DB[(PostgreSQL)]

    User <--> Web
    Web <--> API
    API <--> DB
```

## Tech Stack
- **Frontend**: React (Create React App), Ant Design, SCSS, CaseVisualState (Global Store)
- **Backend**: FastAPI (Python), SQLAlchemy, Alembic Migrations
- **Database**: PostgreSQL
- **Infrastructure**: Docker Compose (Local), Kubernetes (Production)

## Component Architecture (Modelling Tool)
The Advanced Modelling Tool follows a "Single Source of Truth" pattern using a localized state synced with a global store.

```mermaid
sequenceDiagram
    participant UI as AdvancedModellingTool.js
    participant Calc as incomeCalculations.js
    participant Store as CaseVisualState

    UI->>Calc: calculateModellingDriver(inputs)
    Calc-->>UI: rawResult
    UI->>UI: Determine state (surplus, impossible, normal)
    UI->>Store: Sync per-segment model state
```

## Data Model
- **Case**: The root entity for a modeling session.
- **Segment**: A population subset with specific benchmarks and drivers.
- **Scenario**: Modelling configurations (Current, Feasible, Modelled).

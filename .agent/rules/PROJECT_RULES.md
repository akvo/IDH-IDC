These rules define the technical standards, design patterns, and workflow requirements for the IDH-IDC project. All AI agents MUST follow these guidelines to ensure consistency and quality.

## 0. Agent Asset Hierarchy
To maintain alignment across agent resources, we follow this structural hierarchy:
1. **Rules** (`.agent/rules/`): **The Law.** Universal technical standards, design constraints, and mandatory procedures.
2. **Skills** (`.agent/skills/`): **Technical Knowledge.** Deep domain expertise and situational knowledge for specific subsystems.
3. **Workflows** (`.agent/workflows/`): **Recipes.** Actionable, step-by-step procedures for common tasks (e.g., slash commands).

**Synchronicity Mandate**: Whenever a rule in `.agent/rules/` is updated, the agent MUST immediately identify and update all related Skills (`.agent/skills/`), Workflows (`.agent/workflows/`), and associated documentation in the `.agent/` directory to maintain a cohesive source of truth.
## 1. Core Technology Stack

- **Frontend**: React (Create React App), Ant Design, echarts, pullstate.
- **Backend**: FastAPI, SQLAlchemy, Pydantic, Alembic.
- **Infrastructure**: Docker Compose, PostgreSQL.

## 2. Frontend Development Rules & Best Practices

### Design Aesthetics & UI
- **Visual Excellence**: All UI components must feel premium and state-of-the-art.
- **Color Palette**: Use vibrant colors, smooth gradients, and sleek dark modes. Avoid generic browser-default colors.
- **Typography**: Use modern typography (e.g., Inter, Outfit) via Google Fonts.
- **Ant Design (AntD)**: Leverage AntD components for layout, forms, and alerts. Follow AntD's design language but enhance with custom CSS/SCSS where needed.
- **VisualCardWrapper**: Use `VisualCardWrapper` for all chart and visualization containers to ensure consistent title wrapping, responsive headers, and height alignment.
- **Animations**: Implement subtle micro-animations (hover effects, transitions) for enhanced engagement.

### Data & Calculations
- **Rounding**: Enforce 2-decimal rounding for ALL numerical displays related to currency or driver values.
- **Formatting**: Use `InputNumberThousandFormatter` for currency and large number inputs.
- **Functional Updates**: Always use functional updates with `pullstate` (e.g., `update(s => { s.field = value })`) to prevent race conditions.
- **Units**: Always include unit labels (e.g., `kg/acre`, `USD`) in value displays for immediate feasibility verification.

### Performance & State Management
- **Memoization**: Use `useMemo` for expensive calculations (e.g., complex chart data processing) and `useCallback` for functions passed to memoized components.
- **Dependency Arrays**: Strictly follow `react-hooks/exhaustive-deps`. Ensure all variables used inside `useEffect`, `useMemo`, and `useCallback` are included.

### Coding Standards & Linting
- **Linting**: Follow `.eslintrc.json` rules.
    - `jsx-a11y`: Maintain basic accessibility (use `alt` for images, `htmlFor` for labels).
    - `no-unused-vars`: Avoid leaving unused imports or variables.
- **Formatting**: Use Prettier. Imports should be ordered logically: React/Third-party -> Local Components -> Local Assets/Styles.
- **Structure**: Split complex components into granular parts. Use `src/components/chart` for visualizations and `src/lib` for shared logic/utilities.
- **Testing**: Run frontend tests and linting inside the Docker environment using `./dc.sh run --rm frontend yarn test` or `./dc.sh run --rm frontend yarn lint`.

## 3. Backend Development Rules & Best Practices

### Architecture & Patterns
- **Framework**: Use FastAPI path operations.
- **Models**: Use SQLAlchemy for DB models and Pydantic for request/response validation.
- **Migrations**: Always use Alembic for database schema changes.
- **CRUD Logic**: Decouple business logic from route handlers. Use dedicated modules in `backend/db` or `backend/utils`.
- **Authorization**: Use `Depends(verify_*)` from `backend/middleware.py` for granular, role-based access control.

### Performance & Database
- **Session Management**: Always use `Depends(get_db)` to ensure proper database session handling and cleanup.
- **Async Operations**: Use `async`/`await` for all non-blocking I/O operations (database calls, external APIs).

### Coding Standards & Linting
- **Formatting**: Use **Black** (88 characters line length).
- **Linting**: Follow **Flake8** rules (`E203, W503` are ignored for Black compatibility).
- **Testing**: Always include regression tests in `backend/tests` for new features or bug fixes.
    - **Structure**: Use test classes (`class Test...`) to group related tests.
    - **Integration/DB Tests**: Use fixtures provided in `backend/tests/conftest.py` (e.g., `client`, `session`) for any tests requiring database access or API clients.
    - **Unit Tests**: Clearly name unit tests with a `test_unit_` prefix (e.g., `test_unit_calculation.py`) and avoid external dependencies/DB access.
    - **Filenaming**: Filenames MUST be descriptive and MUST NOT include issue numbers (e.g., use `test_unit_seg_bug.py` instead of `test_717_seg_bug.py`).
    - **Execution**: Run tests using `./dc.sh run --rm backend ./check.sh`.

## 4. Workflow & Communication Rules

### Git & Pull Requests
- **Branching**: Use descriptive branch names (e.g., `feature/issue-713-modelling-ui`).
- **Commits**: Follow the format `[#ISSUE_NUMBER] Detailed message`. Always update `GEMINI.md` "Recent Changes" before committing.
- **Issue Confirmation**: Agents MUST explicitly confirm the issue number with the user if there is any ambiguity before documenting it in `GEMINI.md` or using it in a commit.
- **PRs**: Use the `/create_pr` workflow. PR descriptions must include a summary, key changes, and verification proof.

### Time Analysis
- **Logging**: Use `/check_time` to analyze and group activities by issue number.
- **Idle Time**: Be transparent about idle time and activity grouping.

### Agent Behavior
- **Proactiveness**: Be proactive in identifying follow-up tasks (linting, testing, persistence checks).
- **Conciseness**: Keep documentation and communication concise but comprehensive.
- **Consistency**: Maintain established tone and terminology (e.g., "Primary Commodity", "Cost of Production").

## 5. Persistence & State Management Rules
- **Case ID Preservation**: Ensure the `case` ID is always passed and preserved during state updates to ensure successful saves.
- **Per-Segment Persistence**: Implement per-segment persistence for scenario modeling and driver selections.
- **Initialization**: Avoid fragile timeouts for synchronization. Use structured single-pass synchronization lifecycles.
## 6. Scripting & Tooling
- **Docker Environment**: All custom scripts (python, node, shell) MUST be executed within the Docker environment to ensure dependency parity.
- **Workflow Wrapper**: Use `./dc.sh exec <service> <command>` for running scripts on active containers, or `./dc.sh run --rm <service> <command>` for one-off tasks.
- **Dependency Management**: Ensure all required packages are listed in `backend/requirements.txt` or `frontend/package.json`.
- **Location**: Place temporary reproduction or utility scripts in their respective service directories (`backend/` or `frontend/`) to ensure they are mounted inside the container.

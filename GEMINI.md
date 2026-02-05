# IDH-IDC Project Context

## Overview
Income Driver Calculator (IDC) is a web application designed to help companies take smarter, more targeted action to raise farmer income towards a living income in their supply chain.

## Architecture
- **Frontend**: React application (Create React App) using Ant Design, served on port 3000.
- **Backend**: FastAPI (Python) service with SQLAlchemy and Alembic for migrations.
- **Database**: PostgreSQL (port 5432).
- **Infrastructure**: Docker Compose with Docker Sync for development; Kubernetes for deployment.

## Key Workflows
- **Development**: Uses `./dc.sh` wrapper for Docker Compose.
- **Authentication**: Uses JWT tokens stored in cookies (`AUTH_TOKEN`).
- **Authorization**: Role-based access control (Admin, User, etc.).
- **CI/CD**: Automated deployment to test cluster on push to `main`.

## Recent Changes
- **Authentication Improvements (PR #705)**:
    - Fixed infinite redirect loop for unauthenticated users accessing protected routes.
    - Implemented "Redirect After Login" feature to return users to their originally requested page.
    - Resolved circular dependencies in route definitions by extracting `paths.js`.
    - Fixed 404 behavior for unauthenticated users on protected routes.
- **Three Driver Calculator Implementation (Issue #709)**:
    - Implemented `ThreeDriverCalculator` component in Step 4 for advanced income gap analysis.
    - Added `ThreeDriverCombinationChart` with a 4-card table-based UI to visualize driver combinations.
    - Implemented logic to calculate the required third driver value to reach the income target.
    - Integrated dynamic ranges for X and Y axes derived from "Two driver heatmap" configuration.
    - Added color coding (Green/Orange) to indicate feasibility based on driver ranges.
    - Implemented 2-decimal rounding for all numerical displays.
    - Implemented dynamic feasibility color coding for each driver independently.
    - Integrated dynamic descriptions and conditional visibility based on driver selection.
    - Refactored shared card and step styles into `steps.scss`.
    - Finalized UI styling and alignment refinements for the combination chart.
    - Fixed negative calculation results for Land and Animals/Area drivers by correcting formula numerators in `formula.js`.
    - Included unit names (e.g., kilograms/acres) in `ThreeDriverCombinationChart` value boxes for improved readability and immediate feasibility verification.
    - Refined UI styling by removing opacity from X-axis driver boxes and increasing label width and font weight for better alignment.
    - Updated Three Driver calculator description text to be more precise and dynamic.
    - Integrated "Diversified Income" as a selectable driver for three-driver analysis, including full formula and feasibility support.
    - Implemented state persistence for the third driver selection, ensuring it is saved and reloaded across user sessions and segment changes.
    - Fixed heatmap form synchronization: added `useEffect` to ensure form fields correctly load and update from global state.
    - Improved synchronization for adjusted income targets, ensuring global state values are correctly loaded on component mount and updates.
- **Closing the Gap Calculation (PR #706)**:
    - Implemented "Closing the Gap %" calculation to allow adjusting income targets based on a percentage of the remaining gap.
    - Added `inlineView` mode to `AdjustIncomeTarget` for seamless integration in Step 4.
    - Centralized calculation logic to ensure consistency across "Explore" and "Sensitivity Analysis" sections.
- **Multiple Segment Addition Methods (Issue #683)**:
    - Implemented UI to add segments based on different variables for data uploads.
    - Refactored `SegmentForm` into simplified `SegmentForm` (manual) and `DataUploadSegmentForm` (complex).
    - Added inline segment generators with visual grouping and automatic segment management.
    - Enforced 5-segment limit across all addition methods.
    - Added dev workflows for frontend linting and backend testing.
    - Fixed and verified segment value generation for mixed numerical/categorical variables.
    - Fixed UI bug where threshold fields were missing for numerical segments in inline generators.
    - Fixed regression where editing a numerical segment's threshold during mixed segmentation caused other fields to disappear.
    - Synced "Number of Segments" input with actual segment count to reflect deletions in inline generators.
    - Fixed seeder unique constraint violations and updated backend tests for master seeder stability.
    - Implemented interleaved chronological layout for manual segments and generators.
    - Fixed field interactivity: correctly disabled "Number of farmers" for generated categorical/numerical segments while keeping it enabled for manual ones.
    - Implemented manual segment support in Case Import: manual farmer counts are preserved and data filtering is skipped on backend.
    - Fixed 422 error during segmentation submission by making index optional and correctly identifying manual segments via a hidden flag.
    - Preserved interleaved segment ordering across session and save cycles by removing ID-based sorting in the frontend.
    - Optimized segmentation preview fetches with caching to prevent redundant API calls.
    - Improved manual segment count synchronization and allowed 0 as a valid input for cleared states.
- **Single Driver Change Refinement (Issue #696)**:
    - Extracted complex calculation logic into `incomeCalculations.js` utility.
    - Fixed identification of calculation bugs and corrected parenthesis errors in secondary driver formulas.
    - Reverted baseline income for secondary/tertiary crops to use aggregator values (q1) for accuracy.
    - Implemented unit tests for `incomeCalculations` utility.
    - Improved component readability and simplified data processing in `SingleDriverChange.js`.

## Codebase Structure
- `backend/`: FastAPI application code.
    - `routes/`: API route definitions.
    - `models/`: SQLAlchemy database models.
    - `alembic/`: Database migrations.
- `frontend/`: React application code.
    - `src/pages/`: Page components.
    - `src/components/`: Reusable UI components.
    - `src/store/`: State management (Pullstate).
- `.github/workflows/`: CI/CD pipelines.

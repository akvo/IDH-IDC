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

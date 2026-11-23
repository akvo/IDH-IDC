# [TLSA-013] Joint Admin Page & Living Income Academy User Statistics — Feature Specification

> **Status**: Ready for Implementation  
> **Backend Implementation Status**:
> - **User Management & Edit User**: **Complete (Zero Backend Tasks Required)** — `GET /user`, `GET /user/{id}`, `PUT /user/{id}`, `POST /user`, `POST /user/{id}/activate`, `POST /user/{id}/deactivate`, and `POST /user/{id}/revoke-idc` are already implemented and tested.
> - **LI Academy User Statistics**: **1 Backend Task Required (Zero Migrations)** — Needs new analytics aggregation endpoint `GET /admin/academy-user-statistics` calculating metrics from existing tables (`user`, `user_profile`, `academy_chapter_progress`, `company`).
> 
> **Figma Source**:
> - [Joint Admin Page / User Management (`node-id=13010-13007`)](https://www.figma.com/design/ga4EMPcp00Bh0d883khSs6/Living-income-academy?node-id=13010-13007&t=5fAO9ofzgvOY1k3s-0)
> - [Edit User (`node-id=13033-15051`)](https://www.figma.com/design/ga4EMPcp00Bh0d883khSs6/Living-income-academy?node-id=13033-15051&t=5fAO9ofzgvOY1k3s-0)
> - [LI Academy User Statistics (`node-id=13036-20503`)](https://www.figma.com/design/ga4EMPcp00Bh0d883khSs6/Living-income-academy?node-id=13036-20503&t=5fAO9ofzgvOY1k3s-0)
> - [Tool Filter Options (`node-id=13028-9607`)](https://www.figma.com/design/ga4EMPcp00Bh0d883khSs6/Living-income-academy?node-id=13028-9607&t=5fAO9ofzgvOY1k3s-0)

---

## 1. Executive Summary & Context

The IDH "Toolkit Towards Better Incomes" combines the **Income Driver Calculator (IDC)** and the **Living Income Academy (LIA)** under a single administrative umbrella.

Most of this initiative is an **update of the existing IDC admin page**, with only the **Academy user statistics page being net-new**:
1. **Existing User Management Page (`Users.js`)**: Polish table styling, update the column header from "Tool Access" to **"Tools"**, and align tag badge colors (`LI Academy` in Polar Green, `IDC` in Geek Blue) with Figma design tokens.
2. **Existing Edit User Page (`UserForm.js`)**: Already implements the 2-column layout from TLSA-007 (User Information on left, Tool Access with "Remove IDC Access" and "Account Status" on right); polish action button borders and typography.
3. **Admin Shell Navigation (`ContentLayout.js`)**: Expand the top admin navigation tabs from 3 tabs (`Manage Users`, `Manage Companies`, `Manage Tags`) to **4 tabs** by mounting **`LI Academy User Statistics`**.
4. **New LI Academy User Statistics Dashboard (`AcademyUserStats.js`)**:
   - Header filters (`Year`, `Region`, `Sector`) with one-click formatted CSV export.
   - 4 high-level KPI figure cards (`Registered Academy users`, `Active users (last 30 days)`, `Companies taking part`, `Average modules completed`).
   - Interactive module completion distribution bar chart (`0` to `6` modules completed) with unit toggle (`%` vs `Number`), `Show label` switch, and PNG chart download.
   - Sortable enterprise participation table ("Companies taking part") with IDH green header toolbar (`#01625f`), detailing company learner counts, average course progress %, and full-completion counts.

---

## 2. Requirements Discovery (5W1H)

| Dimension | Description |
| :--- | :--- |
| **Who** | IDH Platform Administrators, Super Admins, and Program Directors (Procurement & Living Income). |
| **What** | 1. 4-tab admin navigation including `LI Academy User Statistics`.<br>2. Minor visual polish on `Users.js` ("Tools" column with Figma tags) and `UserForm.js` action buttons.<br>3. Dedicated Academy statistics dashboard with KPI cards, ECharts bar chart (0–6 modules), and company progress table.<br>4. Backend analytics aggregation endpoint `GET /admin/academy-user-statistics`. |
| **Where** | **Frontend**: `frontend/src/components/layout/ContentLayout.js`, `frontend/src/pages/admin/users/Users.js`, `frontend/src/pages/admin/users/UserForm.js`, and `frontend/src/pages/admin/academy-stats/AcademyUserStats.js`.<br>**Backend**: `backend/routes/admin_academy_stats.py`, `backend/db/crud_admin_academy_stats.py`, `backend/models/admin_academy_stats.py`. |
| **When** | Feature `[TLSA-013]`, triggered when administrators view user management or click the "LI Academy User Statistics" tab. |
| **Why** | Program leadership requires aggregate data-driven insights into how companies and learners progress through Living Income Academy modules, while platform admins need consistent cross-tool user management. |
| **How** | Consume optimized SQL aggregation queries secured by `verify_admin` via FastAPI, rendered using Ant Design v5 + ECharts within the existing `ContentLayout`. |

---

## 3. Architecture & Data Flow

```mermaid
sequenceDiagram
    autonumber
    actor Admin as IDH Administrator
    participant Layout as ContentLayout (4 Admin Tabs)
    participant UsersUI as Users.js / UserForm.js (Existing)
    participant StatsUI as AcademyUserStats.js (New)
    participant UserAPI as Backend /user APIs (Existing)
    participant StatsAPI as Backend /admin/academy-user-statistics (New)
    participant DB as PostgreSQL

    Admin->>Layout: Navigates to User Management (/admin/users)
    Layout->>UsersUI: Renders Manage Users table (with updated "Tools" tags)
    UsersUI->>UserAPI: GET /user?tool=&role=&company=&search=
    UserAPI->>DB: Query users (Existing)
    DB-->>UserAPI: User records
    UserAPI-->>UsersUI: 200 OK (Paginated users)

    opt Edit User
        Admin->>UsersUI: Clicks Edit on a user
        UsersUI->>UsersUI: Opens UserForm.js (Left: Info, Right: Tool Access & Status)
        Admin->>UserAPI: POST /user/{id}/revoke-idc or POST /user/{id}/deactivate
        UserAPI-->>UsersUI: 200 OK
    end

    opt Switch to Statistics Tab
        Admin->>Layout: Clicks "LI Academy User Statistics" tab
        Layout->>StatsUI: Mounts /admin/academy-user-statistics
        StatsUI->>StatsAPI: GET /admin/academy-user-statistics?year=&region=&sector=
        Note over StatsAPI: Auth: verify_admin (Admin / Super Admin role check)
        StatsAPI->>DB: SQL Aggregations (KPIs, module bins 0-6, company averages)
        DB-->>StatsAPI: Aggregated metric sets
        StatsAPI-->>StatsUI: 200 OK (AcademyUserStatsResponse)
        StatsUI-->>Admin: Renders 4 KPI cards, ECharts bar chart, and Companies table
    end

    opt Filter or Export Statistics
        Admin->>StatsUI: Selects Year / Region / Sector
        StatsUI->>StatsAPI: Re-fetch with query params
        StatsAPI-->>StatsUI: Filtered statistics
        Admin->>StatsUI: Clicks "Export CSV"
        StatsUI-->>Admin: Generates formatted CSV download
        Admin->>StatsUI: Clicks "Download chart"
        StatsUI-->>Admin: Exports chart canvas to PNG
    end
```

---

## 4. Existing Component Inventory & Zero-Duplication Matrix 🧩

| UI / Backend Element | Existing Asset | Action Required | Anti-Duplication Guardrail (**What NOT to Do**) |
| :--- | :--- | :--- | :--- |
| **Admin Tabs Container** | `frontend/src/components/layout/ContentLayout.js` | **Adapt (Minor)**:<br>Add 4th tab `{ key: "/admin/academy-user-statistics", label: "LI Academy User Statistics", value: "academy-user-statistics" }`. | **DO NOT** create a separate layout for the stats page; render it inside `ContentLayout`. |
| **Manage Users Table** | `frontend/src/pages/admin/users/Users.js` | **Adapt (Minor)**:<br>Rename column "Tool Access" to **"Tools"**; update tag styling to Polar Green (`LI Academy`) and Geek Blue (`IDC`). | **DO NOT** rewrite the user table or pagination logic. Existing table already supports filters, search, and actions. |
| **Edit User Page** | `frontend/src/pages/admin/users/UserForm.js` | **Adapt (Minor)**:<br>Verify button styling ("Save User" rounded outline, "Remove IDC Access" red button, "Account Status"). | **DO NOT** rewrite user edit forms; 2-column layout and `revoke-idc` integration already exist. |
| **User Management Backend** | `backend/routes/user.py`, `backend/db/crud_user.py` | **Reuse Directly (100%)**:<br>User CRUD, filtering, deactivation, and `revoke-idc` endpoints already exist and tested. | **DO NOT** touch user management backend routes or models. |
| **Database Migrations** | PostgreSQL Schema | **Zero Migrations (100%)**:<br>Tables `user`, `user_profile`, `academy_chapter_progress`, `company` already exist. | **DO NOT** create new database tables or alembic migrations. |
| **Academy Stats Backend** | `backend/routes/admin_academy_stats.py`<br>`backend/db/crud_admin_academy_stats.py`<br>`backend/models/admin_academy_stats.py` | **Net-New Backend Task**:<br>Implement aggregated analytics endpoint `GET /admin/academy-user-statistics`. | **DO NOT** compute stats on frontend by downloading all raw progress records. Aggregate server-side in SQL. |
| **Academy Stats Dashboard** | `frontend/src/pages/admin/academy-stats/AcademyUserStats.js` | **Net-New Frontend Page**:<br>Build dashboard with filter bar, 4 KPI cards, ECharts distribution chart, and company table. | **DO NOT** install new charting libraries; reuse existing project ECharts / Ant Design components. |

---

## 5. Detailed Component Specifications (Figma Alignment)

### 5.1 Joint Admin Page: Manage Users (`node-id=13010:13007`)
- **Breadcrumb & Header**:
  - Breadcrumb: `Home > Users > User Management`
  - Title: `User Management`
  - Navigation Tabs:
    1. `Manage Users` (active on `/admin/users`)
    2. `Manage Companies` (`/admin/companies`)
    3. `Manage Tags` (`/admin/tags`)
    4. `LI Academy User Statistics` (`/admin/academy-user-statistics`)
- **Filter Toolbar**:
  - Search Input: `Find User`
  - Role Filter: `User Role` dropdown (All, Super Admin, Admin, Internal User, External Regular, External Advanced)
  - Company Filter: `Company` dropdown
  - Tool Filter: `All tools` dropdown (`All tools`, `IDC`, `Academy`) matching Figma `node-id=13028:9607`
  - Status Filter: `All Users` / `Show Approved User`
  - Action Button: `Add User` primary button (right-aligned)
- **Table Columns**:
  - `Fullname` (sortable)
  - `Email` (sortable)
  - `User Role` (sortable, formatted)
  - `Company` (sortable)
  - **`Tools`**: Tag column:
    - **`LI Academy`**: Polar Green tag (background `#f6ffed`, border `#b7eb8f`, text `#52c41a`, font size 12px).
    - **`IDC`**: Geek Blue tag (background `#f0f5ff`, border `#adc6ff`, text `#2f54eb`, font size 12px).
  - `Action`: Edit (`<EditOutlined />`), Deactivate/Activate, Delete

---

### 5.2 Edit User Page (`node-id=13033:15051`)
- **Header**:
  - Breadcrumb: `Home > Users > User Management > Edit User`
  - Title: `Edit User`
- **2-Column Card Layout**:
  - **Left Card (`User Information`)**:
    - Mandatory fields with asterisks: `Fullname`, `Email`, `Role`, `User Type`, `Company`.
  - **Right Card (`Tool Access`)**:
    - Section header: `Tool Access`
    - Subheader: `Current Access:` followed by active tool tags (`Academy`, `IDC`).
    - Helper description: *"This user already has access to the Income Driver Calculator (IDC)."*
    - Divider.
    - **Remove IDC Access Row**:
      - Label: `Remove IDC Access`
      - Action: Red danger button `Remove IDC Access` invoking `POST /user/{id}/revoke-idc` with confirmation popconfirm.
    - Divider.
    - **Account Status Row**:
      - Label: `Account Status`
      - Action: Red danger button `Deactivate Account` (or `Reactivate Account`) with confirmation popconfirm.
- **Form Actions**:
  - Bottom action: Green outline button **`Save User`** (`border: 2px solid #00625f`, `border-radius: 20px`, `color: #00625f`).

---

### 5.3 LI Academy User Statistics Dashboard (`node-id=13036:20503`)
- **Header Toolbar**:
  - Filter Selectors:
    - `All years` dropdown: Year filter (populated from registration years in DB).
    - `All regions` dropdown: Region filter (populated from `user_profile.region_name`).
    - `All sectors` dropdown: Sector filter (populated from `user_profile.sector`).
  - Action: **`Export CSV`** button (right-aligned, secondary outline button).
- **Key Figures (4 KPI Cards)**:
  1. **Registered Academy users**: Total users having `'academy'` in `tools`. (e.g. `1,248`)
  2. **Active users (last 30 days)**: Users with activity in `academy_user_chapter_progress` in the last 30 days. (e.g. `412`)
  3. **Companies taking part**: Distinct count of companies represented in the cohort. (e.g. `37`)
  4. **Average modules completed**: Average number of completed modules out of 6. Displayed as `{avg} / 6`. (e.g. `3.4 / 6`)
- **Visualizations Area (2 Columns)**:
  - **Left Column: Module Completion Distribution Bar Chart**:
    - Title: `"How many modules have users completed?"`
    - Action: `"Download chart"` outline button (PNG export).
    - Controls:
      - Unit Toggle: Radio group with options **`%`** and **`Number`**.
      - Label Toggle: Switch **`Show label`** toggling data values above bars.
    - ECharts Bar Chart:
      - Categories (X-Axis): `0`, `1`, `2`, `3`, `4`, `5`, `6`.
      - Bar color: Brand teal/green `#01625f`, rounded top corners (`border-radius: [4, 4, 0, 0]`).
      - Tooltip: Displays both user count and percentage.
  - **Right Column: Enterprise Participation Table ("Companies taking part")**:
    - Header Toolbar: Deep IDH green background (`#01625f`), white title `"Companies taking part"`.
    - Table Columns:
      - **`Company`**: Company name (string sortable).
      - **`Users`**: Number of registered Academy learners (numeric sortable).
      - **`Average progress`**: Average module/chapter progress percentage (numeric sortable, formatted with `%`).
      - **`Completed all 6`**: Number of users who completed all 6 modules (numeric sortable).
    - Pagination: 10 rows per page.

---

## 6. Backend Specification: Analytics Aggregation Engine

### 6.1 Endpoint Contract
- **Method**: `GET`
- **Path**: `/admin/academy-user-statistics`
- **Security**: `verify_admin` (Admin or Super Admin role required)
- **Query Parameters**:
  - `year`: Optional integer (filter by user registration year)
  - `region`: Optional string (case-insensitive filter by `user_profile.region_name`)
  - `sector`: Optional string (case-insensitive filter by `user_profile.sector`)

### 6.2 Response DTO (`backend/models/admin_academy_stats.py`)
```python
from typing import List, Optional
from pydantic import BaseModel, Field


class AcademyKpiStats(BaseModel):
    registered_users: int = Field(..., description="Total verified users with academy in tools")
    active_users_30d: int = Field(..., description="Academy users active in the last 30 days")
    companies_count: int = Field(..., description="Distinct companies taking part")
    avg_modules_completed: float = Field(..., description="Average number of completed modules (out of 6)")
    total_modules: int = Field(6, description="Total number of modules in curriculum")


class AcademyModuleDistributionBin(BaseModel):
    modules_completed: int = Field(..., ge=0, le=6, description="Number of modules completed (0 to 6)")
    count: int = Field(..., ge=0, description="Number of users in this bin")
    percentage: float = Field(..., ge=0.0, le=100.0, description="Percentage of total filtered cohort")


class AcademyCompanyStatItem(BaseModel):
    company: str = Field(..., description="Company name")
    users_count: int = Field(..., ge=1, description="Number of registered academy users")
    average_progress_pct: float = Field(..., ge=0.0, le=100.0, description="Average course progress %")
    completed_all_modules_count: int = Field(..., ge=0, description="Users who completed all 6 modules")


class AcademyStatsFilterOptions(BaseModel):
    years: List[int] = Field(..., description="Available registration years")
    regions: List[str] = Field(..., description="Available region names")
    sectors: List[str] = Field(..., description="Available sector names")


class AcademyUserStatsResponse(BaseModel):
    kpis: AcademyKpiStats
    module_distribution: List[AcademyModuleDistributionBin]
    companies: List[AcademyCompanyStatItem]
    filter_options: AcademyStatsFilterOptions
```

### 6.3 Aggregation Logic (`backend/db/crud_admin_academy_stats.py`)
1. **Cohort Selection**:
   - `User.tools.contains(["academy"])` and `User.is_active == 1`.
   - Left join `UserProfile` on `UserProfile.user_id == User.id`.
   - Left join `Company` on `Company.id == User.company`.
   - Resolved company name: `COALESCE(Company.name, UserProfile.company_name, 'Unknown')`.
   - Apply optional filters: `created_at` year, `region_name`, and `sector`.
2. **Module Completion Metric**:
   - Total curriculum modules = 6 (modules 1 through 6).
   - A module is completed when all its chapters have `AcademyUserChapterProgress.status == 'completed'`.
   - For each user, count distinct completed modules (0 to 6).
   - Distribute users into 7 buckets: `[0, 1, 2, 3, 4, 5, 6]`.
   - `avg_modules_completed = ROUND(SUM(user_completed_modules) / NULLIF(total_cohort, 0), 1)`.
3. **Active Users (30 Days)**:
   - Count distinct users in cohort having at least one entry in `AcademyUserChapterProgress` where `last_opened_at >= NOW() - INTERVAL '30 days'`.
4. **Company Progress**:
   - Group by resolved company name.
   - User count per company.
   - Company average progress %: `ROUND(AVG(user_completed_chapters / total_course_chapters) * 100, 1)`.
   - Count users in company with 6 completed modules.
   - Order by `users_count DESC`.

---

## 7. User Acceptance Criteria (UAC) & Technical Acceptance Criteria (TAC)

### Epic-1: Admin Navigation 4th Tab & Manage Users Polish

#### User Acceptance Criteria (UAC)
- **UAC-1.1**: When an admin navigates to `/admin/users`, they see 4 distinct tabs: `Manage Users`, `Manage Companies`, `Manage Tags`, and `LI Academy User Statistics`.
- **UAC-1.2**: In the Manage Users table, the column header is labeled **"Tools"** (matching Figma).
- **UAC-1.3**: The tool tags are rendered with exact Figma styling:
  - `LI Academy`: Polar Green tag (`#f6ffed` bg, `#b7eb8f` border, `#52c41a` text).
  - `IDC`: Geek Blue tag (`#f0f5ff` bg, `#adc6ff` border, `#2f54eb` text).
- **UAC-1.4**: The tool filter dropdown displays `"All tools"` as placeholder with options `IDC` and `Academy`.

#### Technical Acceptance Criteria (TAC)
- [ ] **TAC-1.1**: In `ContentLayout.js`, append `{ key: "/admin/academy-user-statistics", label: "LI Academy User Statistics", value: "academy-user-statistics" }` to `tabItems`.
- [ ] **TAC-1.2**: In `Users.js`, change column title from `"Tool Access"` to `"Tools"`.
- [ ] **TAC-1.3**: Update tag classes in `Users.js` to `.tag-academy` and `.tag-idc` matching Figma tokens.
- [ ] **TAC-1.4**: Ensure tool filter dropdown placeholder is `"All tools"`.

---

### Epic-2: Edit User Page Polish

#### User Acceptance Criteria (UAC)
- **UAC-2.1**: Edit user page displays 2-card layout (User Information on left, Tool Access on right).
- **UAC-2.2**: Tool Access card displays current tool badges (`Academy`, `IDC`).
- **UAC-2.3**: If the user has IDC access, "Remove IDC Access" danger button is displayed. Clicking it shows confirmation and revokes IDC access.
- **UAC-2.4**: Account Status row displays "Deactivate Account" (or "Reactivate Account") with confirmation popconfirm.
- **UAC-2.5**: Save button is rendered as a green outline pill button (`Save User`).

#### Technical Acceptance Criteria (TAC)
- [ ] **TAC-2.1**: Verify `UserForm.js` layout against Figma node `13033:15051`.
- [ ] **TAC-2.2**: Ensure Save button has `.button-secondary` styling (`border: 2px solid #00625f`, `border-radius: 20px`, `color: #00625f`).
- [ ] **TAC-2.3**: Verify existing `POST /user/{id}/revoke-idc` flow functions without regressions.

---

### Epic-3: Backend Analytics Aggregation Endpoint

#### User Acceptance Criteria (UAC)
- **UAC-3.1**: Admin requests `GET /admin/academy-user-statistics` and receives aggregated KPIs, module distribution bins, company progress, and available filter options.
- **UAC-3.2**: Passing `?year=2026`, `?region=West%20Africa`, or `?sector=Agriculture` filters the aggregated results accordingly.
- **UAC-3.3**: Non-admin users are rejected with HTTP 403 Forbidden.

#### Technical Acceptance Criteria (TAC)
- [ ] **TAC-3.1**: Create `backend/models/admin_academy_stats.py` with `AcademyUserStatsResponse` schemas.
- [ ] **TAC-3.2**: Implement `backend/db/crud_admin_academy_stats.py` performing SQL aggregations.
- [ ] **TAC-3.3**: Register `GET /admin/academy-user-statistics` in `backend/routes/admin_academy_stats.py` and mount in `backend/main.py`.
- [ ] **TAC-3.4**: Write unit tests in `backend/tests/test_1037_admin_academy_user_stats.py` achieving ≥80% coverage.

---

### Epic-4: LI Academy User Statistics Dashboard Page

#### User Acceptance Criteria (UAC)
- **UAC-4.1**: Admin clicks the "LI Academy User Statistics" tab and views the dashboard.
- **UAC-4.2**: 4 KPI cards render:
  - `Registered Academy users`
  - `Active users (last 30 days)`
  - `Companies taking part`
  - `Average modules completed` (formatted as `X.X / 6`)
- **UAC-4.3**: Module completion distribution bar chart displays buckets `0` through `6`:
  - Radio toggle switches between `%` and `Number`.
  - Switch toggles `Show label` on/off.
  - "Download chart" exports the chart to PNG.
- **UAC-4.4**: "Companies taking part" table renders with IDH green header toolbar, sortable columns (`Company`, `Users`, `Average progress`, `Completed all 6`), and pagination.
- **UAC-4.5**: Changing Year, Region, or Sector dropdowns re-fetches filtered statistics.
- **UAC-4.6**: Clicking "Export CSV" downloads a formatted CSV containing KPIs, module distribution, and company participation data.

#### Technical Acceptance Criteria (TAC)
- [ ] **TAC-4.1**: Mount `/admin/academy-user-statistics` route in `frontend/src/App.js` and `routePath`.
- [ ] **TAC-4.2**: Create `frontend/src/pages/admin/academy-stats/AcademyUserStats.js` consuming the stats API.
- [ ] **TAC-4.3**: Implement ECharts distribution chart with `%` / `Number` toggle and `Show label` switch.
- [ ] **TAC-4.4**: Implement sortable Ant Design `Table` for company progress with green toolbar (`#01625f`).
- [ ] **TAC-4.5**: Implement client-side CSV export generating `li_academy_user_statistics_{date}.csv`.
- [ ] **TAC-4.6**: Write frontend test suite in `frontend/src/pages/admin/academy-stats/__tests__/AcademyUserStats.test.js`.

---

## 8. Verification & Deterministic Commands

```bash
# Backend verification
./dc.sh exec backend pytest tests/test_1037_admin_academy_user_stats.py -v
./dc.sh exec backend flake8

# Frontend verification
./dc.sh exec frontend yarn test:ci --testPathPattern="admin" --runInBand
./dc.sh exec frontend yarn lint
```

---

## 9. Epic Breakdown & Vibe Coding Estimation ⏱️

- **Backend Effort**: **2.0 Hours** (1 analytics aggregation endpoint, schemas, unit tests; zero migrations).
- **Frontend Effort**: **3.5 Hours** (ContentLayout tab, Users table polish, UserForm polish, AcademyUserStats dashboard).
- **Total Budget**: **5.5 Hours (~0.7 Engineering Days)**

| Task ID | Scope & Touchpoints | Dev (Vibe Coding) | Automated Testing | QA & Review | Total Est. | Priority |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **TASK-01** | **Backend Analytics Aggregation Engine & Schemas**<br>• `backend/models/admin_academy_stats.py` (DTOs)<br>• `backend/db/crud_admin_academy_stats.py` (KPIs, 0-6 bins, company metrics) | 35m | 20m | 15m | **70m (1.17h)** | P0 |
| **TASK-02** | **Backend Route, Auth Gate & Tests**<br>• `backend/routes/admin_academy_stats.py` (`GET /admin/academy-user-statistics`)<br>• `backend/tests/test_1037_admin_academy_user_stats.py` (Hermetic pytest suite) | 25m | 20m | 10m | **55m (~0.9h)** | P0 |
| **TASK-03** | **Admin Navigation Tab & User Management Polish**<br>• Add 4th tab in `ContentLayout.js`<br>• Rename column "Tools" and update tags in `Users.js`<br>• Polish Save button in `UserForm.js` | 20m | 15m | 10m | **45m (0.75h)** | P0 |
| **TASK-04** | **Academy Stats: Filters & 4 KPI Figure Cards**<br>• Header filter dropdowns (`Year`, `Region`, `Sector` + `Export CSV`)<br>• 4 KPI cards matching Figma typography & layout | 25m | 15m | 10m | **50m (~0.8h)** | P0 |
| **TASK-05** | **Academy Stats: Distribution Chart & Company Table**<br>• ECharts bar chart (`0`–`6` modules, `%` vs `Number`, `Show label`)<br>• "Download chart" PNG export<br>• "Companies taking part" table with green toolbar (`#01625f`) | 35m | 20m | 10m | **65m (~1.1h)** | P0 |
| **TASK-06** | **Full Regression & Quality Gate**<br>• Frontend test suite `AcademyUserStats.test.js`<br>• Full regression pass: `pytest`, `flake8`, `yarn test:ci`, `yarn lint` | 15m | 15m | 10m | **40m (~0.67h)** | P0 |
| **TOTAL** | **Full TLSA-013 Implementation** | **2h 35m** | **1h 45m** | **1h 05m** | **5h 25m (~5.4h)** | — |

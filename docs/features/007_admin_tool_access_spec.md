# [TLSA-007] Admin: Tool Access Filtering & IDC Company Linkage Workflow

**GitHub Issue**: `#873` — `[TLSA-007] Admin: Tool Access Filtering & IDC Company Linkage Workflow`  
**Parent Spec**: `docs/features/002_toolkit_login_shared_access_spec.md` (`TASK-07`)  
**Branch**: `feature/873-admin-tool-access-filtering-company-linkage` (from `feature/857-db-schema-migration-tool-access-array`)

---

## 1. Overview
Empower IDH Administrators to filter toolkit users by tool access (`IDC`, `Academy`) and safely upgrade Academy-only practitioners to full Income Driver Calculator (IDC) access linked to an official IDC `Company`, triggering an email notification upon grant.

### 1.1 Backend Interface Contracts
- **`GET /user?tool=`** ([`backend/routes/user.py`](file:///Users/galihpratama/Sites/IDH-IDC/backend/routes/user.py), [`backend/db/crud_user.py`](file:///Users/galihpratama/Sites/IDH-IDC/backend/db/crud_user.py)):
  - Accepts optional query parameter `tool: Optional[ToolType] = Query(None)` (`"idc"` or `"academy"`; invalid values return `422`).
  - Filters `User.tools.contains([tool.value])` inside `crud_user.filter_user(...)`.
  - Updates `crud_user.count(...)` and `get_all` to forward `role`, `company`, and `tool` so `total` and `total_page` reflect all active filters accurately.
- **`POST /user/{user_id}/grant-idc`** *(registered before `PUT/GET /user/{user_id:path}` wildcard routes)*:
  - **Auth**: `verify_admin(...)` (`401` unauthenticated, `403` non-admin).
  - **Payload (`GrantIdcAccessRequest`)**: `{ company_id: int, user_type: Optional[UserType] = None }`.
  - **Validation & Mutations**:
    - Validates target user exists (`404` if missing) and is active/verified (`user.is_active == 1`, returning `400` if inactive/unverified).
    - Validates `company_id` exists via `crud_company.get_company_by_id(...)` (`404` if missing).
    - Reassigns `user.tools` list adding `"idc"` if not already present (preserving PG `ARRAY` dirty tracking; idempotent if `"idc"` already exists).
    - Sets `user.company = payload.company_id`; sets `user.user_type` only when `user.role == UserRole.user` (defaults to existing `user.user_type` or `UserType.external_regular` if omitted, or updates to `payload.user_type` when supplied).
  - **Response**: `200 OK` returning `UserDetailDict` (`user.to_user_detail`).
  - **Notification**: Dispatches `MailTypeEnum.IDC_ACCESS_GRANTED` via [`backend/utils/mailer.py`](file:///Users/galihpratama/Sites/IDH-IDC/backend/utils/mailer.py) with `"An administrator has granted you access to the Income Driver Calculator under {company.name}."` (gracefully logs if SMTP delivery returns `False` without rolling back the committed grant).

### 1.2 Frontend Contracts
- **Admin Users List ([`frontend/src/pages/admin/users/Users.js`](file:///Users/galihpratama/Sites/IDH-IDC/frontend/src/pages/admin/users/Users.js))**:
  - Adds **Tool Access** column rendering `<Tag color="green">IDC</Tag>` and `<Tag color="blue">Academy</Tag>` (`-` fallback when empty).
  - Adds clearable **Tool Access** `<Select>` filter (`IDC` / `Academy`) passing `?tool=` on `GET user?...`.
  - Resets `currentPage` to `1` on filter, search, or `Show Approved User` changes to avoid stale-page 404s.
- **Admin User Form ([`frontend/src/pages/admin/users/UserForm.js`](file:///Users/galihpratama/Sites/IDH-IDC/frontend/src/pages/admin/users/UserForm.js), [`user.scss`](file:///Users/galihpratama/Sites/IDH-IDC/frontend/src/pages/admin/users/user.scss))**:
  - When editing an existing user without `"idc"` in `tools` (`userId && !userTools.includes("idc")`), renders a **Tool Access** card showing current `Academy` badge and a `"Grant IDC Access"` `<Switch />`.
  - Enabling `"Grant IDC Access"` reveals optional `idc_user_type` (`external_regular` / `external_advanced`, defaulting to `external_regular`) and displays/requires the official IDC **Company** selector (`companyOptions`), hiding `Business Units` while granting partner company access.
  - Submitting with `Grant IDC Access` enabled saves updated user info if changed (or approves if inactive) via `PUT user/${userId}` and calls `POST user/${userId}/grant-idc` with `{ company_id, user_type }`.

### 1.3 Architectural Note: Deactivation vs. Tool Revocation
- **Account Deactivation**: Already fully supported via standard `PUT /user/{id}` updating `is_active=0` (or `?approved=false`), immediately revoking all session access across both tools.
- **Tool-Level Revocation (`tools.remove("idc")`)**: Intentionally out-of-scope for TLSA-007 (KISS/YAGNI). Stripping IDC access from an established user introduces complex business risks around orphaned case ownership, shared datasets, and business unit memberships. If independent tool stripping is required in future releases, it should be designed as a dedicated RFC with explicit case ownership reassignment rules.

---

## 2. Parallel Execution Streams (`/bmad-parallel-dev`)

| Stream | Role | Touchpoints |
| :--- | :--- | :--- |
| **Backend** | `bmad-dev` (Amelia API) | `backend/models/user.py`, `backend/db/crud_user.py`, `backend/utils/mailer.py`, `backend/routes/user.py` |
| **Frontend** | `bmad-dev` (Amelia UI) | `frontend/src/pages/admin/users/Users.js`, `frontend/src/pages/admin/users/UserForm.js`, `frontend/src/pages/admin/users/user.scss` |
| **Testing** | `bmad-tester` (Murat QA) | `backend/tests/test_1034_admin_tool_access.py`, `frontend/src/pages/admin/users/__tests__/Users.test.js`, `frontend/src/pages/admin/users/__tests__/UserForm.test.js` |

---

## 3. Verification Commands
- `./dc.sh exec backend pytest tests/test_1034_admin_tool_access.py -v`
- `./dc.sh exec backend pytest`
- `./dc.sh exec backend flake8`
- `./dc.sh exec frontend yarn test:ci --testPathPattern="admin/users" --runInBand`
- `./dc.sh exec frontend yarn lint && ./dc.sh exec frontend yarn prettier`

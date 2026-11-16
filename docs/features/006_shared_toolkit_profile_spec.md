# [TLSA-006] Shared Toolkit Profile Page & Incomplete Data Alert

**GitHub Issue**: `#871` — `[TLSA-006] Profile: Shared Toolkit Profile Page & Incomplete Data Alert`  
**Parent Spec**: `docs/features/002_toolkit_login_shared_access_spec.md` (`TASK-06`)  
**Branch**: `feature/871-shared-toolkit-profile-page` (from `feature/857-db-schema-migration-tool-access-array`)

---

## 1. Overview
Provide a unified authenticated `/profile` account page across Living Income Academy, Income Driver Calculator (IDC), and shared toolkit users, along with a persistent, session-dismissible incomplete-profile alert on dashboards (`Welcome.js`, `AcademyOverviewPage.js`) and `/profile`.

### 1.1 Interface Contracts
- **`GET /user/me`** ([`backend/routes/user.py`](file:///Users/galihpratama/Sites/IDH-IDC/backend/routes/user.py)):
  - Extends `UserInfo` backward-compatibly with `company_name: Optional[str]` (`user.user_company.name` when `"idc"` is in `user.tools`, otherwise `user.profile.company_name` if present).
- **`PUT /user/profile`** *(registered BEFORE `PUT /user/{user_id:path}`)*:
  - Request (`UserProfileUpdateRequest`): `{ fullname?: str, company_name?: str, current_password?: str, new_password?: str }`
  - Rules:
    - Updates trimmed `fullname` on `User` and syncs `first_name` / `last_name` to `UserProfile` via `crud_profile.update_user_profile()`.
    - If `"idc"` is NOT in `user.tools` and `company_name` is provided, updates `user_profile.company_name`. If `"idc"` IS in `user.tools`, `company_name` edits are ignored and `user.company` remains Admin-managed.
    - If `new_password` is provided: validates complexity (`validate_password_strength`: >=8 chars, upper, lower, digit, special), verifies `current_password` **upfront** before profile mutation (`400` if missing or wrong current password, preventing partial profile commits), and delegates password update to `crud_settings.change_user_password()`.
  - Response: Updated `UserInfo` (`HTTP 200`).
- **`POST /user/change-password`**:
  - Request (`ChangePasswordRequest`): `{ current_password: str, new_password: str }` (enforces `validate_password_strength()`).
  - Delegates to `crud_settings.change_user_password()`, returns `{"message": "Password changed successfully"}` (`HTTP 200`, `400` wrong current password, `422` weak password).

### 1.2 Shared Frontend & Alert Design
- **`/profile` (`frontend/src/pages/profile/Profile.js`)**:
  - Mounted under `<PrivateRoutes />` (`routePath.profile = "/profile"`) accessible to all authenticated users regardless of tool (Academy-only, IDC-only, Dual-tool, Admin).
  - Left Identity Card: Avatar initials (`getUserInitials`), Fullname, Email, Role tag, Active Tool tags (`IDC`, `Academy`).
  - Profile Details Card: Incomplete profile inline reminder, editable `fullname`, disabled `email`, IDC-locked `company_name` (`Assigned by IDH Admin`) OR Academy editable `company_name`.
  - Security & Password Card: `current_password`, `new_password`, `confirm_password` + live `PasswordCriteria` (`checkPasswordCriteria`).
- **`<IncompleteProfileAlert />` (`frontend/src/components/profile/IncompleteProfileAlert.js`)**:
  - Accepts optional `user` prop override or defaults to `UserState`.
  - Shown when `!fullname?.trim() || (!company && !company_name?.trim() && !user_profile?.company_name?.trim() && !(internal_user && organisation_detail?.name?.trim()))`.
  - Dismissible via `localStorage` (`idc_profile_alert_dismissed_${userId} === "true"`).
  - Rendered on `Welcome.js`, `AcademyOverviewPage.js`, and `Profile.js`.

---

## 2. Parallel Execution Streams (`/bmad-parallel-dev`)

| Stream | Role | Touchpoints |
| :--- | :--- | :--- |
| **Backend** | `bmad-dev` (Amelia API) | `backend/models/user.py`, `backend/routes/user.py` |
| **Frontend** | `bmad-dev` (Amelia UI) | `frontend/src/pages/profile/*`, `frontend/src/components/profile/*`, `frontend/src/App.js`, `frontend/src/components/route/paths.js`, `frontend/src/store/user.js`, `frontend/src/pages/login/Login.js`, `frontend/src/pages/welcome/Welcome.js`, `frontend/src/pages/academy/AcademyOverviewPage.js` |
| **Testing** | `bmad-tester` (Murat QA) | `backend/tests/test_1033_user_profile.py`, `frontend/src/pages/profile/__tests__/Profile.test.js`, `frontend/src/components/profile/__tests__/IncompleteProfileAlert.test.js` |

---

## 3. Verification Commands
- `./dc.sh exec backend pytest tests/test_1033_user_profile.py -v`
- `./dc.sh exec backend pytest`
- `./dc.sh exec backend flake8`
- `./dc.sh exec frontend yarn test:ci`
- `./dc.sh exec frontend yarn lint`

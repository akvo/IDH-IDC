# Feature Specification: User Roles & Access Control (RBAC)

This document describes the Role-Based Access Control (RBAC) system implemented in the IDC platform, covering user permissions, feature gating, and case sharing logic.

---

## 1. User Tiers

The system supports 4 primary user roles defined in both the backend (`backend/middleware.py`) and frontend (`frontend/src/store/CaseUIStore.js`).

| Role Identifier | UI Display Name | Description |
| :--- | :--- | :--- |
| `super_admin` | Super Admin | Full access to all data, users, and configuration across the entire platform. |
| `admin` | Admin | Organization-level access to users and cases within their company. |
| `external_advanced` | External Advanced | Power users with full write access (Modeling, Upload) to assigned cases. |
| `external_regular` | External Regular | Standard users with primarily read-only access, unless explicitly assigned as an "Editor" for a case. |

---

## 2. Feature Gating & Permissions

Feature access is dynamically determined by a combination of the user's role and their specific access level for a case (`editor` vs `viewer`).

### Centralized Case Access Flags

* `enableEditCase`: True if the user is an owner, admin, or has explicit `editor` access.
* `enableAdvancedTools`: Shared across Step 4/5. Unified with `enableEditCase`.
* `enableDataUpload`: Restricted to **Internal** and **External Advanced** users with **Edit** status.

### Role-Specific Restrictions

* **External Regular Users**:
  * By default, restricted to a "View-Only" baseline.
  * "Data upload" tab is permanently disabled for this role to maintain data integrity.
  * Access to modeling tools (Steps 4 and 5) is only granted if assigned as an "Editor".

### View-Only Banner (ReadOnlyAlert)

* **Aesthetics & Usability**: A top-level warning banner (`ReadOnlyAlert`) is rendered on **Step 4** and **Step 5** when `enableEditCase` is `false` (e.g. for External Regular view-only users or other view-only members). This informs them that the current case has been locked or that they lack permissions to edit, prompting them to contact their administrator to request write permissions. It is hidden on Step 1 and Step 3 to minimize visual noise.

---

## 3. Case Access Matrix

| Feature / Action | Admin | Internal | Ext. Advanced | Ext. Regular |
| :--- | :---: | :---: | :---: | :---: |
| **View All Cases** | Yes | Yes | Assigned Only | Assigned Only |
| **Create New Case** | Yes | Yes | Yes | No |
| **Edit Case Details** | Yes | Yes | Yes* | No* |
| **Data Upload** | Yes | Yes | Yes* | No |
| **Advanced Modelling** | Yes | Yes | Yes* | Editor Only |
| **Manage Case Access** | Yes | Yes | Owner Only | No |

*\* Requires explicit "Editor" permission for the specific case.*

---

## 4. Technical Reference

* **Backend Middleware**: `backend/middleware.py` (Authentication and route-level gating).
* **Frontend State**: `frontend/src/store/CaseUIStore.js` (Dynamic UI flags based on user profile).
* **Case Permissions API**: `/cases/{id}/access` (Endpoint for assigning editors/viewers).

---

> [!NOTE]
> All feature gating is enforced **both** in the UI (disabling buttons, hiding tabs) and at the API layer (403 Forbidden responses) for robust security compliance.

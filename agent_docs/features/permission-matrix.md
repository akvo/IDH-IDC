# Permission Matrix

This document outlines the access levels for different user roles and types in the IDH-IDC system, based on the current implementation in `backend/middleware.py`, `backend/routes/case.py`, and `frontend/src/pages/cases/Case.js`.

## Case Access Permission Matrix

| User Role / Type | Visibility in List | Create Case | Edit Case | View Details | Delete Case | Manage Access |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Super Admin / Admin** | All (Public & Private) | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Internal User** | Public + Owned + Shared | ✅ | Owner or Shared 'edit' | Owner, Shared, or Public | ❌ | Owner |
| **External Advanced** | Owned + Shared + Company | ✅ | Owner or Shared 'edit' | Owner, Shared, or Company | ❌ | Owner |
| **External Regular** | Owned + Shared + Company | ❌ | Shared 'edit' | Shared or Company | ❌ | ❌ |

---

## Detailed Logic Breakdown

### 1. Visibility in List
- **Admin**: Has full visibility into all cases, including those marked as `private`.
- **Internal User**: Can see all `public` cases, cases they created (Owned), and cases explicitly shared with them via the "Manage Access" feature.
- **External User (Advanced/Regular)**: Restricted to cases they own, cases explicitly shared with them, or cases belonging to the same `company` association.

### 2. Create Case
- **Allowed**: Admins, Internal Users (must have an assigned Business Unit), and External Advanced users.
- **Restricted**: External Regular users cannot create new cases.

### 3. Edit Case
- **Admin**: Always allowed.
- **User**: Allowed if they are the **Case Owner** (creator) or if they have been granted explicit **'edit' permission** by the owner/admin.
- **Note**: External Regular users can only edit if a case is shared with them with 'edit' rights.

### 4. View Details
- **Admin**: Always allowed.
- **Internal User**: Can view any case they own, any shared case, or any **public** case in the system.
- **External User**: Can view any case they own, any shared case, or any case within their **company**.

### 5. Delete Case
- **Strict Logic**: Only **Admins** and **Super Admins** are permitted to delete cases. Case owners (regular users) cannot delete their own cases.

### 6. Manage Access (Sharing)
- **Strict Logic**: Only the **Case Owner** or an **Admin** can add/remove user access or change ownership of a case.

---

> [!NOTE]
> **Data Upload Access**: While not in the primary matrix above, the "Data Upload" feature is further restricted to **Advanced Editors** (Admin, Internal, or External Advanced users with Edit permission). External Regular users cannot access Data Upload even if they have edit rights to a case.

# QA Guide: External User Split UI Verification (#729)

This guide provides step-by-step instructions for verifying the implementation of the External User Split in the IDH-IDC UI.

---

## 1. User Modification & Creation (Admin Perspective)
**Goal**: Verify that Admins can correctly assign the new user types.

1.  **Login** as a Super Admin or Admin.
2.  Navigate to **Admin -> Users**.
3.  Click **Add New User** (or Edit an existing user with the "User" role).
4.  **Verify UI Elements**:
    - When the role is set to `User`, a "User Type" field should appear.
    - Options must include: **IDH Internal**, **External Regular**, and **External Advanced**.
5.  **Test Assignment**:
    - Select **External Advanced**, choose a Company. Save.
    - Select **External Regular**, choose a Company. Save.
    - Select **IDH Internal**, choose Business Unit. Save.
6.  **Verify List Display**:
    - The Users table should now display the specific type (e.g., "External Advanced") instead of just "User".

---

## 2. Case Visibility: External Regular
**Goal**: Ensure isolation for regular partner users.

1.  **Login** as a user marked as **External Regular**.
2.  Navigate to the **Cases** page.
3.  **Expectation**:
    - You should only see cases you created OR cases linked to your specific company.
    - You should NOT see cases from other companies in the same organization.

---

## 3. Case Visibility: External Advanced
**Goal**: Verify siloed visibility for advanced partner users.

1.  **Login** as a user marked as **External Advanced**.
2.  Navigate to the **Cases** page.
3.  **Expectation**:
    - You should see **cases** belonging to your **Company**, regardless of which user created them.
    - You should NOT see cases from other companies in the same organization.
4.  Navigate to the **Map** page.
    - **Expectation**: Points on the map should reflect only data within your Company.

---

## 4. Case Visibility: IDH Internal
**Goal**: Verify staff access via the new `user_type` flag.

1.  **Login** as a user marked as **IDH Internal** (role "User").
2.  Navigate to the **Cases** page.
3.  **Expectation**:
    - You should see all **Public** cases in the system, even if you are not assigned to a specific Business Unit or Company.
    - (Staff visibility logic is now decoupled from Business Unit presence).

---

## 5. Security Regression (Cross-Org Check)
**Goal**: Ensure "Advanced" doesn't mean "Admin".

1.  **Login** as an **External Advanced** user from *Organisation A*.
2.  Try to access a direct URL/ID of a case from *Organisation B*.
3.  **Expectation**: Access should be denied (404 or redirect), and the case should not appear in lists.

---

## 6. Feature Gating & Permissions (Refinement #731)
**Goal**: Verify granular access controls for modelling and data tools.

### A. External Regular (Editor vs Viewer)
- **Editor**: Should see **DISABLED** "Data Upload" (Step 1) and **HIDDEN** "Optimisation Chart" (Step 4), but **ENABLED** Modelling (Step 5).
- **Viewer**: Should see **DISABLED** Modelling (Step 5).

### B. IDH Internal / External Advanced (Viewer)
- **Viewer**: Should see **VISIBLE but DISABLED** Modelling (Step 5) and **HIDDEN** "Data Upload".

### Access Control Matrix
| User Type | Role | Data Upload | Adv Tools | Opt. Chart |
|-----------|------|-------------|-----------|------------|
| Ext Reg | Editor | Hidden | Enabled | Hidden |
| Ext Reg | Viewer | Hidden | Disabled | Hidden |
| Internal | Viewer | Hidden | Disabled | Visible |
| Ext Adv | Editor | Visible | Enabled | Visible |

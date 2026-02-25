# UI QA Guide: User Restrictions & View-Only Mode (#731)

This guide verifies that the feature gating and permission model correctly adhere to the assigned user roles and case permissions.

---

## 1. External Regular (Editor vs Viewer)
**Goal**: Verify that External Regular editors can edit modelling data but cannot upload data or see the Optimisation Chart.

### A. Editor Role
1. **Login** as a user marked as **External Regular**.
2. **Open a Case** where you are assigned as an **Editor**.
3. **Verify Step 1**:
    - "Data Upload" tab must be **HIDDEN**.
4. **Verify Step 4**:
    - "Optimisation Algorithm" chart must be **HIDDEN**.
    - Other tools (like Sensitivity Analysis) should be **VISIBLE and ENABLED**.
5. **Verify Step 5**:
    - "Advanced Modelling Tool" must be **VISIBLE and ENABLED**.

### B. Viewer Role
1. **Open a Case** where you are assigned as a **Viewer**.
2. **Check Interactivity**:
    - All modelling inputs in Step 5 should be **VISIBLE but DISABLED**.
    - You should NOT be able to save or modify any data.

---

## 2. Advanced User (Internal/Ext Adv) - Viewer Mode
**Goal**: Verify that Advanced users assigned as "Viewers" can see the tools but not edit them.

1. **Login** as **Internal** or **External Advanced**.
2. **Open a Case** where you are assigned as a **Viewer**.
3. **Verify Visibility**:
    - "Data Upload" tab (Step 1) should be **HIDDEN**.
    - Advanced Tools (Step 4 & 5) should be **VISIBLE**.
4. **Verify Interactivity**:
    - All inputs in Modelling tools (Step 5) must be **DISABLED**.
    - User should see the existing model values but cannot change them.

---

## 3. Robustness & Stability
**Goal**: Verify the app does not crash during state transitions.

1. **Login** and navigate rapidly between different cases.
2. **Expectation**: No "White Screen of Death" or console errors related to `toLowerCase`.
3. **Owner Check**: Verify that a user who created a case can still edit it even if their email is stored in a different case (e.g., lowercase vs uppercase).

---

## 4. Logical Check (Matrix)

| User Type | Role | Data Upload | Adv Tools | Opt. Chart |
|-----------|------|-------------|-----------|------------|
| Ext Reg | Editor | Hidden | Enabled | Hidden |
| Ext Reg | Viewer | Hidden | Disabled | Hidden |
| Internal | Viewer | Hidden | Disabled | Visible |
| Ext Adv | Editor | Visible | Enabled | Visible |

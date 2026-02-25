# QA Guide: User Restrictions & View-Only Mode (#731)

This guide provides instructions for verifying the feature restrictions applied to external users (Regular and Advanced) to ensure consistency and prevent unauthorized edits.

---

## 1. Setup Phase
1. **Identify Test Users**:
   - `Internal`: A user with `role: "user"` and `user_type: "internal"`.
   - `External`: A user with `role: "user"` and `user_type: "external_regular"` or `"external_advanced"`.
2. **Select Case**: Use a case owned by the `Internal` user for all tests.

---

## 2. Step 1: Data Entry & Upload
**Goal**: Verify Data Upload is restricted.

1. **Login** as the `External` user.
2. Navigate to **Step 1 (Case Form)**.
3. **Verify UI Elements**:
   - [ ] The **"Data upload"** tab must NOT be visible.
   - [ ] The **"Download template"** button next to Global Variables must NOT be visible.
4. **Verification**: Confirm that only manual data entry is possible.

---

## 3. Step 4: Analysis Interactivity
**Goal**: Verify "View-Only" mode for advanced analysis tools.

1. **Login** as the `External` user.
2. Navigate to **Step 4 (Assess Impact)**.
3. **Select the Goal (Adjust Income Target)**:
   - [ ] Open the "Adjust your income target" modal.
   - [ ] **Verify**: The "Save income target" button must be **disabled**.
4. **Optimize Income Target**:
   - [ ] **Verify**: "The income gap to be closed by:" input must be **disabled**.
   - [ ] **Verify**: "Run the model" button must be **disabled**.
5. **Three Driver Calculator**:
   - [ ] **Verify**: "Select the third driver to calculate:" dropdown must be **disabled**.
6. **Browsing Test**:
   - [ ] **Verify**: The **Segment Selector** must remain **ENABLED**. Change segments and verify charts update to reflect pre-calculated data.

---

## 4. Step 5: Modelling Interactivity
**Goal**: Verify "View-Only" mode for Advanced Modelling Tool.

1. **Login** as the `External` user.
2. Navigate to **Step 5 (Closing Gap)**.
3. **Advanced Modelling Tool**:
   - [ ] **Verify**: modelling Inputs (Price, Volume, etc.) must be **disabled**.
   - [ ] **Verify**: Scenario selection tabs (Current, Feasible, Model) should be visible but **Calculate** interactions should be restricted.
4. **Final Action**:
   - [ ] **Verify**: The **"Mark as complete"** button at the bottom of the page must be **hidden or disabled**.

---

## 5. Security & Persistence Check
1. **Direct API Attempt (Optional)**: If possible, attempt a `POST` or `PUT` to a restricted Case ID via terminal.
2. **Expectation**: Backend should return `403 Forbidden` if permissions are correctly aligned (Logic in `Case.js` handles frontend state, while backend permissions use existing Case ownership/sharing logic).

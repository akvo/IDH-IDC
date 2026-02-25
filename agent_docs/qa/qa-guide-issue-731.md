# QA Guide: User Restrictions & View-Only Mode (#731)

This guide provides instructions for verifying the feature restrictions applied to external users (Regular and Advanced) to ensure consistency and prevent unauthorized edits.

---

## 1. Setup Phase
1. **Identify Test Users**:
   - `Internal`: A user with `role: "user"` and `user_type: "internal"`.
   - `External Regular`: A user with `role: "user"` and `user_type: "external_regular"`.
   - `External Advanced`: A user with `role: "user"` and `user_type: "external_advanced"`.
2. **Select Case**: Use a case owned by the `Internal` user for regular testing; use cases from other companies in the same org for advanced testing.

---

## 2. Step 1: Data Entry & Upload
**Goal**: Verify Data Upload is restricted ONLY for Regular users.

1. **Login** as the `External Regular` user.
2. Navigate to **Step 1 (Case Form)**.
3. **Verify**: The **"Data upload"** tab and **"Download template"** button must NOT be visible.
4. **Login** as the `External Advanced` user.
5. Navigate to **Step 1 (Case Form)**.
6. **Verify**: The **"Data upload"** tab and **"Download template"** button MUST be visible.

---

## 3. Step 4: Analysis Interactivity
**Goal**: Verify "View-Only" mode for Regular users and full access for Advanced.

1. **Login** as the `External Regular` user.
2. Navigate to **Step 4 (Assess Impact)**.
3. **Verify**: Inputs in "Adjust Income Target", "Optimize Income Target", and "Three Driver Calculator" must be **disabled**.
4. **Login** as the `External Advanced` user.
5. Navigate to **Step 4 (Assess Impact)**.
6. **Verify**: All inputs in Step 4 must be **ENABLED**.

---

## 4. Step 5: Modelling Interactivity
**Goal**: Verify "View-Only" mode for Regular users and full access for Advanced.

1. **Login** as the `External Regular` user.
2. Navigate to **Step 5 (Closing Gap)**.
3. **Verify**: modelling Inputs and "Mark as complete" button must be **disabled/hidden**.
4. **Login** as the `External Advanced` user.
5. Navigate to **Step 5 (Closing Gap)**.
6. **Verify**: modelling Inputs and "Mark as complete" button must be **ENABLED**.

---

## 5. Visibility Check (Siloed Data)
**Goal**: Verify External Advanced users are restricted to their company data.

1. **Login** as the `External Advanced` user.
2. Navigate to the **Case List**.
3. **Expectation**: You should ONLY see cases belonging to your **Company**.
4. **Verification**: Confirm you CANNOT see cases from other companies in the same Organisation (unlike previous behavior).

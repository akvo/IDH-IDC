# UI QA Guide - Issue #740

## Role Identification
- **Affected Roles**: All users (Admin, Internal, External).
- **Scope**: Step 3 (Understand Income Gap) and Step 4 (Assess Impact).

## Happy Path: Feature Gating
1. **Login** and open a Case with segments.
2. **Navigate to Step 2** and verify one segment has "Current Income" >= "Income Target".
3. **Go to Step 3**:
    - [ ] **Action**: Select the segment that meets the target.
    - [ ] **Check**: "Additional income needed" chart is replaced by an IDC-branded alert: "Income target reached".
    - [ ] **Check**: Alert uses teal colors (#01625f) and has correct icon alignment.
    - [ ] **Check**: Card height matches the "Household Income Composition" card.
4. **Go to Step 4**:
    - [ ] **Action**: Select the same high-income segment.
    - [ ] **Check**: "Single driver change" table is replaced by the same IDC alert.

## Happy Path: Ungated View
1. **Navigate to Step 3**:
    - [ ] **Action**: Select a segment that is BELOW the income target.
    - [ ] **Check**: "Additional income needed" pie chart is visible and functional.
2. **Go to Step 4**:
    - [ ] **Action**: Select the same segment.
    - [ ] **Check**: "Single driver change" table is visible and functional.

## Edge Cases
- **Exact Match**: Verify gating triggers when current income is exactly equal to the target.
- **Empty Data**: Ensure no crash occurs if dashboard data is loading or empty.

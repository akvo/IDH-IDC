# Feature: Disable Features When Income > Target (#740)

## Overview
IDH has requested that certain forward-looking analysis features be disabled for segments where the current income is already above the living income target. This prevents confusion and irrelevant analysis for segments that have already achieved the goal.

## Requirements
When a segment's calculated current income is greater than or equal to the income target:

### 1. STEP 3: "Additional income needed" Pie Chart
- **Location**: Step 3 (Understand Income Gap), right-hand side pie chart.
- **Action**: Disable/Hide the chart.
- **Alternative UI**: Display the message: "Farmers in this segment already earn more than the income target. This feature is therefore disabled."

### 2. STEP 4: Single Driver Change
- **Location**: Step 4 (Closing the Gap), "Single driver change" section.
- **Action**: Disable the inputs or the entire section.
- **Alternative UI**: Display the message: "Farmers in this segment already earn more than the income target. This feature is therefore disabled."

## Technical Analysis
- **Data Source**: `CaseVisualState` (pullstate store).
- **Comparison Logic**: `currentDashboardData.total_current_income >= currentDashboardData.target`.
- **Target Income Source**:
    - Step 3: `currentDashboardData.target`.
    - Step 4: `adjustedIncometarget` (from sensitivity analysis config) falling back to `currentDashboardData.target`.
- **Components to Modify**:
    - `frontend/src/pages/cases/visualizations/ChartNeededIncomeLevel.js`: Wrap the chart or visualization content.
    - `frontend/src/pages/cases/components/SingleDriverChange.js`: Wrap the table or the entire card content.

## User Stories
- **US.1**: As a user, I should see a clear message in Step 3 instead of the "Additional income needed" chart if the segment earns more than the target.
- **US.2**: As a user, I should be informed in Step 4 that "Single driver change" is irrelevant if the income target is already met.

## Acceptance Criteria
- [ ] Logic implemented to compare `currentIncome` vs `targetIncome`.
- [ ] Step 3: Right pie chart replaced by the specified message when `currentIncome >= targetIncome`.
- [ ] Step 4: Single Driver Change section displays the specified message and restricts interaction when `currentIncome >= targetIncome`.
- [ ] Features remain fully functional for segments where `currentIncome < targetIncome`.

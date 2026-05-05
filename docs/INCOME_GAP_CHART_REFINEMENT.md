# Feature Specification: Income Gap Chart Refinement

## Overview
The "Income Gap Scenario Modeling" chart currently assumes that scenario modeling will always result in an income increase. This refinement updates the visualization to handle income decreases (non-monotonic changes) by introducing a dynamic stacking logic and a color-coded "Income Decrease" segment.

## Requirements
- **Dynamic Stacking**: The chart must detect if a scenario results in an income increase or decrease relative to the current state.
- **Color Coding**:
    - **Increase**: Use Light Green (`#49D985`) for the "Additional Income" segment.
    - **Decrease**: Use Red (`#FF4D4F`) for the "Income Decrease" segment.
- **Gap Calculation**:
    - If income increases: Gap is the difference between `newTotalIncome` and `incomeTarget`.
    - If income decreases: The visual gap represents the distance from the *new* lower income to the target. To preserve context, the stack will show the "Decrease" (Red) on top of the "New Income", and the "Gap" (Yellow) on top of the "Current Income" level.
- **Constraints**:
    - The visualized gap cannot exceed the `incomeTarget`.
    - Base income (Dark Green) is floored at 0.

## User Experience (UX)
- **Legend**: The legend should dynamically update its label to reflect either "Additional income when income drivers are changed" or "Income decrease when income drivers are changed."
- **Visual Contrast**: The use of IDC-branded Red (`#FF4D4F`) provides immediate visual feedback that a modeled scenario has a negative impact on income.

## Technical Implementation
- **Visualisation Component**: `frontend/src/pages/cases/visualizations/ChartSegmentsIncomeGapScenarioModeling.js`
- **Data Source**: `ScenarioModelingIncomeDriversAndChart.js` (logic integration)
- **Logic**:
    - `isIncrease = newTotalIncome >= currentTotalIncome`
    - **Increase Stack**:
        1. Base: `currentTotalIncome`
        2. Change: `newTotalIncome - currentTotalIncome` (Green)
        3. Gap: `Math.max(0, target - newTotalIncome)` (Yellow)
    - **Decrease Stack**:
        1. Base: `newTotalIncome`
        2. Change: `currentTotalIncome - newTotalIncome` (Red)
        3. Gap: `Math.max(0, target - currentTotalIncome)` (Yellow)

## Verification Plan
- [ ] Test with a scenario that increases income: Verify Green segment is shown.
- [ ] Test with a scenario that decreases income: Verify Red segment is shown and gap is correctly expanded.
- [ ] Test with income above target: Verify gap is 0.
- [ ] Test with negative income: Verify base is floored at 0 and gap fills the remaining target.

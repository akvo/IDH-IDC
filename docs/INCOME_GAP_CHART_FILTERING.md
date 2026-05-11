# Feature Specification: Income Gap Chart Filtering

## Overview
This specification updates the behavior of the "Optimal driver values to reach your target" chart to handle non-monotonic changes (income decreases) by filtering out the affected segments instead of visualizing the loss. This avoids visual clutter and overlapping items in the stacked bar chart.

## Requirements
- **Automatic Filtering**: The chart must compare `newTotalIncome` with `currentTotalIncome` for each segment in the active scenario.
- **Exclusion Rule**: Any segment where `newTotalIncome < currentTotalIncome` must be excluded from the chart data.
- **User Notification**:
    - If one or more segments are filtered out, a warning message must be displayed: "This graph only shows segments with improved or unchanged income in this scenario".
    - The warning should be visible but non-intrusive (e.g., an Ant Design Alert).
- **Persistence**: This filtering only affects the *visualization*. The underlying scenario data and calculations in the tables remain unchanged.

## User Experience (UX)
- **Consistency**: Users will only see segments that are moving towards or maintaining the target.
- **Transparency**: The warning clearly explains why some segments might be missing from the chart, preventing confusion.

## Technical Implementation
- **Visualisation Component**: `frontend/src/pages/cases/visualizations/ChartSegmentsIncomeGapScenarioModeling.js`
- **Filtering Logic**:
    ```javascript
    const filteredValues = scenarioValues.filter(sv => {
        const current = sv.currentSegmentValue?.total_current_income || 0;
        const updated = sv.updatedSegmentScenarioValue?.total_current_income || 0;
        return updated >= current;
    });
    ```
- **UI Element**: `antd` `Alert` component with `type="warning"` and `showIcon`.

## Verification Plan
- [ ] Test with a scenario where all segments increase: Verify no warning and all segments shown.
- [ ] Test with a scenario where one segment decreases: Verify warning appears and only increasing segments are shown.
- [ ] Test with all segments decreasing: Verify warning and empty chart state (with appropriate "No data" message from Chart component).

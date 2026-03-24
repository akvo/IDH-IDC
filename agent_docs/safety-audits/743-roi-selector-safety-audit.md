# Technical Safety Audit: ROI Scenario-Segment Multi-Selector (#743)

## Change Overview
- **Component**: `ImpactOfInvestmentCharts.js`
- **Logic**: Replaced single-select state with multi-select state and updated `useMemo` filtering logic.
- **Goal**: Support side-by-side comparison of specific ROI metrics.

## Risk Assessment

### 1. Data Integrity & Default States
- **Risk**: Selection being empty on initial load could lead to a blank chart.
- **Audit**: The logic in `roiChartRoiData` defaults to mapping `allScenariosRoiData` when `selectedRoiScenarioSegments` is empty. This preserves the "All Segments" overview for all scenarios on load.
- **Status**: PASSED

### 2. Scalability & Performance
- **Risk**: Selecting too many combinations could slow down rendering or degrade chart readability.
- **Audit**: A hard limit of `MAX_SCENARIO_SEGMENT = 5` is enforced. This matches the established pattern for the Cost chart and ensures visual stability.
- **Status**: PASSED

### 3. Delimiter Consistency
- **Risk**: Using a common character as a separator (e.g., `-`) could break if scenario names contain that character.
- **Audit**: The implementation uses the robust `::: ` delimiter (matching STORY-743-9 pattern), which minimizes collision risk with scenario or segment names.
- **Status**: PASSED

### 4. Regression in ROI Calculations
- **Risk**: The new mapping logic might retrieve incorrect segment metrics.
- **Audit**: The logic correctly maps `segId === "all"` to the top-level scenario ROI and specific `segId` to `scenario.segmentMetrics?.[segId]`. It handles the "No Data" case by returning a zero-value fallback structure.
- **Status**: PASSED

### 5. Linting & Syntax
- **Audit**: Verified with `yarn lint`. Exit code 0.
- **Status**: PASSED

## Conclusion
The implementation is safe for merge. It aligns with existing UX patterns and uses robust delimiters for data parsing. No backend changes were required, ensuring zero risk to data persistence.

# Feature: ROI Scenario-Segment Selector Refinement (#743)

## Overview
This feature refines the "Return on Investment" chart in Step 5 (Scenario Modelling) to allow users to select specific combinations of scenarios and segments, matching the interaction pattern of the "Scenario Cost by component" chart.

## Problem Statement
Currently, the ROI chart only allows filtering by segment, showing all scenarios for that specific segment. Users cannot easily compare specific scenario-segment combinations (e.g., Scenario A - Segment 1 vs. Scenario B - Segment 2) in this view.

## Proposed Solution
- Replace the single segment selector in the "Return on Investment" section with a multi-selector for Scenario-Segment combinations.
- Support up to 5 combinations side-by-side.
- Default to "All Segments" for all scenarios if no selection is made.

## User Requirements
- **Selector**: A multi-select dropdown that allows picking `Scenario - Segment` combinations.
- **Limit**: Maximum 5 combinations to maintain chart readability.
- **Visual Consistency**: Use the same color scheme and selector style as the "Scenario Cost by component" chart.
- **Labeling**: Chart bars should clearly label both the Scenario and the Segment name.

## Technical Requirements
- **Component**: `ImpactOfInvestmentCharts.js`
- **State**: Replace `selectedRoiSegmentId` with `selectedRoiScenarioSegments` (array of `scenarioKey:::segmentId`).
- **Data Filtering**: Update `roiChartRoiData` to map over the selected combinations and extract the relevant metrics from `allScenariosRoiData`.
- **UI Layout**: Update the `Row` and `Col` structure to match the zigzag pattern while incorporating the new selector.

## Acceptance Criteria
- [ ] ROI chart shows a multi-select dropdown for "Scenarios and Segments".
- [ ] Users can select up to 5 combinations.
- [ ] The chart updates in real-time based on selection.
- [ ] If no selection is made, it defaults to showing "All Segments" for all available scenarios.
- [ ] The bar colors are consistent with the "Scenario Cost by component" chart.

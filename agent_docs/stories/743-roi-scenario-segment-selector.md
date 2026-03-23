# Story: ROI Scenario-Segment Multi-Selector (#743)

## User Story
**As a** decision-maker,
**I want to** select specific combinations of scenarios and segments in the ROI chart,
**So that** I can compare the cost-effectiveness of different intervention strategies side-by-side.

## Acceptance Criteria (UAC)
- [ ] Replace the single segment dropdown with a multi-select dropdown for `Scenario - Segment` combinations.
- [ ] Max selection limit is set to 5.
- [ ] Selection values follow the `scenarioKey:::segmentId` format.
- [ ] Chart bars are colored using the `scenarioColors` palette based on selection index.
- [ ] Chart bar labels show `${scenarioName} - ${segmentName}`.
- [ ] If no selection is made, show "All Segments" for all scenarios as the default view.
- [ ] The "Return on Investment" heading and description are preserved.

## Technical Acceptance Criteria (TAC)
- [ ] Update state in `ImpactOfInvestmentCharts.js`: rename `selectedRoiSegmentId` to `selectedRoiScenarioSegments` (default `[]`).
- [ ] Refactor `roiChartRoiData` useMemo to:
    - If `selectedRoiScenarioSegments` is empty, map `allScenariosRoiData` to show all scenarios with "All Segments".
    - Else, map over `selectedRoiScenarioSegments`, splitting the keys and finding the corresponding data in `allScenariosRoiData` or `currentCase.segments`.
- [ ] Ensure `roiChartData` uses the `displayName` from the filtered data.
- [ ] Update JSX to use a multi-select `Select` component with `scenarioSegmentOptions`.
- [ ] Ensure lint-clean status and no regression in ROI calculations.

## Timeline & Effort
- **Estimation**: 4 hours
- **Priority**: High

## Definition of Done (DoD)
- [ ] Code is lint-clean (`yarn lint`).
- [ ] UI is responsive and matches Figma zigzag pattern.
- [ ] ROI values are verified against single-select baseline.
- [ ] Feature document updated.

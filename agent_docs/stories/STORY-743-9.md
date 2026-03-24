## Story: STORY-743-9 — Scenario-Segment Multi-Selector in Step 5

**As a** Strategic Investor
**I want** to select specific combinations of Scenarios and Farmer Segments
**So that** I can compare the implementation costs and ROI of diverse strategic interventions side-by-side.

### Timeline & Effort
- **Estimated Time**: 4h
- **Effort Points**: 3 (Medium)

### Acceptance Criteria
#### User Acceptance Criteria (UAC)
- [x] Replace separate Scenario and Segment dropdowns with a single multi-select `Select` component in Step 5 charts.
- [x] Multi-select supports up to 5 combinations of `Scenario Name - Segment Name`.
- [x] Bars in "Scenario Cost by component" and "ROI" charts update to show one group/bar per selection.
- [x] X-axis labels consistently use the `[Scenario Name] - [Segment Name]` format.
- [x] "Segment Cost Breakdown" table updates to show the first active selection's details.
- [x] A contextual indicator (e.g., "Showing breakdown for: Scenario A - Segment B") is displayed above the breakdown table.
- [x] Implementation verified with `yarn lint` and browser check.

#### Technical Acceptance Criteria (TAC)
- [x] Define `MAX_SCENARIO_SEGMENT = 5` and `selectedScenarioSegments` state in `ImpactOfInvestmentCharts.js`.
- [x] Implement `scenarioSegmentOptions` using a cross-product of all available scenarios and segments.
- [x] Refactor `roiData` memo in `ImpactOfInvestmentCharts.js` to iterate over matching data for `selectedScenarioSegments`.
- [x] Update `componentCostChartData` and `roiChartData` memos to use selection-specific display names and colors.
- [x] Replace existing UI Select components in the description columns of both charts.

### Technical Notes
- Dependencies: Requires `STORY-743-7` (Scenario Selector) to be complete.
- Patterns: Align with `ChartIncomeGapAcrossScenario.js` implementation for consistency.
- Precision: Ensure `roiData` correctly extracts `segmentMetrics` for the specific `segmentId` in the selection.

### Definition of Done
- [x] Code is lint-free (`yarn lint`).
- [x] Multi-select correctly limits to 5 items.
- [x] Charts correctly reflect selected combinations.
- [x] UI is responsive and follows IDH brand styles.
- [x] QA guide verified.

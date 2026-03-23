## Story: STORY-743-9 — Scenario-Segment Multi-Selector in Step 5

**As a** Strategic Investor
**I want** to select specific combinations of Scenarios and Farmer Segments
**So that** I can compare the implementation costs and ROI of diverse strategic interventions side-by-side.

### Timeline & Effort
- **Estimated Time**: 4h
- **Effort Points**: 3 (Medium)

### Acceptance Criteria
#### User Acceptance Criteria (UAC)
- [ ] Replace separate Scenario and Segment dropdowns with a single multi-select `Select` component in Step 5 charts.
- [ ] Multi-select supports up to 5 combinations of `Scenario Name - Segment Name`.
- [ ] Bars in "Scenario Cost by component" and "ROI" charts update to show one group/bar per selection.
- [ ] X-axis labels consistently use the `[Scenario Name] - [Segment Name]` format.
- [ ] "Segment Cost Breakdown" table updates to show the first active selection's details.
- [ ] A contextual indicator (e.g., "Showing breakdown for: Scenario A - Segment B") is displayed above the breakdown table.
- [ ] Implementation verified with `yarn lint` and browser check.

#### Technical Acceptance Criteria (TAC)
- [ ] Define `MAX_SCENARIO_SEGMENT = 5` and `selectedScenarioSegments` state in `ImpactOfInvestmentCharts.js`.
- [ ] Implement `scenarioSegmentOptions` using a cross-product of all available scenarios and segments.
- [ ] Refactor `roiData` memo in `ImpactOfInvestmentCharts.js` to iterate over matching data for `selectedScenarioSegments`.
- [ ] Update `componentCostChartData` and `roiChartData` memos to use selection-specific display names and colors.
- [ ] Replace existing UI Select components in the description columns of both charts.

### Technical Notes
- Dependencies: Requires `STORY-743-7` (Scenario Selector) to be complete.
- Patterns: Align with `ChartIncomeGapAcrossScenario.js` implementation for consistency.
- Precision: Ensure `roiData` correctly extracts `segmentMetrics` for the specific `segmentId` in the selection.

### Definition of Done
- [ ] Code is lint-free (`yarn lint`).
- [ ] Multi-select correctly limits to 5 items.
- [ ] Charts correctly reflect selected combinations.
- [ ] UI is responsive and follows IDH brand styles.
- [ ] QA guide verified.

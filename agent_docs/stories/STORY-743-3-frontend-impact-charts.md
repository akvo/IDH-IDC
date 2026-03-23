## Story: Impact Calculation & Visualizations (Frontend)
**Status**: [x] COMPLETED
**As a** Decision Maker
**I want** to see a visual comparison of ROI across my scenarios
**So that** I can prioritize the most cost-effective investments

### Timeline & Effort
- **Estimated Time**: 10h
- **Actual Time**: 8h
- **Effort Points**: 8

### Acceptance Criteria
#### User Acceptance Criteria (UAC)
- [x] "Scenario Efficiency Comparison" bar chart renders total impact score per scenario.
- [x] "Impact Breakdown" chart renders impact distributed per segment.
- [x] "Efficiency Table" (as part of outcomes) provides Summary, Gain, Cost, and ROI score.
- [x] Flowchart/Visual breakdown showing component cost percentages.
- [x] The charts and table update immediately when costs or modelling variables change.

#### Technical Acceptance Criteria (TAC)
- [x] Implement `calculateImpactROI` using the formula: `(Income % Increase / Total Cost) * 100`.
- [x] Implement cost normalization to segment level (Total, Per Farmer, Per Land Unit).
- [x] Implement component percentage calculation: `(Component Cost / Total Cost) * 100`.
- [x] Integrate new ROI charts into the existing `ScenarioModelingIncomeDriversAndChart.js` layout, ensuring existing income charts remain functional.
- [x] Create `ChartScenarioEfficiency.js` and `ChartImpactBreakdown.js`.
- [x] Create `InvestmentEfficiencyTable.js` using Ant Design `Table`.
- [x] Add conditional rendering to only show these components when Investment Analysis is enabled.

### Technical Notes
- Handle "Division by Zero" scenarios gracefully (e.g., if cost is 0).
- Proportional cost distribution logic must be verified against multi-segment cases.

### Definition of Done
- [x] ROI values verified against manual spreadsheet calculations.
- [x] Responsive chart layout.
- [x] Unit tests for calculation utility.

## Story: Impact Calculation & Visualizations (Frontend)
**As a** Decision Maker
**I want** to see a visual comparison of ROI across my scenarios
**So that** I can prioritize the most cost-effective investments

### Timeline & Effort
- **Estimated Time**: 10h
- **Actual Time**: [Leave empty initially]
- **Effort Points**: 8

### Acceptance Criteria
#### User Acceptance Criteria (UAC)
- [ ] "Scenario Efficiency Comparison" bar chart renders total impact score per scenario.
- [ ] "Impact Breakdown" chart renders impact distributed per segment.
- [ ] "Efficiency Table" (as part of outcomes) provides Summary, Gain, Cost, and ROI score.
- [ ] Flowchart/Visual breakdown showing component cost percentages.
- [ ] The charts and table update immediately when costs or modelling variables change.

#### Technical Acceptance Criteria (TAC)
- [ ] Implement `calculateImpactROI` using the formula: `(Income % Increase / Total Cost) * 100`.
- [ ] Implement cost normalization to segment level (Total, Per Farmer, Per Land Unit).
- [ ] Implement component percentage calculation: `(Component Cost / Total Cost) * 100`.
- [ ] Integrate new ROI charts into the existing `ScenarioModelingIncomeDriversAndChart.js` layout, ensuring existing income charts remain functional.
- [ ] Create `ChartScenarioEfficiency.js` and `ChartImpactBreakdown.js`.
- [ ] Create `InvestmentEfficiencyTable.js` using Ant Design `Table`.
- [ ] Add conditional rendering to only show these components when Investment Analysis is enabled.

### Technical Notes
- Handle "Division by Zero" scenarios gracefully (e.g., if cost is 0).
- Proportional cost distribution logic must be verified against multi-segment cases.

### Definition of Done
- [ ] ROI values verified against manual spreadsheet calculations.
- [ ] Responsive chart layout.
- [ ] Unit tests for calculation utility.

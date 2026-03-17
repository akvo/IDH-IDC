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
- [ ] A new "Impact Comparison" bar chart renders in Step 5.
- [ ] The chart shows "Net Income Increase / $ Investment" for all modeled scenarios.
- [ ] An "Efficiency Table" provides a summary of Scenario, Gain, Cost, and ROI.
- [ ] The chart and table update immediately when costs or modelling variables change.

#### Technical Acceptance Criteria (TAC)
- [ ] Implement `calculateImpactROI` logic in `frontend/src/pages/cases/utils/incomeCalculations.js`.
- [ ] Create `ChartImpactComparison.js` using `VisualCardWrapper`.
- [ ] Create `InvestmentEfficiencyTable.js` using Ant Design `Table`.
- [ ] Add conditional rendering to only show these components when Investment Analysis is enabled.

### Technical Notes
- Handle "Division by Zero" scenarios gracefully (e.g., if cost is 0).
- Proportional cost distribution logic must be verified against multi-segment cases.

### Definition of Done
- [ ] ROI values verified against manual spreadsheet calculations.
- [ ] Responsive chart layout.
- [ ] Unit tests for calculation utility.

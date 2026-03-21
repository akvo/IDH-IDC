# STORY-743-5: ROI Logic & Cost Allocation

## Description
As a premium user, I want the system to automatically calculate the impact of my investment based on scenario modeling results, so that I can immediately see the efficiency of different strategies.

## User Acceptance Criteria (UAC)
- [ ] **ROI Formula**: `Impact of Investment = (% Increase in Household Income / Total Cost) * 100`.
- [ ] **Cost Allocation**: If per-segment costs are NOT provided, the total investment is split across segments proportionally by farmer count.
- [ ] **Land Area Multipliers**: "Per Land Unit" costs correctly multiply by the segment's total land area (`avg_land_area * farmers`).
- [ ] **Rounding**: All ROI figures are rounded to 2 decimal places.
- [ ] **Real-time Updates**: ROI values update instantly when scenario income or investment costs change.

## Technical Acceptance Criteria (TAC)
- [ ] Implement `calculateScenarioROI` utility in `roiCalculations.js`.
- [ ] Integrate with `ImpactOfInvestmentCharts.js` to provide the final dataset.
- [ ] Add `totalLandArea` calculation in `roiCalculations.js` (fetching `avg_land_area` from base case).
- [ ] Unit Test: Create `roiCalculations.test.js` to verify formula accuracy.

## Timeline & Effort
- **Estimation**: 6 hours
- **Priority**: HIGH
- **Definition of Done**: Utilities implemented, tested, and integrated into the visualization layer.

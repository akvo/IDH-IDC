# User Story: STORY-743-7 — ROI Scenario Selector & Cost Transparency

**Status**: COMPLETED
**Priority**: HIGH
**Agent**: Amelia (Dev) / Sally (UX)

## Context
As the number of scenarios and segments grows, users need a way to focus on the investment impact of a single scenario. Additionally, the complex aggregation logic (Cost * Farmer Count across segments) can lead to unexpected totals (e.g., the 402k issue) if inputs are inconsistent across segments.

## User Statement
"As an analyst, I want to filter the ROI charts by scenario and see a segment-level cost breakdown so that I can understand exactly how my investment is being spent across different farmer groups."

## User Acceptance Criteria (UAC)
1. [ ] **Scenario Selector**: A dropdown is visible below the "Scenario Cost by component" chart description.
2. [ ] **Selection Options**: Includes "Compare Scenarios" (all) and a list of specific modeled scenarios.
3. [ ] **Filtered Charts**: Selecting a specific scenario updates both ROI charts to show ONLY that scenario's data.
4. [ ] **Segment Breakdown Table**: When a single scenario is selected, a new table appears showing:
    - Segment Name
    - Component Name
    - Unit Type (Total / Per Farmer / Per Land Unit)
    - Input Cost
    - Calculated Contribution (Cost * Multiplier)
5. [ ] **Error Visibility**: Calculations in the breakdown table must use the same logic as the aggregate charts to help identify input errors (like incorrect units).

## Technical Acceptance Criteria (TAC)
- Implement `selectedScenarioKey` using local state in `ImpactOfInvestmentCharts.js`.
- Use Ant Design `<Select>` for the dropdown.
- Update `roiData` filtering logic to respect the selection.
- Create a `SegmentCostBreakdown` sub-component or inline Table for the visibility check.
- Ensure the breakdown matches the refactored `calculateScenarioROI` logic in `roiCalculations.js`.

## Timeline & Effort
- **Estimation**: 4 Hours
- **Phase**: Implement (Phase 7)

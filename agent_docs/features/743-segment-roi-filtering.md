# Feature: Segment-Level ROI Filtering (#743)

## Overview
Users need to analyze the Return on Investment (ROI) and cost breakdown not just at the aggregate scenario level, but also on a per-segment basis. This allows for identifying which farmer segments are driving the ROI or where the most significant investments are relative to the impact.

## Requirements
- **Segment Selector**: A dropdown menu (`Select`) placed below the ROI chart description.
- **Filtering Logic**:
  - **"All Segments" (Default)**: Shows aggregate scenario-level ROI and total component costs.
  - **Specific Segment**: Shows the ROI specifically for that segment and the component costs attributed to it.
- **Chart Impact**:
  - `Return on Investment (%)` chart should update to show segment-specific ROI.
  - `Scenario Cost by component` chart should update to show segment-specific component costs.
- **Consistency**: The selector should be synchronized across scenarios if relevant, or simply act as a global filter for the Step 5 ROI visualizations.

## Technical Approach
1. **Utility Update (`roiCalculations.js`)**:
   - Ensure `segmentMetrics` includes an `roi` field (`incomeImprovement / totalCost`).
2. **Component Update (`ImpactOfInvestmentCharts.js`)**:
   - Add `selectedSegmentId` state.
   - Generate options from `dashboardData`.
   - Update `roiData` memo to handle segment-level filtering.
   - Inject the `Select` component below the section description.

## UX Specification
- **Component**: Ant Design `Select`.
- **Placement**: Below the section-description text, above the charts.
- **Labels**: "View data for: [ All Segments | Male | Female | etc. ]"

## Verification Plan
- Verify that selecting a segment updates the ROI bars to match the segment-level profitability.
- Verify that the cost breakdown chart only shows costs attributed to the selected segment.
- Verify that "All Segments" still shows the correct aggregate results.

# Feature Specification: Return on Investment (ROI) & Impact of Investment

This document consolidates all features related to the Return on Investment (ROI) modeling and visualization module introduced in Step 5 (Scenario Modelling).

---

## 1. Overview
The ROI module allows users to model the cost of interventions and analyze their impact on farmer income. It includes features for proportional cost allocation, scenario-segment filtering, and multi-selection for comparisons.

---

## 2. Investment Input & Proportional Allocation (#743)

Users can input scenario costs using three distinct modes:
*   **"No"**: Disable ROI analysis for the current scenario.
*   **"Yes, for all farmers"**: Input a single cost shared across all segments.
*   **"Yes, per segment"**: Input specific costs for each farmer segment.

### Proportional Logic ("All Farmers" mode)
When "Yes, for all farmers" is selected, the system distributes the input cost based on the **farmer headcount ratio** of each segment.
```text
Segment_Cost = Total_Investment * (Segment_Farmers / Case_Total_Farmers)
```

---

## 3. Visualization & Filtering (#743)

The ROI visualizations include:
*   **Return on Investment (%) Chart**: A bar chart showing the calculated ROI for up to 5 scenario-segment combinations.
*   **Scenario Cost by Component Chart**: A stacked bar chart showing the breakdown of investment costs (e.g., Training, Financing).
*   **Segment Breakdown Table**: A detailed transparency table showing how cost multipliers (per farmer, per land unit) are applied to arrive at the final cost, alongside **Income Increase %** and **Payback Period** results.

### Multi-Selector Refinement
The ROI chart supports a **Multi-Selector** allowing users to pick up to 5 specific `Scenario ::: Segment` combinations for side-by-side comparison. If no selection is made, the chart defaults to "All Segments" for all active scenarios.

---

## 4. UI Constraints & Safety (#743)

### Mutual Exclusivity in Component Selection
To ensure data integrity, each ROI cost component (e.g., "Training") can only be selected **once** within a single segment's investment table. If a component is already selected, it is disabled in the dropdown for other rows in that table.

### Segment & Scenario Selector Synchronization
The ROI form includes inline selectors for both **Segments** and **Scenarios** (Radio Groups). These are bidirectionally synchronized with the main application-wide state:
- **Segment Selector**: Synchronized with `activeSegmentId`. Changing the segment via top-level tabs or this selector updates the entire case view.
- **Scenario Selector**: Synchronized with the active scenario tab. This allows users to switch between scenario cost modeling without scrolling back to the top of the page.


---

## 5. Technical Implementation References
*   **State Hook**: `frontend/src/pages/cases/hooks/useScenarioCalculations.js` (SSOT recalculation)
*   **Logical Utility**: `frontend/src/pages/cases/utils/scenarioOutcomeCalculations.js`
*   **ROI Calculations**: `frontend/src/pages/cases/utils/roiCalculations.js`
*   **Visualization**: `frontend/src/pages/cases/visualizations/ImpactOfInvestmentCharts.js`
*   **Form Logic**: `frontend/src/pages/cases/components/ScenarioModelingROIForm.js`

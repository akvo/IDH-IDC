# User Story: STORY-743-8 — ROI Pseudocode Alignment

**Status**: [x] COMPLETED
**Priority**: HIGH
**Agent**: Amelia (Dev) / Winston (Architect)

## 📝 Story Description
As a business analyst, I want the ROI calculations to strictly follow the IDH standard pseudocode so that I can provide deeper investment insights like "Payback Period" and ensure fair cost distribution across farmer segments.

## 🎯 Acceptance Criteria (UAC)
1. [x] **Proportional Distribution**: If investment is entered at the "All Farmers" level, it must be distributed to segments based on `(segment_farmers / total_farmers) * total_cost`.
2. [x] **New Metrics in Utility**: `roiCalculations.js` must return:
    -   `Income Increase (%)`
    -   `Impact of Investment (%)`
    -   `Payback Period (Years)`
3. [x] **UI Visualization**: 
    -   The "Segment Breakdown" table in Step 5 must display these three new metrics.
    -   Metrics should handle edge cases (e.g., 0 improvement = Infinite payback).
4. [x] **Parity**: Calculations verified against the examples in the [Google Doc](https://docs.google.com/document/d/1ZfF4nmGEG4Xtm2rqtY7LnQ7jcT8IEBX6dzKJ48-q72E/edit?tab=t.vv1njewiltfe#heading=h.g6t4peytb1y3).

## 🛠️ Technical Acceptance Criteria (TAC)
- [x] Update `calculateScenarioROI` in `frontend/src/pages/cases/utils/roiCalculations.js` to return the new metrics.
- [x] Ensure `ImpactOfInvestmentCharts.js` correctly renders the additional table columns.
- [x] Implement safety guards for division-by-zero in payback calculations.

## 📅 Timeline & Effort
- **Estimation**: 6 Hours
- **Actual Time**: 6 Hours
- **Phase**: Phase 8: Pseudocode Alignment

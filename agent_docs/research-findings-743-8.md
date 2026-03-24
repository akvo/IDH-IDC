# Research Findings: ROI Pseudocode Alignment Gap Analysis (#743-8)

**Date**: 2026-03-23
**Agent**: Mary 📊 (Analyst)
**Context**: Re-evaluating Step 5 "Impact of Investment" logic against the [updated Google Doc](https://docs.google.com/document/d/1ZfF4nmGEG4Xtm2rqtY7LnQ7jcT8IEBX6dzKJ48-q72E/edit?tab=t.vv1njewiltfe#heading=h.g6t4peytb1y3).

## 📊 Current State vs. Desired State

| Requirement | Current Implementation | Google Doc Pseudocode | Gap / Action |
| :--- | :--- | :--- | :--- |
| **ROI Ratio** | `totalIncomeImprovement / totalCost` | `income_increase / total_cost_segment` | **Aligned** (Identical logic). |
| **Applied Multipliers** | Supported (Farmers, Land) | Fully documented for components | **Aligned**. |
| **Income Increase (%)** | Not implemented | `income_increase / current_income` | **Missing**: Needs to be added to `roiCalculations.js`. |
| **Impact of Investment (%)** | Not implemented | `(income_increase_percentage / total_cost_segment) * 100` | **Missing**: Secondary performance metric. |
| **Payback Period** | Not implemented | `total_cost_segment / income_increase` | **Missing**: Critical for business decision-making. |
| **Cost Distribution** | Simplified summation for case-wide | `(segment_farmers / total_farmers) * total_cost` | **Missing**: Needs proportional allocation for "All Farmers" inputs. |

## 🧩 Calculations Deep Dive

### 1. Proportional Distribution
When an investment is entered at the "All Farmers" (Case-wide) level, the doc requires distributing it to each segment based on their farmer count. 
- **formula**: `Segment Cost = (Segment Farmers / Total Farmers) * Case-Wide Total Cost`
- **Application**: Allows showing "ROI per Segment" even when costs weren't entered per-segment.

### 2. Time-Based Metrics
- **Payback Period**: Represents the number of years required for the income improvement to cover the investment cost.
- **Edge cases**: If `income_increase` is 0 or negative, `payback_period` should be null or "Infinite."

## 🚀 Recommendations
1.  **Backend/Utility**: Update `calculateScenarioROI` to return a `metrics` object per segment.
2.  **Frontend**: 
    - Add "Payback Period" and "Income Increase %" to the **Segment Breakdown** table.
    - Consider adding these as secondary labels in the ROI Chart for depth.

## 🏁 Conclusion
The current implementation captures the "Impact per Dollar" successfully, but lacks the business-centric "efficiency" metrics (Payback, %) requested in the latest spec.

**Handoff**: Passing to **Bob (SM)** for story creation and **John (PM)** for feature doc updates.

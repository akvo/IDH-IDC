# Feature: Impact of Investment (Premium)

## Overview
The "Impact of Investment" feature is designed to help companies evaluate the cost-effectiveness of different income-improvement scenarios. By comparing the net income gain against the cost of implementation, users can identify which strategies provide the highest "impact per dollar."

## Problem Statement
Currently, the IDC allows users to model various scenarios (e.g., price increases, productivity gains) and see their effect on farmer income. However, it does not account for the **cost** to the company to implement these changes. This makes it difficult for decision-makers to choose between strategies that might have similar income outcomes but vastly different costs.

## Proposed Solution
Introduce a new "Impact of Investment" analysis tool within **Step 5 (Scenario Modelling)**.

## Implementation Phases
### Phase 1: Baseline Restoration
Restore `ScenarioModelingIncomeDriversAndChart.js` to Step 5 to ensure chart-driven modeling is fully functional before adding premium features.

### Phase 2: ROI Extension
Implement the inline cost toggle, granular breakdown table, and impact visualizations (ROI charts).

### Phase 5: ROI Design Alignment (#743)
Align the "Impact of Investment" visualizations with Section 3 of the Figma design. Includes zigzag layout (Chart/Text, Text/Chart), scenario cost by component breakdown, and refined ROI percentage visualizations.

> [!NOTE]
> **Scenario-Specific Attachment**: Investment costs and ROI calculations are strictly attached to each **individual scenario**. This allows users to compare the cost-effectiveness of different strategies (e.g., Scenario A vs. Scenario B) within the same case.

### Key Components
20. **Investment Cost Input (Inline Section)**:
   - **Placement**: Nested **within each Segment Tab** of each scenario modelling view (Figma Aligned).
   - **Activation Toggle**: "Toggle if you have an estimate of the cost required to implement the scenarios" (Scenario-level).
   - **Form Interface**: Appears at the bottom of the income driver modeling section for the active segment.
   - **Scenario Component Breakdown**: An expandable section that allows mapping costs to specific intervention areas:
     - **ROI Component**: Dropdown to select from standard options (Training, Capacity Building, etc.).
     - **Unit**: Choice of Total, Per Farmer, or Per Land Unit.
     - **Cost**: The primary input field (renamed from "Current Value").
     - **Multiplier Display**: Dynamic label showing the target quantity (e.g., `x 135 Farmers`).
     - **Total**: Calculated row total (renamed from "Total cost").
   - **Cost Distribution**: If case-wide mode is active (Per-segment toggle OFF), the total investment is automatically distributed proportionately based on the farmer count in each segment.

2. **Impact Calculation**:
   - **Formula**: `Impact of Investment = (Income Increase % / Total Investment Cost) * 100`
   - **Definition**: The percentage point increase in household income achieved for every $1 (or currency unit) invested.
   - **Example**: If income increases by 10% and the investment is $5, the impact score is 2.0 (10/5*100 = 200, wait, `10/5 = 2.0`). The document says `* 100` so it might be `200`. We will stick to the Doc's `(10%/5)*100`.

3. **Visualizations**:
   - **Scenario Efficiency Comparison Chart**: A bar chart comparing the total "Impact" score across all modeled scenarios.
   - **Impact Breakdown Chart**: A chart showing how the impact is distributed across different segments for selected scenarios.
   - **Efficiency Table**: A summary table (within "Better understand scenario outcomes") showing:
     - Scenario/Segment Name
     - Net Income Increase
     - Total Investment Cost
     - ROI (Impact score)

## Brainstorming & UX Considerations
- **Toggle for Premium**: This feature should be gated and only visible/selectable if the "Premium" mode is enabled (or governed by user permissions).
- **Comparison View**: Users should be able to see the impact comparison directly alongside the income breakdown charts they already use in Step 5.
- **Defaulting**: If no cost is entered, the feature should show a placeholder or a prompt to "Add investment cost to see impact analysis."

---

## Architectural Approach Comparison

The user has noted that Step 5 currently follows a **Frontend-Heavy** standard where calculations happen in React and results are saved into a JSONB `config` field in the `visualization` table. Below is a comparison of sticking to that standard vs. adding more Backend support for this premium feature.

### Option A: Sticking to Current Standard (Frontend-Heavy)
*   **Logic**: All "Impact per $" calculations happen in the browser.
*   **Persistence**: Costs are saved inside the `config` JSON blob.
*   **Pros**:
    *   **Consistency**: Follows the existing pattern of Step 5 / Advanced Modelling Tool.
    *   **Development Speed**: Very fast to implement; zero backend logic changes.
    *   **Agility**: Easy to change the formula or add new cost fields without migrating the database.
*   **Cons**:
    *   **No Validation**: The backend doesn't "know" what's inside the JSON, so it can't prevent users from saving broken data.
    *   **Locked Data**: Hard to generate a summary report across multiple cases (e.g., "Show me the average impact of investment across all Kenyan cases") via SQL.

### Option B: Backend-Supported (My Initial Suggestion)
*   **Logic**: Formulas are defined in Python; Frontend calls the backend or shares the logic.
*   **Persistence**: Costs are validated by Pydantic before being saved to the JSONB blob.
*   **Pros**:
    *   **Data Integrity**: Prevents corrupted or malicious data from being saved.
    *   **Reusable**: The backend can reuse the same logic for PDF reports, CSV exports, or future "Portfolio" level views.
    *   **Security**: Gating a "Premium" feature is more secure when the backend enforces it during save/load.
*   **Cons**:
    *   **Inconsistency**: Differs from how other Step 5 variables are currently handled, which might confuse future developers.
    *   **Slower**: Requires more "plumbing" code (Pydantic models, unit tests in both stacks).

---

## Recommendation & Decision
We will follow **Option A (Frontend-Heavy)** to preserve real-time calculation performance, but with a **Strict JSON Schema Agreement**. This ensures logical consistency across scenarios and makes the data easily readable by the backend for future PDF/CSV generation.

> [!IMPORTANT]
> **Backward Compatibility**: The `investment_analysis` key will be added as a **sibling** to existing keys like `scenarioData` and `advancedModeling`. This ensures that existing Step 5 configurations remain fully functional. See the [Visualization Config Schemas](file:///Users/galihpratama/Sites/IDH-IDC/agent_docs/features/visualization-config-schema.md) guide for details.

### Proposed JSON Schema
This object will be stored within the `config` field of a `Visualization` record (Tab: `scenario_modeling`).

```json
{
  "investment_analysis": {
    "is_enabled": boolean,
    "scenarios": {
      "scenario_id_1": {
        "investment_cost": number,
        "cost_unit": "total" | "per_farmer" | "per_land_unit" | "per_component",
        "components": [
          { "name": string, "cost": number, "unit": string }
        ],
        "total_cost_calculated": number,
        "impact_score": number
      }
    },
    "metadata": {
      "currency": "USD",
      "last_updated": "ISO-TIMESTAMP"
    }
  }
}
```

---

## Detailed Technical Breakdown

### Backend Tasks (Mary/Winston/Amelia)
- **Pydantic Validation**:
    - Update the `Visualization` config schema to validate the `investment_analysis` key using a nested Pydantic model. This ensures data integrity without duplicating logic.
- **Premium Permission Gate**:
    - Update the `visualization` POST route to check if the user has `is_premium` status before allowing the `investment_analysis` key to be saved.

### Frontend Tasks (Sally/Amelia)
- **Real-time Calculation Logic**:
    - Implement the `Impact per $` formula directly in the `AdvancedModellingTool` or a shared hook.
- **UI Components**:
    - **Step 5 Integration**: Restore and extend the existing `ScenarioModelingIncomeDriversAndChart.js`. **Existing charts (Income Breakdown, etc.) are already developed and must be preserved.**
    - **Investment Toggle & Form**: A new inline section added *below* the existing scenario input fields.
    - **Component Breakdown Table**: An expandable table for granular cost mapping (Scenario Component, Cost Type, Value, Total).
    - **Impact Charts**:
        - `ChartScenarioEfficiency`: Bar chart for scenario-level impact.
        - `ChartImpactBreakdown`: Segment-level breakdown of impact.
    - **Efficiency Table**: Integrated into the segment outcome table with "ROI (Impact score)".
- **State management**:
    - Persist the input values in the local `ScenarioModel` and sync them to the backend only on save.

---

## Revised Estimation (Optimistic - Grouped by Phase)

| BMAD Phase | Tasks | Effort (Hours) | Agent |
|------------|-------|----------------|-------|
| **Phase 4: Design** | Interaction patterns, UI specs, & Chart mocks | 4 | Sally (UX) |
| **Phase 5: Plan** | Story decomposition & technical task mapping | 2 | Bob (SM) |
| **Phase 6: Implement** | **Backend**: Schema validation & Permission gate (4h)<br>**Frontend**: UI, ROI Calculation, Charts & Table (14h) | 18 | Winston/Amelia |
| **Phase 7: Test** | Integrated E2E Testing, Safety Audit & QA Guide | 6 | Murat (Tester) |
| **Phase 8: Document**| User Guide & Technical Documentation refinement | 2 | Paige (Writer) |
| **Total** | | **32 Hours** | |

> [!TIP]
> **T-Shirt Size**: Small (S)
> **Timeline**: ~4-5 Days (assuming focused development).

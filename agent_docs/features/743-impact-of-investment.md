# Feature: Impact of Investment (Premium)

## Overview
The "Impact of Investment" feature is designed to help companies evaluate the cost-effectiveness of different income-improvement scenarios. By comparing the net income gain against the cost of implementation, users can identify which strategies provide the highest "impact per dollar."

## Problem Statement
Currently, the IDC allows users to model various scenarios (e.g., price increases, productivity gains) and see their effect on farmer income. However, it does not account for the **cost** to the company to implement these changes. This makes it difficult for decision-makers to choose between strategies that might have similar income outcomes but vastly different costs.

## Proposed Solution
Introduce a new "Impact of Investment" analysis tool within **Step 5 (Scenario Modelling)**.

### Key Components
1. **Investment Cost Input (Inline Section)**:
   - **Activation Toggle**: "Toggle if you have an estimate of the cost required to implement the scenarios".
   - **Global Input**: A "Total Cost" field with a unit selector (Total, Per Farmer, Per Land Unit).
   - **Scenario Component Breakdown**: An expandable section (triggered by a down arrow near "Total Cost") that allows mapping costs to specific scenario components:
     - **Scenario component**: Dropdown to select the driver/component.
     - **Cost type**: Inherits global unit or allows override.
     - **Current Value**: Reference value (e.g., number of farmers).
     - **Total cost**: Calculated row total.
   - **Cost Distribution**: If a total cost is provided for a case with multiple segments, the cost is automatically distributed proportionately based on the farmer count in each segment.

2. **Impact Calculation**:
   - **Step 1: Income Increase %**:
     - `income_increase_percentage = (income_increase) / (current_income)`
     - *Note*: `income_increase` is the absolute net gain from the Step 5 scenario outcomes table.
   - **Step 2: Impact of Investment (ROI)**:
     - `impact_of_investment = (income_increase_percentage / total_cost_segment) * 100`
     - *Interpretation*: The percentage point increase in household income achieved for every 100 units of currency invested.

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
    - **Step 5 Integration**: Extend the existing `ScenarioModelingIncomeDriversAndChart.js`. **Existing charts (Income Breakdown, etc.) are already developed and must be preserved.**
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

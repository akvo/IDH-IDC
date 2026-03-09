# Feature: Impact of Investment (Premium)

## Overview
The "Impact of Investment" feature is designed to help companies evaluate the cost-effectiveness of different income-improvement scenarios. By comparing the net income gain against the cost of implementation, users can identify which strategies provide the highest "impact per dollar."

## Problem Statement
Currently, the IDC allows users to model various scenarios (e.g., price increases, productivity gains) and see their effect on farmer income. However, it does not account for the **cost** to the company to implement these changes. This makes it difficult for decision-makers to choose between strategies that might have similar income outcomes but vastly different costs.

## Proposed Solution
Introduce a new "Impact of Investment" analysis tool within **Step 5 (Scenario Modelling)**.

### Key Components
1. **Investment Cost Input**:
   - Allow users to input costs for each scenario.
   - Support multiple cost units:
     - **Total Cost**: Flat fee for the entire project or specific segment.
     - **Cost Per Farmer**: Variable cost based on the number of participants.
     - **Cost Per Land Unit**: Variable cost based on the total area (e.g., acres/hectares) in the scenario.
   - **Cost Distribution**: If a total cost is provided for a case with multiple segments, the cost is automatically distributed proportionately based on the farmer count in each segment.

2. **Impact Calculation**:
   - **Main Formula**: `Impact per $ = (Net Income Increase) / (Total Investment Cost)`
   - **Percentage Impact**: `(Income Increase %) / (Total Investment Cost) * 100`

3. **Visualizations**:
   - **Impact Comparison Chart**: A bar chart comparing "Impact per $" across all modeled scenarios.
   - **Efficiency Table**: A summary table showing:
     - Scenario Name
     - Total Net Income Increase
     - Total Investment Cost
     - Impact per $

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
        "cost_unit": "total" | "per_farmer" | "per_land_unit",
        "distribution": "proportionate" | "manual",
        "manual_allocations": {
          "segment_id_A": number,
          "segment_id_B": number
        }
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
    - **Investment Cost Form**: A new modal in Step 5 for inputting costs per scenario.
    - **Impact Charts**: A bar chart visualization showing efficiency (Impact/$) across scenarios.
    - **Efficiency Table**: A summary table comparing Scenario, Total Gain, Total Cost, and ROI.
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

# Research Findings: Scenario-Segment Multi-Selector (#743)

## Objective
Align the "Scenario Cost by component" and "ROI" charts in Step 5 with the interaction pattern used in "Income gap across scenario" (Step 3/5). This replaces individual Scenario/Segment dropdowns with a single multi-select for specific combinations.

## Requirements Analysis
1.  **Multi-Selection State**:
    *   State: `selectedScenarioSegments` (string array).
    *   Value Format: `${scenarioKey}-${segmentId}` (e.g., `scenario1-2`).
    *   Default: Initialized with the first valid scenario and segment or a saved state.
    *   Limit: Maximum 5 selections to maintain chart readability.

2.  **Data mapping Refinement**:
    *   `roiData` must be calculated by iterating over `selectedScenarioSegments`.
    *   For each selection, find the corresponding `allScenariosRoiData` entry.
    *   If it's a specific segment, extract `segmentMetrics` and `segmentComponentBreakdowns`.
    *   If "All Segments" is selected (if we still support it), use the aggregate scenario data.

3.  **Visual Alignment**:
    *   **Labels**: X-axis labels should be `[Scenario Name] - [Segment Name]`.
    *   **Colors**: Use the `scenarioColors` palette based on the selection index.
    *   **Chart Types**: Continue using `COLUMN-BAR` for cost and standard Bar for ROI.

4.  **UI Components**:
    *   Use `Select` from `antd` with `mode="multiple"`.
    *   Integrate `selectProps` for consistent styling.
    *   Place the selector prominently in the description column (right side).

## Technical Constraints
*   **Dynamic Components**: The "Scenario Cost by component" chart must continue to handle dynamic sets of components (e.g., Scenario A has "Training", Scenario B has "Input Provision"). The current `useMemo` logic for `componentCostChartData` already supports this by aggregating unique keys.
*   **Table Interaction**: The "Segment Cost Breakdown" table (Phase 7) should either:
    *   Show data for the first selection in the list.
    *   Only show when a single selection is active?
    *   **Decision**: For now, default to the first selection or show a message if multiple are selected? Actually, the user asked for "combination of segments and scenarios to view AS IN THE OTHER GRAPH". The other graph (Income gap) doesn't have a linked breakdown table. I will keep the table for the first selection or hide it if it becomes confusing.

## Next Steps
- [ ] Transition to Phase 3: Architect (Design state and props).
- [ ] Transition to Phase 4: Design (Mock UI layout).
- [ ] Transition to Phase 5: Plan (Create stories).

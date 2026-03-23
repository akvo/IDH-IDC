# UX Design Specification: Step 5 Multi-Selector (#743)

## Overview
Align the "Impact of Investment" charts with the multi-selection pattern established in Step 3/5's "Income gap across scenario" visualization. This enables granular comparison of specific Strategic Scenarios against diverse Farmer Segments.

## User Persona
- **Strategic Decision Maker**: Needs to compare "Scenario A for Smallholders" directly against "Scenario B for Largeholders" to evaluate cost-effectiveness and ROI across diverse interventions.

## Layout & Components
1. **The Multi-Selector**:
   - **Type**: `Ant Design` Select with `mode="multiple"`.
   - **Placement**: Located in the right-side information column (`Space` container) for both the "Scenario Cost by component" and "ROI" charts.
   - **Labeling**: The redundant "View data for:" text is removed to save vertical space; the `Placeholder` text will guide the user.
   - **Options**: `[Scenario Name] - [Segment Name]`.

2. **Visual Feedback (Charts)**:
   - **X-Axis Labels**: Should consistently use the `[Scenario Name] - [Segment Name]` format.
   - **Coloring**: Multi-selection bars will use the `scenarioColors` palette based on the order of selection.
   - **Grouped Bars**: The "Scenario Cost by component" chart remains a grouped bar chart; each group on the X-axis represents a selection pair.

3. **Breakdown Table Integration**:
   - **Contextual View**: The "Segment Cost Breakdown" table below the charts will visualize the granular multiplier breakdown for the **first selection** in the active list.
   - **Indicator**: A small header or `Tag` above the table: "Showing detailed breakdown for: [Scenario-Segment Name]".

## Error Handling & Limits
- **Selection Limit**: Max 5 items (consistent with Step 3).
- **Empty State**: Charts and tables should show a clear placeholder or empty state if no combinations are selected.
- **Placeholder Text**: "Select combinations of Scenarios and Segments to compare".

## Interaction Flow
1. User enters Step 5.
2. By default, the first Scenario - First Segment (or "All Segments") is selected.
3. User adds more combinations from the dropdown.
4. Charts update in real-time to show side-by-side bars for each combination.
5. The Breakdown table remains pinned to the first selection but can be updated by re-ordering or changing the selection set.

# UX Design Specification: Step 5 Multi-Selector (#743)

## Overview
Align the "Impact of Investment" charts with the multi-selection pattern established in Step 3/5's "Income gap across scenario" visualization. This enables granular comparison of specific Strategic Scenarios against diverse Farmer Segments.

## User Persona
- **Strategic Decision Maker**: Needs to compare "Scenario A for Smallholders" directly against "Scenario B for Largeholders" to evaluate cost-effectiveness and ROI across diverse interventions.

## Layout & Components
1. **The Selectors**:
   - **Cost Chart**: `Ant Design` Select with `mode="multiple"` for side-by-side comparison of up to 5 Scenario-Segment pairs.
   - **ROI Chart**: Single-select dropdown to view all modelled scenarios for one specific farmer segment.
   - **Cost Allocation Mode**: `Ant Design` Radio group with options:
     - **No**: ROI analysis is disabled.
     - **Yes, for all farmers**: Shared cost input for the whole scenario.
     - **Yes, per segment**: Isolated cost input per segment.
   - **Placement**: Located in the information column for both charts; Allocation mode is in the modelling sidebar.

2. **Visual Feedback (Charts & Forms)**:
   - **X-Axis Labels**: Should consistently use the `[Scenario Name] - [Segment Name]` format.
   - **Coloring**: Multi-selection bars will use the `scenarioColors` palette.
   - **Form Persistence**: In "For all farmers" mode, input values remain visible and editable when switching between segment tabs.
   - **Synchronization**: The Step 3 segment tabs and the ROI-specific segment selector are bidirectional.

3. **Breakdown Table Integration**:
   - **Contextual View**: Visualizes the granular multiplier breakdown for the **first selection**.
   - **Indicator**: A small header or `Tag` above the table: "Showing detailed breakdown for: [Scenario-Segment Name]".
   - **Proportional Note**: If in "For all farmers" mode, the table displays the calculated proportional share for the active segment.

## Error Handling & Limits
- **Selection Limit**: Max 5 items (consistent with Step 3).
- **Empty State**: Charts and tables should show a clear placeholder or empty state if no combinations are selected.
- **Placeholder Text**: "Select combinations of Scenarios and Segments to compare".

## Interaction Flow
1. User enters Step 5.
2. User selects "Yes, for all farmers" or "Yes, per segment" for ROI.
3. In "For all farmers" mode, user inputs a total cost; this value persists across segment tabs.
4. Charts and tables update in real-time to show side-by-side bars and proportional breakdowns.
5. Changing the segment in the ROI chart multi-select synchronizes with the Step 3 tabs.

# Story #743-13: ROI Cost Allocation Mode Selector

## Description
As a user, I want to choose whether my scenario costs apply to all farmers or specific segments, so that I can accurately model interventions based on my available data.

## User Acceptance Criteria (UAC)
1.  **UI Element**: A Radio button group ("No", "Yes, for all farmers", "Yes, per segment") replaces the current ROI toggle.
2.  **Mode: "No"**: ROI fields are hidden; `is_roi_enabled` is set to `false`.
3.  **Mode: "Yes, for all farmers"**: 
    - Cost inputs are visible and shared across segments.
    - Input values persist when switching between segment tabs.
    - `is_roi_enabled` is `true`.
4.  **Mode: "Yes, per segment"**:
    - Cost inputs are visible and isolated for each segment.
    - `is_roi_enabled` is `true`.
5.  **Persistence**: The selected mode is saved in `visualization.config.scenarioModeling.config.investment_analysis.scenarios[scenarioKey].cost_allocation_mode`.

## Technical Acceptance Criteria (TAC)
1. Update `ScenarioModelingROIForm.js` to render `Radio.Group`.
2. Update state update logic to handle `all_farmers_config` in the store.
3. Ensure backward compatibility: if `cost_allocation_mode` is missing, default to `per_segment` if `is_roi_enabled` is true, otherwise `no`.

---

# Story #743-14: Proportional ROI Calculations

## Description
As a system, I want to proportionally distribute total scenario costs across segments based on farmer ratio, so that ROI percentages are correctly calculated for individual segments.

## User Acceptance Criteria (UAC)
1.  **Calculation Accuracy**: In "All Farmers" mode, a $10,000 total cost for a case with 70/30 farmer split results in $7,000 and $3,000 segment allocations respectively.
2.  **Visualization Integration**: ROI charts and Cost breakdowns reflect these proportional values.
3.  **Multiplier Consistency**: "Per Farmer" units in "All Farmers" mode correctly use the segment-specific farmer count for the final allocation.

## Technical Acceptance Criteria (TAC)
1. Update `roiCalculations.js` -> `calculateScenarioROI` to implement the proportional distribution logic.
2. Add unit tests in `roiCalculations.test.js` covering both modes and all unit types (total, per farmer, per land).

---

# Story #743-15: Segment Selector Synchronization

## Description
As a user, I want the ROI chart segment selector to stay in sync with my main case tabs, so I don't lose context while analyzing different groups.

## User Acceptance Criteria (UAC)
1.  **Bidirectional Sync**: Changing the segment in the ROI chart dropdown updates the active tab in Step 3.
2.  **Bidirectional Sync**: Changing the active tab in Step 3 updates the ROI chart's selected segment.

## Technical Acceptance Criteria (TAC)
1. Update `ImpactOfInvestmentCharts.js` to link the local segment selection state with the global `activeSegmentId` (or equivalent in `CaseVisualState`).
2. Ensure the Cost Chart (multi-select) also reflects the current segment if applicable.

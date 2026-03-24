# Feature: #743 Proportional Scenario Cost Allocation (ROI)

## Overview
This feature enhances the "Impact of Investment" (ROI) tool by allowing users to input scenario costs either for the **entire case (All Farmers)** or **per farmer segment**. When costs are provided for "All Farmers," the system automatically allocates them proportionally to each segment based on the number of farmers in that segment.

## User Context
Companies often have cost information attached to a whole scenario rather than granularly per segment. They need a way to input this total cost once and see it reflected across all segments.

## Requirements

### 1. Cost Allocation Mode Selector
- **New UI Element**: A radio button group replacing the current "On/Off" toggle with three options:
    - **"No"**: Disables ROI analysis for this scenario (replaces the current "Off" state).
    - **"Yes, for all farmers"**: Single cost input for the entire scenario.
    - **"Yes, per segment"**: Granular cost input for each specific segment.
- **Default State**: "Yes, per segment" if data exists, otherwise "No" (to align with the current Off behavior).

### 2. "For All Farmers" Behavior
- **Input Persistence**: When "Yes, for all farmers" is selected, the cost input fields (Scenario Component, Cost Type, Value) are shared across all segments.
- **Navigational Behavior**: Changing segments via the top tabs or ROI segment selector does **not** clear the cost inputs. The same "Total Cost" values remain visible and editable.
- **Calculation Logic**:
    - `Segment Cost = Total Scenario Cost * (Farmers in Segment / Total Farmers in Case)`
    - This calculation must be applied to all ROI metrics (Return on Investment %, Payback Period, etc.).
- **Proportional Weighting**: Total farmers in the case is the sum of farmers across all defined segments.

### 3. "Per Segment" Behavior
- **Input Isolation**: Cost inputs are unique to each segment.
- **Navigational Behavior**: Switching segments clears or updates the input fields to reflect the data for the newly selected segment.
- **Context Display**: A segment label is displayed next to the cost input to clarify which segment is being edited.

### 4. UI Synchronization
- **Linked Selectors**: The top-level segment tabs and the ROI-specific segment selector (implemented in Phase 16) must be synchronized. Changing one should update the other to ensure the user always knows which segment's data they are looking at.

## Acceptance Criteria
- [ ] Users can toggle between "All Farmers" and "Per Segment" modes.
- [ ] In "All Farmers" mode, entering a total cost of $10,000 correctly calculates $7,000 for a segment with 70% of farmers and $3,000 for a segment with 30%.
- [ ] In "All Farmers" mode, the input value persists when switching segments.
- [ ] In "Per Segment" mode, inputs are isolated and reset correctly when switching.
- [ ] The ROI segment selector stays in sync with the main case segment tabs.
- [ ] All charts (ROI %, Investment vs Income) reflect the proportional allocation.

## Technical Notes
- **Frontend State**: Need a new flag `costAllocationMode` (e.g., `'all'` | `'segment'`) in the visualization config.
- **Calculations**: Update `roiCalculations.js` to handle the `all` mode by fetching total farmers and applying the multiplier.
- **Synchronization**: Use a shared `activeSegment` state or effect-based synchronization between components.

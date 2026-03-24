# Feature: ROI Component Selection Restriction (#743)

## Overview
In the "Scenario Cost by component" table (Step 5 ROI), users can currently select the same component (e.g., "Training") multiple times across different rows. This leads to redundant data entry and potential confusion in the "Scenario Cost by component" chart.

## Problem Statement
When modeling investments, each cost component should represent a unique intervention category. Allowing duplicates in the dropdown selection for "Scenario component" can lead to:
1. Fragmented data for the same category in visualizations.
2. User error where multiple rows are added for the same component instead of updating a single row.

## Proposed Solution
Implement a "Unique Selection" constraint on the ROI component dropdown. If a component is already selected in one row of the investment table, it should be disabled or hidden from the dropdown options in all other rows of the same table.

## Requirements
- **Mutual Exclusivity**: A value selected in `ScenarioModelingROIForm.js` for component `n` must not be selectable for component `m` (where $n \neq m$).
- **Dynamic Updates**: As soon as a user selects a value or deletes a row, the available options in all other rows must update in real-time.
- **Initialization**: Existing saved data should be respected, but if duplicates exist (legacy data), the UI should still prevent any *new* duplicate selections.

## Acceptance Criteria
- [ ] Selecting "Training" in Row 1 makes "Training" unavailable in Row 2's dropdown.
- [ ] Deleting Row 1 (which had "Training") makes "Training" available again for all other rows.
- [ ] Changing Row 1 from "Training" to "Financing" makes "Training" available and "Financing" unavailable for other rows.
- [ ] The "Other" option should potentially follow the same rule (one "Other" per table) or remain always available if the user needs multiple custom items (to be clarified in Phase 2).

## Stakeholders
- **PM**: John (Ideation)
- **UX**: Sally (Interaction pattern)
- **Dev**: Amelia (Implementation)
- **Tester**: Murat (Verification)

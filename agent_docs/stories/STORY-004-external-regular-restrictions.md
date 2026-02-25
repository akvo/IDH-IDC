# STORY-004: Apply External (Regular) Feature Restrictions

## Overview
As a product manager, I want to restrict access to specific advanced features for "External (Regular)" users, so that they are presented with a simplified experience and cannot modify complex scenario models or upload bulk data.

## Context
Following the split of external users into "Regular" and "Advanced" (STORY-002, STORY-003), specific platform restrictions must be applied to the default "External (Regular)" role. This limits their access to advanced features while maintaining the core functionality.

## Acceptance Criteria (UAC)
1. **Spreadsheet Upload Hidden**:
   - GIVEN an External (Regular) user is creating or editing a case
   - THEN the "Upload Spreadsheet" mechanism is completely hidden from the UI.
2. **Optimisation Chart Read-Only**:
   - GIVEN an External (Regular) user is viewing Step 4
   - WHEN they interact with the Optimization algorithm chart ("What is the minimum change in drivers needed...")
   - THEN all input fields (driver selector, percentages) and action buttons ("Run the model", "Clear results") are disabled. They can view existing optimization results but cannot run new models.
3. **Advanced Modelling Tool Read-Only**:
   - GIVEN an External (Regular) user is viewing Step 5 (Closing Gap)
   - WHEN they interact with the Advanced Modelling Tool
   - THEN all input fields, dropdowns, and the "Calculate" or interactive modeling buttons are disabled. They can view existing calculations but cannot modify inputs or select different drivers.

## Technical Acceptance Criteria (TAC)
- [x] Implement centralized granular flags in `CaseUIState` (`enableAdvancedTools`, `enableDataUpload`).
- [x] Calculate flags in `Case.js`: `true` for Admin/Internal/External Advanced, `false` for External Regular.
- [x] In `CaseForm.js`, conditionally render the `Data upload` tab and "Download template" button based on `enableDataUpload`.
- [x] In `AssessImpactMitigationStrategies.js` (Step 4), apply `disabled={!enableAdvancedTools}` to sub-components.
- [x] In `ClosingGap.js` (Step 5), apply `disabled={!enableAdvancedTools}` to the `AdvancedModellingTool` and "Mark as complete" button.
- [x] **Browsing Accessibility**: Ensure `SegmentSelector` remains ENABLED within restricted tools to allow cross-segment data viewing.
- [ ] **Backend Upload Restriction**: In `backend/routes/case_import.py`, add a check for `user.user_type`. If `external_regular`, return `403 Forbidden`. [DEFERRED]
- [ ] **Test Case**: Add a test in `backend/tests/test_1005_case_import.py` to verify that an `external_regular` user receive a 403 when attempting to upload a case spreadsheet. [DEFERRED]

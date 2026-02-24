# Feature: External (Regular) Restrictions

## Overview
Following the splitting of external users into "Regular" and "Advanced", this feature defines the specific platform restrictions applied to the default "External (Regular)" user type. The goal is to hide complex or sensitive tools from standard external partners.

## Requirements
For users with `role == "user"` and `user_type == "external_regular"`, the following restrictions apply:
1. **Data spreadsheet upload**: Hidden. The ability to upload custom data cases via spreadsheet should be completely removed from the UI.
2. **Optimisation algorithm chart**: View Only. The interactive elements (driver selection, percentage inputs, run buttons) for the optimization chart in Step 4 should be disabled. Users can view any pre-calculated optimization results.
3. **Advanced Modelling Tool (Impact of Investment)**: View Only. The interactive elements (inputs, selects, calculate buttons) within the modeling tool in Step 5 should be disabled, allowing the user to only view existing static calculations.

## User Journeys
1. **Regular User Setup**: An External (Regular) user logs in and attempts to create a new case. They should only see standard manual entry or basic options, not the data upload tool.
2. **Regular User Analysis**: While viewing an existing case, the user navigates through the analysis steps. They should not see the Optimisation Algorithm chart or the Impact of Investment features, ensuring they focus only on core metrics.

## Functional Specs
- [MOD] Define feature-flagging or role-checking utility in the frontend to detect `external_regular`.
- [MOD] `CaseForm.js`: Hide "Upload Spreadsheet" button/drag-and-drop mechanism.
- [MOD] `OptimizeIncomeTarget.js` (Step 4): Pass a disabled prop based on user type to disable all form inputs, dropdowns, and run/clear buttons.
- [MOD] `AdvancedModellingTool.js`: Pass a `readOnly` or `disabled` prop based on user type to disable all form inputs, dropdowns, and interactive modeling tabs.

## Non-Functional Specs
- **Security**: The backend should ideally also block the upload endpoint for these users to prevent API-level circumvention.
- **Maintainability**: The feature toggles should be implemented using existing UserState properties to avoid prop-drilling or large component refactors.
- **UX**: The UI should gracefully hide these elements, not just disable them, to reduce visual noise.

## Effort Estimation
- **Data Spreadsheet Upload (CaseForm.js)**: ~1 hour (Component logic and testing)
- **Optimisation Chart (OptimizeIncomeTarget.js)**: ~1.5 hours (Disabling inputs, buttons, and visual verification)
- **Advanced Modelling Tool (AdvancedModellingTool.js)**: ~2.5 hours (Deeply nested inputs, tracking locks, select dropdowns, and ensuring calculations remain visible)
- **Total Estimated Effort**: ~5 hours (0.5 to 1 Sprint Day)

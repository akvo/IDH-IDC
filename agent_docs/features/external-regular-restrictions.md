# Feature: External (Regular) Restrictions

## Overview
Following the splitting of external users into "Regular" and "Advanced", this feature defines the specific platform restrictions applied to the default "External (Regular)" user type. The goal is to hide complex or sensitive tools from standard external partners.

## Requirements
For all users with `role == "user"` and `user_type.startsWith("external")` (currently unifying Regular and Advanced), the following restrictions apply via centralized `CaseUIState` granular flags:

1. **`enableDataUpload`**: Set to `false`.
    - **Data spreadsheet upload**: Hidden (`CaseForm.js`).
    - **Download Template button**: Hidden (`CaseForm.js`).
2. **`enableAdvancedTools`**: Set to `false`.
    - **Optimisation algorithm chart**: View Only. Interactive elements (driver selection, inputs, buttons) in Step 4 are disabled.
    - **Advanced Modelling Tool**: View Only. Inputs, selectors, and buttons in Step 5 are disabled.
    - **Browsing Alignment**: The `SegmentSelector` remains ENABLED in all analysis tools to allow browsing results across segments without editing privileges.

## Functional Specs
- [MOD] `CaseUIState`: Add `enableAdvancedTools` and `enableDataUpload` flags.
- [MOD] `Case.js`: Centralize flag calculation based on `isAdmin`, `isInternal`, and `userType`.
- [MOD] `CaseForm.js`: Hide "Data upload" tab and "Download template" button based on `enableDataUpload`.
- [MOD] `OptimizeIncomeTarget.js` (Step 4): Pass a `disabled` prop based on `enableAdvancedTools`.
- [MOD] `AdvancedModellingTool.js` (Step 5): Pass a `disabled` prop based on `enableAdvancedTools`.
- [MOD] `AdjustIncomeTarget.js`: Disable the modal save button based on `enableAdvancedTools`.

## Non-Functional Specs
- **Security**: The backend should ideally also block the upload endpoint for these users to prevent API-level circumvention.
- **Maintainability**: The feature toggles should be implemented using existing UserState properties to avoid prop-drilling or large component refactors.
- **UX**: The UI should gracefully hide these elements, not just disable them, to reduce visual noise.

## Effort Estimation
- **Data Spreadsheet Upload (CaseForm.js)**: ~1 hour (Component logic and testing)
- **Optimisation Chart (OptimizeIncomeTarget.js)**: ~1.5 hours (Disabling inputs, buttons, and visual verification)
- **Advanced Modelling Tool (AdvancedModellingTool.js)**: ~2.5 hours (Deeply nested inputs, tracking locks, select dropdowns, and ensuring calculations remain visible)
- **Total Estimated Effort**: ~5 hours (0.5 to 1 Sprint Day)

# Feature: External (Regular) Restrictions

## Overview
Following the splitting of external users into "Regular" and "Advanced", this feature defines the specific platform restrictions applied to the default "External (Regular)" user type. The goal is to hide complex or sensitive tools from standard external partners.

## Requirements
The following centralized `CaseUIState` granular flags are used to restrict specific user types:

1. **`external_regular`**:
    - **`enableEditCase`**: `false` by default for cases they don't own (standard behavior).
    - **`enableDataUpload`**: `false` (Hidden).
    - **`enableAdvancedTools`**: `false` (View Only).
2. **`external_advanced`**:
    - **`enableEditCase`**: `true` (Full Edit Rights for owned cases/new cases, similar to Internal).
    - **`enableDataUpload`**: `true` (Full Access).
    - **`enableAdvancedTools`**: `true` (Full Access).
    - **Visibility**: Strictly siloed to their **Company** data (no Organisation-wide access).
3. **Browsing Alignment**: The `SegmentSelector` remains ENABLED in all analysis tools even for restricted users to allow browsing results across segments.

## Functional Specs
- [MOD] `CaseUIState`: Add `enableAdvancedTools` and `enableDataUpload` flags.
- [MOD] `Case.js`: Centralize flag calculation based on `isAdmin`, `isInternal`, and `userType`.
- [MOD] `CaseForm.js`: Hide "Data upload" tab and "Download template" button based on `enableDataUpload`.
- [MOD] `OptimizeIncomeTarget.js` (Step 4): Pass a `disabled` prop based on `enableAdvancedTools`.
- [MOD] `AdvancedModellingTool.js` (Step 5): Pass a `disabled` prop based on `enableAdvancedTools`.
- [MOD] `AdjustIncomeTarget.js`: Disable the modal save button based on `enableAdvancedTools`.

## Non-Functional Specs
- **Security**: The backend enforces restrictions via `verify_case_creator` in `middleware.py`, ensuring `external_regular` users cannot bypass UI gates via direct API calls to creation/import endpoints.
- **Maintainability**: The feature toggles are implemented using centralized `CaseUIState` properties derived from `UserState`.
- **UX**: UI interaction is cleanly gated (hidden or disabled) based on granular feature flags.

## Effort Estimation
- **Data Spreadsheet Upload (CaseForm.js)**: ~1 hour (Component logic and testing)
- **Optimisation Chart (OptimizeIncomeTarget.js)**: ~1.5 hours (Disabling inputs, buttons, and visual verification)
- **Advanced Modelling Tool (AdvancedModellingTool.js)**: ~2.5 hours (Deeply nested inputs, tracking locks, select dropdowns, and ensuring calculations remain visible)
- **Total Estimated Effort**: ~5 hours (0.5 to 1 Sprint Day)

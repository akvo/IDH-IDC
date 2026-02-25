# Feature: Permission Logic Refinement in Case.js

## Overview
The current permission flags in `Case.js` (`enableAdvancedTools`, `enableDataUpload`, `enableImpactOfInvestment`) are primarily based on `userType` and `isAdmin`/`isInternal` status, but they do NOT fully respect the granular `userPermission` (Viewer vs Editor) assigned to a specific case. This can lead to situations where a "Viewer" sees interactive UI elements or tabs that should be restricted.

## Requirements
Refactor the permission flags in `Case.js` to ensure they respect the `enableEditCase` logic where appropriate.

### 1. Unified Visibility & Authority
Interactivity for all advanced features strictly depend on `editAllowed`. Visibility rules:
- **`enableAdvancedTools` & `enableImpactOfInvestment`**: Always **VISIBLE** for all user types.
- **`enableDataUpload`**: **VISIBLE** only for advanced user types (Admin, Internal, Ext Adv) with **Edit Rights**. **HIDDEN** for all others.

### 2. Proposed Logic Refactor

```javascript
const editAllowed = checkEnableEditCase();
const isAdvancedUser = isAdmin || isInternal || userType === 'external_advanced';

// Flags in CaseUIState
const enableAdvancedTools = true; // Always visible
const enableDataUpload = editAllowed && isAdvancedUser; // Restricted
const enableImpactOfInvestment = true;
```

## Functional Specs
- [MOD] `Case.js`: Set `enableAdvancedTools` and `enableImpactOfInvestment` to `true` (visibility gate).
- [MOD] `AssessImpactMitigationStrategies.js`: Re-implement `!isExternalRegular` check to explicitly hide `OptimizeIncomeTarget` for all Ext Reg.

## Verification Results

### Logic Alignment
The following table summarizes the updated permission model:

| User Type | Case Permission | Edit Rights | Advanced Tools | Data Upload |
|-----------|-----------------|-------------|----------------|-------------|
| Admin | N/A | Yes | Yes | Yes |
| Internal | Editor | Yes | Yes | Yes |
| Internal | Viewer | **No** | **Disabled (Visible)** | **No** (Hidden) |
| Ext Adv | Editor | Yes | Yes | Yes |
| Ext Adv | Viewer | **No** | **Disabled (Visible)** | **No** (Hidden) |
| Ext Reg | Editor | **Yes** | **Yes** (Except Opt. Chart) | **No** (Hidden) |
| Ext Reg | Viewer | **No** | **Disabled (Visible)** (Except Opt. Chart) | **No** (Hidden) |

## Implementation Details: Robustness & Stability

### 1. Zero-Crash Data Handling
Added robust type checking in `checkEnableEditCase` to prevent the `toLowerCase` runtime error:
- Uses `typeof === 'string'` guards before calling string methods.
- Coerces `created_by` to `String` where appropriate.
- Implements optional chaining (`?.`) for nested user state properties like `case_access`.

### 2. Guarding Ownership
The owner check now includes both email and user ID comparison to handle variations in how user identity is stored:
```javascript
const isOwner = currentCaseCreatedBy?.toLowerCase() === userState?.email?.toLowerCase() ||
                currentCaseCreatedBy === String(userState?.id);
```

### 3. Preventing Race Conditions
Refactored all `CaseUIState` updates to use direct draft mutations (Immer-style) instead of object spreading. This ensures that concurrent updates (e.g., case fetching vs. permission evaluation) are atomic and do not clobber each other.

```javascript
CaseUIState.update((s) => {
  s.general.enableEditCase = editAllowed;
  // ... other flags
});
```

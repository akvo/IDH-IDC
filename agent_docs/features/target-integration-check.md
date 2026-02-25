# Feature Check: Adjusted Target Integration in Advanced Modelling Tool

## Overview
This document outlines the investigation into how Step 4's adjusted target is incorporated into the Advanced Modelling Tool (Step 5).

## Current Understanding
- **Source of Adjusted Target**: The adjusted target is stored in `CaseVisualState` within `sensitivityAnalysis.config` under the key `${selectedSegmentId}_adjusted-target`.
- **Logic Location**: `AdvancedModellingTool.js` contains a `getTargetIncome` helper function that retrieves this value.
- **Integration**: `handleCalculate` calls `getTargetIncome` to determine the `targetPrimaryIncome` used for modelling.

## Goals
1. Confirm that the `sensitivityAnalysis` configuration is correctly populated from Step 4.
2. Verify that `AdvancedModellingTool.js` uses the adjusted target for its core modelling calculations.
3. Clarify the decoupling between "Surplus Detection" (baseline-focused) and "Modelling Calculation" (adjusted-target-focused).

## Phase 1 & 2 Findings
- **Storage**: `AdjustIncomeTarget.js` (Step 4) saves the adjusted target in `CaseVisualState.sensitivityAnalysis.config` under `${selectedSegment}_adjusted-target`.
- **Retrieval**: `AdvancedModellingTool.js` (Step 5) *previously* retrieved this value via `getTargetIncome()`.
- **Logic Revert (2026-02-25)**: Based on manager feedback, Step 5 has been reverted to **ignore** adjusted targets from Step 4. It now strictly uses the `currentTarget` (baseline) from Step 1.
- **Current Integration**: `AdvancedModellingTool.js` uses `segment.target` directly.
- **Surplus Logic**: Remains baseline-focused, which is now consistent with the core modelling calculation.

## Conclusion
The Advanced Modelling Tool (Step 5) now strictly uses the **baseline target** set in Step 1, ensuring consistency as requested. Adjusted targets are exclusively Applied in Step 4 features.

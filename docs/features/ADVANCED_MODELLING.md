# Feature Specification: Advanced Modelling & Visualization Logic

This document describes the high-fidelity modeling tools and visualization configuration schemas for Steps 4 and 5 of the IDC platform.

---

## 1. Advanced Modelling Tool (Step 5)

The Advanced Modelling Tool provides a granular interaction model for simulating changes across multiple drivers: Price, Volume, Land, CoP, and Diversified Income.

### Core Modelling Logic
*   **Target Selection**: The tool now strictly uses the **Baseline Target** (Step 1) as the default source for "Closing the Gap", rather than adjusted targets from Step 4.
*   **Result Persistence**: Calculations are performed in the frontend and persisted as a structured `config` JSON for each segment within the `visualization` table.
*   **"What is Next?" Guidance**: Step 5 includes a `WhatIsNextInfoBox` component to guide users through the modeling results towards final scenario comparison.

---

## 2. Feature Gating for High-Income Segments (#740)

To ensure analytical focus, certain modeling features are disabled for farmer segments already earning more than the target living income.

### Gating Rules
*   **Step 3**: The "Additional income needed" chart displays an `IncomeGatingAlert` if the current income exceeds the target.
*   **Step 4**: The "Single driver change" and "Sensitivity analysis" tools are disabled with an informative message: *"Farmers in this segment already earn more than the income target."*
*   **Step 5**: Traditional modelling remains accessible, but results will reflect a "surplus" state rather than a "gap".

---

## 3. Visualization Configuration Schema

The `config` column in the `visualization` table stores transient and persistent UI state for modelling tools.

| Tab / Tool | Source | Key Pattern | Description |
| :--- | :--- | :--- | :--- |
| **Sensitivity Analysis** | Step 4 | `{id}_x-axis-driver` | Selected driver for the X-axis chart. |
| **Advanced Modelling**| Step 5 | `advancedModeling` | Nested state tree for all driver values and locked fields. |
| **Scenario Modelling**| Step 5 | `scenarioData` | Array of standard scenario objects (Percentage-based). |
| **Impact Analysis** | Step 5 | `investment_analysis`| **[Premium]** Costs, ROI metrics, and allocation modes. |

---

## 4. Technical Reference
*   **Modelling Logic**: `frontend/src/pages/cases/components/AdvancedModellingTool.js`
*   **Gating Component**: `frontend/src/pages/cases/components/IncomeGatingAlert.js`
*   **Schema Schema**: `docs/features/ADVANCED_MODELLING.md` (See section 3).

---

> [!CAUTION]
> Direct manipulation of the `visualization.config` JSON via SQL is highly discouraged. Always use the provided frontend tools to update modeling state to ensure schema consistency.

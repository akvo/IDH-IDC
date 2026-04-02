# Feature Specification: Income Gap Analysis & Breakdown Logic

## 📊 Overview

### Purpose
This document describes the analytical logic used to break down the "Income Gap" (the difference between current income and the living income benchmark) and how "Additional Needed Income" is allocated across existing income sources.

### Key Principle
**Proportional Allocation**: IDC assumes that to close the income gap, the additional income must be distributed proportionally across existing income drivers (Price, Volume, Diversified Income) unless specific model changes are applied.

---

## 🎯 Design Principles
- **Clarity**: Visualizations must explain *why* additional income is needed and where it originates.
- **Consistency**: The same baseline target is used across both Step 3 (Understanding) and Step 5 (Modelling).

---

## 📐 Architecture Design

### Data Flow / Logic Flow
1.  **Input**: Baseline Income Data (Step 1) + Benchmark (Step 2).
2.  **Calculation**: `Income_Gap = Benchmark - Total_Current_Income`.
3.  **Allocation**: `Needed_Source_A = Income_Gap * (Current_Source_A / Total_Current_Income)`.
4.  **UI Render**: Step 3 Charts (`ChartNeededIncomeLevel.js`) display this allocation as the "Needed" portion of each driver.

---

## 🔧 Implementation Details

### 1. Income Composition & Gap Breakdown Clarifications (#746)
- **Descriptions**: Expanded descriptions in `ChartNeededIncomeLevel.js` and `ChartHouseholdIncomeComposition.js` clarify that the gap is shared across existing sources.
- **Layout**: Standardized card heights (`minHeight: 150`) ensure visual alignment when gating alerts or long descriptions are present.

### 2. Step 5 Guidance: "What is Next?" Info Box (#749)
- **Component**: `WhatIsNextInfoBox.js`
- **Purpose**: At the end of Step 5, users are presented with a summary box explaining that the modelling is complete and they can now proceed to side-by-side scenario comparison in the final dashboard.
- **Design**: Uses a two-column layout with IDC-branded styling and responsive gutters.

---

## ✅ Implementation Checklist
- [x] Proportionally allocate gap in Step 3 charts.
- [x] Standardize chart container heights.
- [x] Implement Step 5 "What is Next?" info box.
- [x] Verify responsive layout for explanation boxes.

---

## 📡 API Reference
This feature is implemented entirely in the frontend logic. No backend changes required.
- **Logic**: `frontend/src/pages/cases/utils/incomeCalculations.js` (Hypothetical path for consolidated logic).
- **Charts**: `frontend/src/pages/cases/visualizations/*.js`

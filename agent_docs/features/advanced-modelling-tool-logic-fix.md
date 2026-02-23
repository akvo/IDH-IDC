# Feature: Advanced Modelling Tool Logic Revisions

## Overview
This feature addresses feedback regarding how the Advanced Modelling Tool handles and displays calculation results, especially in edge cases like negative outcomes or when segments already exceed the income target.

## Requirements

### 1. Calculation Result Display
- **Requirement**: The model output must always display the actual value produced by the calculation.
- **Goal**: Transparency in what the mathematical model is producing.

### 2. Negative Outcome Handling (Feasibility Alert)
- **Requirement**: If any calculated driver value (Price, Volume, CoP, Land) results in a negative number, display a critical warning.
- **Alert Message**: *"It is not physically possible to reach the income target with the specified model values."*
- **UI Impact**: Keep the "Price Breakdown" card visible, but hide the bar chart and labels, replacing them with a specific warning alert inside the card.

### 3. Surplus Scenario Handling (Segment Income > Target)
- **Requirement**: If a segment already earns more than the income target, display an informational warning.
- **Alert Message**: *"Farmers in this segment already earn more than the income target. In this calculated scenario, incomes would decrease."*
- **UI Impact**: The "Price Breakdown" should remain visible and functional.

### 4. Normal Scenario Handling (Segment Income < Target)
- **Requirement**: No specific alert required unless there's a negative calculation outcome.
- **UI Impact**: "Price Breakdown" should remain visible and functional.

## Logical Flow Summary
| Condition | Display Value | Alert | Price Breakdown |
|-----------|---------------|-------|-----------------|
| Calculation < 0 | Raw Value | ❌ Physically impossible warning | Hidden/Disabled |
| Income > Target | Raw Value | ℹ️ Income would decrease warning | Visible |
| Income <= Target AND Calculation >= 0 | Raw Value | None | Visible |

# UX Specification: Advanced Modelling Tool Alerts

## Overview
Refine the feedback loop in the Advanced Modelling Tool to provide clear, actionable guidance based on mathematical feasibility.

## Interaction Patterns

### 1. The "Calculate" Flow
- When the user clicks "Calculate", the system evaluates the mathematical result against the segment's income target and physical constraints.

### 2. Alert Types

#### A. Physically Impossible (Critical)
- **Trigger**: Calculated driver value (Price, Volume, CoP, Land) < 0.
- **Visual Style**: Ant Design `Alert` with `type="warning"` (or "error" / "critical").
- **Message**: *"It is not physically possible to reach the income target with the specified model values."*
- **Component Change**: Inside the "Price Breakdown" card, the bar chart area is replaced with a warning alert stating: *"Farmers would need a negative [Driver] in order to hit the income target. This is not physically possible and the price breakdown is unavailable."*

#### B. Income Surplus (Informational)
- **Trigger**: Segment already earns >= Income Target.
- **Visual Style**: Ant Design `Alert` with `type="info"`.
- **Message**: *"Farmers in this segment already earn more than the income target. In this calculated scenario, incomes would decrease."*
- **Component Change**: Price Breakdown remains fully visible and interactive.

### 3. Driver Result Display
- **Rule**: Always show the raw result of the calculation in the "Required [Driver]" box.
- **Affordance**: The box background color (Red/Green) continues to indicate feasibility vs. the "Feasible" baseline.

## Visual Hierarchy
1.  **Driver Inputs** (Unlocked/Interactive)
2.  **Equation Visualizer** (Static Reference)
3.  **Calculation Result Box** (Primary Output)
4.  **Contextual Alert** (Dynamic Guidance - positioned below result box)
5.  **Price Breakdown** (Detailed visualization - updated or disabled based on result)

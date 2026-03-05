# UX Specification: Feature Gating for High Income Segments (#740)

## Overview
Define the visual experience when analysis tools are disabled because a segment already earns more than the target income.

## 1. Step 3: Additional Income Needed Pie Chart
- **Trigger**: `currentIncome >= targetIncome` for the selected segment.
- **Visual Pattern**:
    - Keep `VisualCardWrapper` and `SegmentSelector`.
    - Replace the `Chart` component with an Ant Design `Alert`.
    - **Alert Props**: `type="info"`, `showIcon`, `message="Income target reached"`, `description="Farmers in this segment already earn more than the income target. This feature is therefore disabled."`
- **Rationale**: Keeps the layout stable while providing clear feedback.

## 2. Step 4: Single Driver Change
- **Trigger**: `currentIncome >= targetIncome` for the selected segment.
- **Visual Pattern**:
    - Keep the `Card` header and description.
    - Replace the entire table area (all `Card.Grid` elements) with a single `Alert`.
    - **Alert Props**: `type="info"`, `showIcon`, `message="Income target reached"`, `description="Farmers in this segment already earn more than the income target. This feature is therefore disabled."`
    - Add `style={{ margin: '20px' }}` to the alert to ensure it fits well within the card.
- **Rationale**: Prevents users from interacting with irrelevant data tables.

## 3. Comparison Logic Details
- Use `0.01` precision if necessary, but standard `>=` should suffice.
- Ensure the message is updated instantly when the segment is changed via `SegmentSelector`.

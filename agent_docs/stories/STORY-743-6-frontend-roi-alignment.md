# STORY-743-6: Frontend ROI Design Alignment (Figma Parity)

## Status
- **Status**: [x] COMPLETED
- **Priority**: HIGH
- **Estimate**: 6h
- **Owner**: Amelia (Dev) / Sally (UX)

## Context
The "Impact of Investment" visualizations (Step 3 in Scenario Modeling) currently use a basic layout that does not match the Figma design. Section 3 of the Figma design (node `9022:16574`) specifies a "zigzag" layout with descriptive text and an additional chart for component-level cost breakdown.

## User Acceptance Criteria (UAC)
1. [x] **Section Header**: The section is titled "3. Assess the impact of your investment" with the specific descriptive paragraph from Figma.
2. [x] **Scenario Cost by Component**: A new chart is visible on the left side, showing a grouped column chart of investment costs by component (Training, Capacity, etc.) for each scenario.
3. [x] **Zigzag Layout**: 
    - Row 1: "Scenario Cost by component" chart (Left) + Explanation text (Right).
    - Row 2: "Return on Investment (%)" chart (Right) + Explanation text (Left).
4. [x] **Visual Styling**: Colors, padding, and font weights are aligned with the IDH design system as shown in Figma.
5. [x] **Dynamic Data**: The charts update automatically when users modify ROI components in Step 2.

## Technical Acceptance Criteria (TAC)
1. [x] **Component Refactor**: `ImpactOfInvestmentCharts.js` uses Ant Design `Row`/`Col` with staggered spans to achieve the zigzag effect.
2. [x] **Data Aggregation**: Implement a cross-segment aggregator in `roiCalculations.js` (or via useMemo) that sums up `cost * multiplier` for each component category across all segments.
3. [x] **Chart Implementation**:
    - Use the standard `Chart` component for both visualizations.
    - Set `type="COLUMN-BAR"` for both.
    - Component cost chart should be grouped by component name.
4. [x] **Header Integrity**: Use `Typography` and existing design tokens for titles and descriptions.
5. [x] **Performance**: Ensure `useMemo` is used to prevent redundant calculations on every render.

## Timeline & Effort
- **Planning & Research**: 0.5h
- **Data Logics (Breakdown)**: 1.5h
- **UI Layout (Zigzag)**: 1.5h
- **Chart Fine-tuning**: 1.5h
- **Verification & Documentation**: 1h
- **Total**: 6h

# UI QA Guide: Impact of Investment (ROI) #743

This guide outlines the steps to verify the ROI dashboard refinements on the **Staging** environment.

## Role Identification
- **Editor Roles**: Admin, Internal, External Advanced.
- **Viewer Roles**: External Regular (or any user with view-only access to a case).

## Happy Path: Cost Allocation & ROI
1.  **Navigate**: Open a case and go to **Step 5 ("Closing the gap")**.
2.  **Toggle Shared Mode**:
    - Select **"Yes, for all farmers"** in the "Included implementation investment?" section.
    - **Action**: Add a cost component (e.g., "Training", "Total", "10,000").
    - **Verify**: Navigate to another segment (e.g., from "All Farmers" tab to "Smallholder" tab). The ROI inputs should be identical.
3.  **Toggle Per-Segment Mode**:
    - Switch to **"Yes, per segment"**.
    - **Action**: Change the cost for the current segment to "5,000".
    - **Verify**: Switch to another segment. The cost should remain its previous value (or 0 if uninitialized), demonstrating isolated state.
4.  **Expansion Control**:
    - Expand the ROI table. 
    - **Verify**: Switch costing modes. The section should automatically collapse to ensure a clean state transition.

## ROI Visualizations Verification
1.  **Legend Accuracy**:
    - In the "Return on Investment (%)" chart, verify the legend shows both Scenario and Segment names (e.g., `Base Scenario - All Segments`).
2.  **Numerical Precision**:
    - Check the bar labels in the ROI chart and values in the Segment Breakdown table. 
    - **Verify**: No values should exceed 2 decimal places (e.g., `2864.82%` is correct, `2864.82193%` is a bug).
3.  **Independent Toggles**:
    - Toggle "Show label" on the **Scenario Cost** chart.
    - **Verify**: The **ROI chart** labels should NOT appear until its own toggle is clicked.

## Edge Case Checklist
- [ ] **Zero Improvement**: Model a scenario with no income improvement. Verify the ROI chart shows `0%` or `-100%` rather than "No Data".
- [ ] **Large Values**: Enter costs in the millions. Verify thousand-formatters correctly handle large numbers with 2 decimals.
- [ ] **Multi-Select Overflow**: Select 5+ combinations in the multi-selector. Verify the "Max 5 items" warning triggers and prevents further selection.

## Acceptance Criteria
- [ ] "All Farmers" inputs are perfectly synchronized across all segment views.
- [ ] ROI Chart legend accurately reflects active selections.
- [ ] All 3 ROI visual components (Cost, ROI, Table) export clean PNGs with labels.
- [ ] Strict 2-decimal precision across all financial metrics.

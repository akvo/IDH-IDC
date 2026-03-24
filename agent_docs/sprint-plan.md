# Sprint Plan: Case UX & Analysis Refinement (#739, #740)

## Sprint Objective
Improve the "Case Creation" experience by preventing accidental data loss and providing clear feedback during the Data Upload phase.

## Stories in Scope
| ID | Title | Priority | Status | Actual Time |
|----|-------|----------|--------|-------------|
| STORY-739 | Case Save UX Refinement | HIGH | [x] | 1.5h |
| STORY-739-C | Data Upload Cleanup | HIGH | [x] | 2.5h |
| STORY-740 | Feature Gating for High Income | HIGH | [x] | 2h |

## Technical Approach
- **Frontend**:
    - Use `Form.useWatch` in `CaseSettings.js` to monitor `import_id` for button guarding.
    - Implement `form.isFieldsTouched()` in `handleCancel` to trigger the exit confirmation.
    - Standardize modal usage with `Modal.confirm`.

## Verification Plan
### Manual Verification
1. Open "Create new case" drawer.
2. Fill in Case Name.
3. Switch to "Data upload" tab.
4. Verify "Save case" button is disabled and shows tooltip.
5. Upload a file.
6. Verify "Save case" button becomes enabled.
7. Click "Cancel"/ "X" and verify the "Unsaved changes" modal appears.
8. Confirm "Discard" and verify the drawer closes.

### Automated Tests
- Run `yarn lint` to ensure no regressions.
- (Optional) Use `App.test.js` patterns if unit testing component state is required.

---

# Sprint Plan: Impact of Investment Analysis (#743)

## Sprint Objective
Enable premium users to analyze the cost-effectiveness (ROI) of different income-improvement scenarios within Step 5, supporting both case-wide and segment-specific cost breakdowns.

## Stories in Scope
| ID | Title | Priority | Status | Actual/Est. |
|----|-------|----------|--------|-----------|
| STORY-743-0 | Component Restoration (Phase 1) | HIGH | [x] | 2h |
| STORY-743-1 | Backend Schema & Permission Gate | HIGH | [x] | 3h |
| STORY-743-2 | ROI Breakdown UI & Multipliers | HIGH | [x] | 4h |
| STORY-743-4 | Per-Segment ROI Breakdown (Tabs) | HIGH | [x] | 4h |
| STORY-743-5 | ROI Logic & Cost Allocation | HIGH | [x] | 6h |
| STORY-743-3 | Impact of Investment Charts | MEDIUM | [x] | 6h |
| STORY-743-6 | ROI Design Alignment (Figma) | HIGH | [x] | 6h |
| STORY-743-7 | Scenario Selector & Cost Transparency | HIGH | [x] | 4h |
| STORY-743-9 | Scenario-Segment Multi-Selector | HIGH | [x] | 4h |
| STORY-743-11 | ROI Scenario-Segment Multi-Selector | HIGH | [x] | 4h |
| STORY-743-10 | ROI Selection Restriction | LOW | [x] | 1h |

---

## Managerial 3-Day Split (Refined Backlog)
*This split reorganizes the 32-hour epic into three 8-hour blocks for better project tracking.*

| ID | Title | Est. Effort | Status |
|----|-------|-------------|--------|
| [STORY-743-A](file:///Users/galihpratama/Sites/IDH-IDC/agent_docs/stories/STORY-743-A.md) | ROI Foundation & Backend Integration | 8h | [x] |
| [STORY-743-B](file:///Users/galihpratama/Sites/IDH-IDC/agent_docs/stories/STORY-743-B.md) | Segment-Specific Investment Input | 8h | [x] |
| [STORY-743-C](file:///Users/galihpratama/Sites/IDH-IDC/agent_docs/stories/STORY-743-C.md) | ROI Visualizations & Multi-Comparison | 8h | [x] |

## Detailed Task Breakdown
### STORY-743-2: ROI Breakdown UI (COMPLETED)
- [x] Extract ROI form into standalone component
- [x] Rename "Current Value" -> "Cost" and "Total cost" -> "Total"
- [x] Implement multipliers (e.g., "x 100 Farmers") for clarity
- [x] Synchronize top-level investment cost with breakdown items

### STORY-743-4: Per-Segment ROI (COMPLETED)
- [x] Relocate `ScenarioModelingROIForm.js` inside the segment-specific tabs.
- [x] Implement data isolation by `segment_id` (Figma Aligned).
- [x] Ensure "Total investment cost" reflects the specific segment's contribution.
- [x] Sync the scenario-level total for final aggregate charts.

### STORY-743-5: ROI Logic & Allocation (COMPLETED)
- [x] Implement `calculate_roi` in `roiCalculations.js` using segment-level summation.
- [x] Fix double-multiplication bug by prioritizing component aggregation.
- [x] Integrate land area calculation: use `avg_land_area * farmers` for "Per Land Unit" multipliers.

### STORY-743-3: Visualization & Finishing (COMPLETED)
- [x] Finalize `ImpactOfInvestmentCharts.js` data aggregation
- [x] Add "Investment Efficiency" column chart to Step 5
- [x] Implement "Income vs Cost" comparison visualization

### STORY-743-6: ROI Design Alignment (COMPLETED)
- [x] Implement zigzag layout (Chart/Text, Text/Chart) in `ImpactOfInvestmentCharts.js`
- [x] Implement "Scenario Cost by component" grouped chart
- [x] Integrate Figma-specific descriptive texts and headers
- [x] Refine ROI percentage chart to match Figma visual style

### STORY-743-7: Scenario Selector & Cost Transparency (COMPLETED)
- [x] Add scenario selector below ROI chart description.
- [x] Filter charts in `ImpactOfInvestmentCharts.js` based on selection.
- [x] Add "Segment Cost Breakdown" table to pinpoint errors (like the 402k bug).

### User Story: STORY-743-8 — ROI Pseudocode Alignment

**Status**: [x] COMPLETED
- [x] Implement proportional cost distribution for case-wide inputs.
- [x] Add `Payback Period`, `Income Increase %`, and `Impact %` to utility.
- [x] Update Segment Breakdown table with new calculation metrics.

## Verification Plan
### Automated Tests
- Run `yarn lint` and `./dc.sh exec backend pytest tests/test_080_visualization.py`
- Verify ROI utility logic with Jest unit tests in `roiCalculations.test.js`

### Manual Verification
### STORY-743-9: Selector Multi-Comparison & Robustness (COMPLETED)
- [x] Implement multi-select dropdown for "Scenario Cost by component" (Max 5 items).
- [x] Restore single-select for ROI chart (Segment-level analysis).
- [x] Robust `::: ` delimiter for key parsing (fixed dashes in scenario names).
- [x] Strict string casting for scenario keys (fixed numeric lookup bug).
- [x] Zero-value fallback for segments without investment data (prevents blank state).
- [x] Verified charts update in real-time with selected combinations.

### STORY-743-11: ROI Scenario-Segment Multi-Selector (COMPLETED)
- [x] Replace single segment selector with scenario-segment multi-selector.
- [x] Align with Cost Chart comparison pattern (Max 5 items).
- [x] Update ROI chart labels to show Scenario - Segment names.

### STORY-743-10: ROI Selection Restriction (COMPLETED)
- [x] Implement mutual exclusivity logic for ROI component dropdown.
- [x] Use `useMemo` for stable `componentsData` and `selectedNames`.
- [x] Verify that selected options are disabled in other rows.
- [x] Update User Guide and Feature Documentation.

## Verification Plan
1.  **Selection Robustness**: Select a scenario with a dash in its name (e.g., "Scenario-1") and verify the chart correctly displays data.
2.  **Segment Deep Dives**: Select a specific segment (e.g., "Male") and verify it is not blank.
3.  **Missing Data**: Select a segment without investment and verify the chart shows a 0-bar instead of "No Data."
4.  **Multi-Comparison**: Select 5 combinations and verify side-by-side rendering in the Cost chart.

### STORY-743-13: ROI Cost Allocation Mode Selector (COMPLETED)
- [x] Replaced "ROI Off/On" toggle with "No", "Yes, all farmers", "Yes, per segment" radio group.
- [x] Implemented mode-specific ROI expansion logic (shared for "All", isolated for "Segment").
- [x] Implemented automatic expansion state resets on mode change.

### STORY-743-14: Proportional ROI Calculations (COMPLETED)
- [x] Implemented proportional cost distribution in `roiCalculations.js` based on farmer count ratio.
- [x] Supported all unit types (Total, Per Farmer, Per Land) in proportional mode.
- [x] Verified 100% calculation accuracy with Jest unit tests.

### STORY-743-15: Segment Selector Synchronization (COMPLETED)
- [x] Synchronized ROI dashboard segment selectors with application-wide `activeSegmentId`.
- [x] Implemented bidirectional sync between top-level tabs and ROI visualizations.
- [x] Linked the single-select ROI chart to the active segment for deep-dive analysis.

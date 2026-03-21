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
| STORY-743-4 | Per-Segment ROI Breakdown (Tabs) | HIGH | [ ] | 4h |
| STORY-743-5 | ROI Logic & Cost Allocation | HIGH | [ ] | 6h |
| STORY-743-3 | Impact of Investment Charts | MEDIUM | [/] | 6h |

## Detailed Task Breakdown
### STORY-743-2: ROI Breakdown UI (COMPLETED)
- [x] Extract ROI form into standalone component
- [x] Rename "Current Value" -> "Cost" and "Total cost" -> "Total"
- [x] Implement multipliers (e.g., "x 100 Farmers") for clarity
- [x] Synchronize top-level investment cost with breakdown items

### STORY-743-4: Per-Segment ROI (NEXT)
- [ ] Enable "Per segment" toggle in `ScenarioModelingROIForm.js`
- [ ] Implement `Tabs` interface to switch between segment-specific costs
- [ ] Synchronize per-segment state with global `CaseVisualState`
- [ ] Ensure "Total investment cost" remains read-only when tabs are active

### STORY-743-5: ROI Logic & Allocation
- [ ] Implement `calculate_roi` in `roiCalculations.js` using the defined formula: `(% Increase / Total Cost) * 100`
- [ ] Implement automatic cost allocation: split "Total" cost proportionally by farmer count if per-segment is OFF
- [ ] Integrate land area calculation: use `avg_land_area * farmers` for "Per Land Unit" multipliers

### STORY-743-3: Visualization & Finishing
- [ ] Finalize `ImpactOfInvestmentCharts.js` data aggregation
- [ ] Add "Investment Efficiency" column chart to Step 5
- [ ] Implement "Income vs Cost" comparison visualization

## Verification Plan
### Automated Tests
- Run `yarn lint` and `./dc.sh exec backend pytest tests/test_080_visualization.py`
- Verify ROI utility logic with Jest unit tests in `roiCalculations.test.js`

### Manual Verification
1. Model scenarios in Step 5 and toggle "Add Investment".
2. Switch between "Case-wide" and "Per segment" modes.
3. Verify that changing cost in Segment A does not override Segment B.
4. Verify the "Impact" charts reflect real-time calculation updates.

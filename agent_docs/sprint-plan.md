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

# Sprint Plan: Impact of Investment Analysis (#741)

## Sprint Objective
Enable premium users to analyze the cost-effectiveness (ROI) of different income-improvement scenarios within Step 5.

## Stories in Scope
| ID | Title | Priority | Status | Est. Time |
|----|-------|----------|--------|-----------|
| STORY-741-1 | Backend Schema & Permission Gate | HIGH | [ ] | 4h |
| STORY-741-2 | Frontend Investment Input UI | HIGH | [ ] | 6h |
| STORY-741-3 | Frontend Calculation & Charts | HIGH | [ ] | 10h |

## Detailed Task Breakdown
### STORY-741-1: Backend
- [ ] Define `InvestmentCost` Pydantic models in `visualization.py`
- [ ] Implement `is_premium` validation in `visualization` POST route
- [ ] Backend test: verify 422 for invalid investment JSON
- [ ] Backend test: verify 403 for non-premium attempts

### STORY-741-2: Frontend Input UI
- [ ] Add "Add Investment" state to `CaseVisualStore`
- [ ] Implement `InvestmentModal` component for cost entry
- [ ] Logic: Toggle between Total/Per-Farmer/Per-Land units
- [ ] UI: Ensure currency formatting follows project standards

### STORY-741-3: Analytics & Viz
- [ ] Logic: Proportionate cost distribution across segments
- [ ] Logic: Net Gain / Total Investment calculation
- [ ] Component: Impact Comparison Bar Chart
- [ ] Component: Investment Efficiency Table

## Verification Plan
### Manual Verification
1. Open Step 5 with a premium user.
2. Model at least two scenarios.
3. Add different costs to each scenario.
4. Verify the "Impact Comparison" chart reflects the ROI difference.
5. Verify costs distribute correctly when adding/removing segments.

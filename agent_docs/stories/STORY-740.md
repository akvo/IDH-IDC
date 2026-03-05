# Stories: #740 Disable Features Above Target Income

## Story: Disable Step 3 Additional Income Needed Chart
**As a** Decision Maker
**I want** the "Additional income needed" chart to be hidden when a segment already earns more than the target
**So that** I don't see misleading analysis suggesting a gap exists when the goal is already met.

### Timeline & Effort
- **Estimated Time**: 1h
- **Actual Time**:
- **Effort Points**: 1

### Acceptance Criteria
#### User Acceptance Criteria (UAC)
- [x] Given I am in Step 3, when I select a segment where `totalCurrentIncome >= targetIncome`, then the "Additional income needed by income source" pie chart must be replaced by an Information Alert.
- [x] Given the chart is replaced by an Alert, when I switch to a segment where `totalCurrentIncome < targetIncome`, then the pie chart must immediately reappear.
- [x] The Alert must display the exact message: "Farmers in this segment already earn more than the income target. This feature is therefore disabled."

#### Technical Acceptance Criteria (TAC)
- [ ] Modify `frontend/src/pages/cases/visualizations/ChartNeededIncomeLevel.js`.
- [ ] Calculate `isAboveTarget` using `dashboardData` fields `total_current_income` and `target`.
- [ ] Use Ant Design `<Alert />` component with `type="info"` and `showIcon`.

### Technical Notes
- Component: `frontend/src/pages/cases/visualizations/ChartNeededIncomeLevel.js`
- Logic: `(currentDashboardData?.total_current_income || 0) >= (currentDashboardData?.target || 0)`

---

## Story: Disable Step 4 Single Driver Change Table
**As a** Strategy Planner
**I want** the "Single driver change" table to be disabled when a segment is above the target
**So that** I focus on mitigation strategies for segments that actually have a gap.

### Timeline & Effort
- **Estimated Time**: 1h
- **Actual Time**:
- **Effort Points**: 1

### Acceptance Criteria
#### User Acceptance Criteria (UAC)
- [x] Given I am in Step 4, when I select a segment where `totalCurrentIncome >= incomeTarget`, then the "Single driver change" table must be replaced by an Information Alert.
- [x] Given the table is replaced by an Alert, when the segment is changed to one below the target, then the table must reappear.
- [x] The Alert must display: "Farmers in this segment already earn more than the income target. This feature is therefore disabled."

#### Technical Acceptance Criteria (TAC)
- [x] Modify `frontend/src/pages/cases/components/SingleDriverChange.js`.
- [x] Respect `adjustedIncometarget` (if present) as the `incomeTarget`.
- [x] Replace the table content inside the `Card` with the `<Alert />` component.

### Technical Notes
- Component: `frontend/src/pages/cases/components/SingleDriverChange.js`
- Logic: Uses `incomeTarget` which already incorporates sensitivity analysis adjustments.

### Definition of Done
- [x] Logic implemented in both components
- [x] Manual verification passes
- [x] Linting passing (`yarn lint`)
- [x] UX Specification updated

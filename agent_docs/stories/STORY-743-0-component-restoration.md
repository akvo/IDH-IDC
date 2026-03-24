## Story: Restore Scenario Modeling & Chart Component (Phase 1)
**Status**: [x] COMPLETED
**As a** Developer
**I want** to restore the previous `ScenarioModelingIncomeDriversAndChart.js` component to Step 5
**So that** I have a stable baseline functionality before extending it with ROI features

### Timeline & Effort
- **Estimated Time**: 3h
- **Actual Time**: 2h
- **Effort Points**: 2

### Acceptance Criteria
#### User Acceptance Criteria (UAC)
- [x] Step 5 ("Closing the gap") displays the chart-driven scenario modeling interface **sitting below** the existing Advanced Modelling Tool.
- [x] Users can still use the Advanced Modelling Tool independently.
- [x] Users can adjust drivers in the restored chart section and see real-time chart updates.
- [x] The page layout remains clean and responsive with both components stacked.

#### Technical Acceptance Criteria (TAC)
- [x] Re-integrate `ScenarioModelingIncomeDriversAndChart.js` into `ClosingGap.js`.
- [x] **State Independence**: Verify that the restored component uses `scenarioData` and the advanced tool uses `advancedModeling` sub-keys within the global state to prevent conflicts.
- [x] **Form Isolation**: Ensure `antd` Form instances in both components are isolated and do not trigger cross-component validation.
- [x] **CSS Scoping**: Verify no global style collisions between the two stacked components.
- [x] **Functional Parity**: Both tools must independently update the global `CaseVisualState` and be persisted correctly upon "Save".

### Technical Notes
- The component already exists at `frontend/src/pages/cases/components/ScenarioModelingIncomeDriversAndChart.js`.
- High priority on maintaining parity with previous stable version.

### Definition of Done
- [x] Component renders correctly in Step 5.
- [x] Adjusting drivers updates the visual charts.
- [x] No regression in core modeling logic.

## Story: Investment Cost Input Interface (Frontend)
**As a** Business User
**I want** to input implementation costs for my modelling scenarios
**So that** I can calculate the ROI of my investment

### Timeline & Effort
- **Estimated Time**: 6h
- **Actual Time**: [Leave empty initially]
- **Effort Points**: 5

### Acceptance Criteria
#### User Acceptance Criteria (UAC)
- [ ] "Add Investment Cost" button appears within each Scenario tab in Step 5.
- [ ] Clicking the button opens a modal/form with options for:
    - Total Cost
    - Cost Per Farmer
    - Cost Per Land Unit
- [ ] The form reflects the active scenario and segment selection.
- [ ] Selecting a unit updates the calculated "Total Investment" preview in real-time.

#### Technical Acceptance Criteria (TAC)
- [ ] Create `InvestmentCostForm.js` component using Ant Design.
- [ ] Integrate with `CaseVisualState` (Scenario Modelling store).
- [ ] Ensure state is per-scenario and per-segment where applicable.

### Technical Notes
- Use `InputNumberThousandFormatter` for currency inputs.
- Ensure the modal is accessible and follows existing IDH-IDC design patterns.

### Definition of Done
- [ ] UI verified on 1280x720.
- [ ] Form state persists locally when switching scenarios.
- [ ] No React hook dependency warnings.

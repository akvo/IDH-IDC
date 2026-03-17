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
- [ ] "Toggle if you have an estimate of the cost required to implement the scenarios" appears below the scenario form.
- [ ] Enabling the toggle reveals a "Total Cost" field with unit selection.
- [ ] Clicking the down arrow near "Total Cost" expands a Granular Breakdown section.
- [ ] Breakdown table allows selecting "Scenario component" and defines "Cost type", "Current Value", and "Total cost" columns.
- [ ] Real-time "Total Investment" preview updates based on breakdown or global input.

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

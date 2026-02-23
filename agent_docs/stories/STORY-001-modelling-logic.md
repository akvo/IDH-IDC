# User Stories: Advanced Modelling Tool Revisions

## STORY-001: Model Logic - Raw Value Display
**User Story**: As a Sustainability Manager, I want to see the exact calculated driver value required to meet my target, even if it is negative or lower than current performance, so that I can understand the mathematical reality of my scenario.

**Acceptance Criteria**:
- [ ] `AdvancedModellingTool.js` handles calculation without clamping results to current values for surplus segments.
- [ ] The `finalResult` displayed in the UI is the raw `result` from `calculateModellingDriver`.
- [ ] Feasibility signal (Red/Green) still compares the result to the feasible baseline.

---

## STORY-002: Model UI - Feasibility Alerts
**User Story**: As a Data Analyst, I want to receive clear textual warnings when a modeling target is physically impossible or when a segment already meets the target, so that I can interpret the results correctly.

**Acceptance Criteria**:
- [ ] Display informational alert: *"Farmers in this segment already earn more than the income target. In this calculated scenario, incomes would decrease."* when segment income >= target.
- [ ] Display warning alert: *"It is not physically possible to reach the income target with the specified model values."* when calculated driver < 0.
- [ ] Alerts appear prominently below the calculation result box.

---

## STORY-003: Model UI - Price Breakdown Visibility
**User Story**: As a user, I want the Price Breakdown to remain visible during surplus scenarios but be replaced with a warning during impossible scenarios, so that the UI remains stable while providing relevant context.

**Acceptance Criteria**:
- [ ] Price Breakdown card remains visible in all states.
- [ ] If state is `impossible`, hide the bar chart and labels.
- [ ] If state is `impossible`, show warning inside the card: *"Farmers would need a negative [Driver] in order to hit the income target. This is not physically possible and the price breakdown is unavailable."*
- [ ] If state is `surplus` or `normal`, bar chart is visible and functional.

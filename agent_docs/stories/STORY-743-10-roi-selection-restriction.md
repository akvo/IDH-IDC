# User Story: ROI Component Selection Restriction (#743-10)

## Title
Restrict duplicate ROI component selection within the investment table.

## User Persona
As a **Sustainability Modeler**, I want the ROI component selection to prevent me from picking the same category (e.g., Training) twice for different rows in the same table, so that my cost breakdown remains organized and accurate for visualization.

## Acceptance Criteria (UAC)
- [ ] In `ScenarioModelingROIForm.js`, the "Scenario component" dropdown must disable options that are already selected in other rows within the same segment.
- [ ] Selecting an option (e.g., "Training") in Row A must immediately disable it in Row B's dropdown.
- [ ] Deselecting or changing a row's component must immediately re-enable that component for other rows.
- [ ] Deleting a row must re-enable its selected component for other rows.
- [ ] The current value of a row must remain visible and selectable (to allow keeping the selection) even if it's "selected" (to avoid logic loops).

## Technical Acceptance Criteria (TAC)
- [ ] Calculate `selectedNames` using `useMemo` from `componentsData`.
- [ ] Dynamically map `ROI_COMPONENT_OPTIONS` to the `options` prop of the `Select` component.
- [ ] Use the Ant Design `disabled` property on individual option objects.
- [ ] Ensure the rule is scoped to the **Active Segment** (already handled by the component's state structure).

## Definition of Done (DoD)
- [ ] Logic implemented in `ScenarioModelingROIForm.js`.
- [ ] Manual verification of the mutual exclusivity rule.
- [ ] Lint-clean status.
- [ ] Phase 8 Document sync (Update User Guide if needed).

## Timeline & Effort
- **Estimation**: 1 hour
- **Priority**: Low (UX Refinement)

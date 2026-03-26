# STORY-743-ROI-Other-Custom-Names: Custom "Other" ROI Components

**As** an IDC user,
**I want to** specify multiple "Other" investment components and give them custom names,
**So that** I can accurately reflect interventions that are not in the predefined list (e.g., "Land rights assistance" and "Market provision") and see them separately in the ROI charts.

## Timeline & Effort
- **Status**: Ready for Implementation
- **Estimated Effort**: 4 hours
- **Priority**: High

## User Acceptance Criteria (UAC)
1. In the ROI investment breakdown table, selecting "Other" does not disable "Other" for subsequent rows.
2. When "Other" is selected, an input field appears below the dropdown to enter a custom name.
3. The custom name input has a character limit (30 characters) to prevent layout issues.
4. Custom names are persisted when the case is saved.
5. In the "Scenario Cost by component" chart, each "Other" component with a unique custom name appears as its own category.
6. If no custom name is provided, it defaults to "Other" in the charts.

## Technical Acceptance Criteria (TAC)
1. **Component**: Modify `ScenarioModelingROIForm.js` to support multiple "Other" selections in the `Select` component.
2. **State**: Add `otherName` to the component state in `CaseVisualState`.
3. **Validation**: Use `maxLength={30}` on the `Input` field.
4. **Calculations**: Update `calculateScenarioROI` in `roiCalculations.js` to use `comp.otherName` when `comp.name === 'Other'`.
5. **Quality**: Ensure `yarn lint` passes.

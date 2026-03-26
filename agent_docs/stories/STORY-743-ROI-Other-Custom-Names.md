# STORY-743-ROI-Other-Custom-Names: Custom "Other" ROI Components

**As** an IDC user,
**I want to** specify multiple "Other" investment components and give them custom names,
**So that** I can accurately reflect interventions that are not in the predefined list (e.g., "Land rights assistance" and "Market provision") and see them separately in the ROI charts.

## Timeline & Effort
- **Status**: Implemented
- **Estimated Effort**: 4 hours
- **Actual Time**: 2.5 hours
- **Priority**: High

## User Acceptance Criteria (UAC)
1. [x] In the ROI investment breakdown table, selecting "Other" does not disable "Other" for subsequent rows.
2. [x] When "Other" is selected, an input field appears below the dropdown to enter a custom name.
3. [x] The custom name input has a character limit (30 characters) to prevent layout issues.
4. [x] Custom names are persisted when the case is saved.
5. [x] In the "Scenario Cost by component" chart, each "Other" component with a unique custom name appears as its own category.
6. [x] If no custom name is provided, it defaults to "Other" in the charts.

## Technical Acceptance Criteria (TAC)
1. [x] **Component**: Modify `ScenarioModelingROIForm.js` to support multiple "Other" selections in the `Select` component.
2. [x] **State**: Add `otherName` to the component state in `CaseVisualState`.
3. [x] **Validation**: Use `maxLength={30}` and `showCount` on the `Input` field.
4. [x] **Calculations**: Update `calculateScenarioROI` in `roiCalculations.js` to use `comp.otherName` when `comp.name === 'Other'`.
5. [x] **Quality**: Ensure `yarn lint` passes.

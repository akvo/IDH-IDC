# User Story: Text Updates & Clarifications (06-03-2026)

## Title
As a stakeholder, I want to update UI text and add clarifications so that users have a clearer understanding of the Data Upload feature, heatmap results, and modelling scenarios.

## Acceptance Criteria (UAC)
- [ ] Data Upload title is "Upload your completed data template".
- [ ] Data Upload subtitle is "Download the template, enter your data, run the validation in Excel, and upload the validated file here."
- [ ] Data Upload icon label is "Select a .xlsm data template to upload".
- [ ] Data Upload drag-and-drop text is "Drag and drop your data file here or click to upload".
- [ ] "physically" / "physically possible" is removed from Step 5 labelling and warnings.
- [ ] Clarification added to Step 2 "Feasible" tooltip explaining 90th quantile feasible values for uploaded data.
- [ ] Tooltip added to "Number of segments" explaining the grouping logic and potential issues.

## Technical Acceptance Criteria (TAC)
- [ ] Changes are implemented in `CaseForm.js`, `AdvancedModellingTool.js`, `DataUploadSegmentForm.js`, and `TwoDriverHeatmap.js`.
- [ ] Layout remains responsive on standard screens (1280x720+).
- [ ] `yarn lint` passes without errors.
- [ ] No regression in case creation or modelling logic.

## Timeline & Effort
- **Estimation**: 2h
- **Priority**: MEDIUM

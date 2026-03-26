# User Story: Text Updates & Clarifications (06-03-2026)

## Title
As a stakeholder, I want to update UI text and add clarifications so that users have a clearer understanding of the Data Upload feature, heatmap results, and modelling scenarios.

## Acceptance Criteria (UAC)
- [x] Data Upload title is "Upload your completed data template".
- [x] Data Upload subtitle is "Download the template, enter your data, run the validation in Excel, and upload the validated file here."
- [x] Data Upload icon label is "Select a .xlsm data template to upload".
- [x] Data Upload drag-and-drop text is "Drag and drop your data file here or click to upload".
- [x] "physically" / "physically possible" is removed from Step 5 labelling and warnings.
- [x] Clarification added to Step 2 "Feasible" tooltip explaining 90th quantile feasible values for uploaded data.
- [x] Tooltip added to "Number of segments" explaining the grouping logic and potential issues.

## Technical Acceptance Criteria (TAC)
- [x] Changes are implemented in `CaseForm.js`, `AdvancedModellingTool.js`, `DataUploadSegmentForm.js`, and `TwoDriverHeatmap.js`.
- [x] Layout remains responsive on standard screens (1280x720+).
- [x] `yarn lint` passes without errors.
- [x] No regression in case creation or modelling logic.

## Timeline & Effort
- **Estimation**: 2h
- **Priority**: MEDIUM

# Feature: [Data Upload] Segmentation UI Refinement

**ID**: 737
**Status**: Implemented
**Owner**: PM (John)

## Problem Statement
When configuring segmentation, it is unclear what the user is expected to do or what a “segmentation variable” refers to. The variable dropdown initially shows no options, without explaining that segmentation means grouping results by a variable and that the variable type (categorical or numerical) must be selected first. Additionally, the previous UI layout used excessive vertical space and lacked visual grouping for related controls.

## Objectives
- Clarify the purpose of segmentation in the UI using tooltips instead of intrusive alerts.
- Enforce a logical order of operations: select variable type first, then specific variable.
- Refine the visual layout to a robust two-column structure with nested Row/Col alignment.
- Standardize labels and placeholders to explicitly guide the user through the selection process.

## Acceptance Criteria
- [x] The UI first asks: “Variable type” (Categorical or Numerical) with a button-style toggle.
- [x] The UI then asks: “Select a variable to segment by:”
- [x] A dedicated "Segmentation" header with help tooltip is provided.
- [x] Placeholders are dynamic (e.g., "Select segmentation variable" once type is chosen).
- [x] The layout uses a two-column vertical stack with nested Row/Col alignment for precision.

## Detailed Requirements
### UI Component Refinement
- **Two-Column Structural Layout**:
    - **Row 1 (Headers & Type)**: "Variable type" [Tooltip] and the button-style toggle on the same line (float right). "Segmentation" header aligned on the right.
    - **Row 2 (Input Fields)**: "Select a variable to segment by:" (Select) on the left, "Number of segments:" (InputNumber) on the right.
- **Wording Updates**:
    - Variable Label: "Select a variable to segment by:"
    - Variable Placeholder: "Select segmentation variable" (when enabled).
- **Header Tooltips**:
    - Variable type: "What type of variable do you want to use for segmentation?"
    - Segmentation: "Configure how you want to divide your data into segments."

## Technical Implementation
- Components: `frontend/src/pages/cases/components/DataUploadSegmentForm.js` and `SegmentConfigurationForm.js`.
- Layout: Single Ant Design `<Row gutter={[16, 16]}>` with two `<Col span={12}>` containing nested `<Row gutter={[...]}><Col span={24}>` stacks.
- Variable Logic: `variableType` initialized to `null`. `Select` component `disabled={!variableType}`.

# Feature: [Data Upload] Order of entry for variable type

**ID**: 734
**Status**: Draft
**Owner**: PM (John)

## Problem Statement
When configuring segmentation, it is unclear what the user is expected to do or what a “segmentation variable” refers to. The variable dropdown initially shows no options, without explaining that segmentation means grouping results by a variable and that the variable type (categorical or numerical) must be selected first. As a result, users do not understand what the step is for or why the dropdown is empty.

## Objectives
- Clarify the purpose of segmentation in the UI.
- Enforce a logical order of operations: select variable type first, then specific variable.
- Improve the user experience by only showing relevant variables in the dropdown based on the selected type.

## Acceptance Criteria
- [ ] The UI first asks: “What type of variable do you want to use for segmentation?” (Categorical or Numerical).
- [ ] The UI then asks: “Select a variable to segment by.”
- [ ] It is clear that segmentation means grouping results by a variable.
- [ ] The variable dropdown is populated only after a type is selected and only with matching variables.

## User Persona
- **Users** who are uploading their own validated data template and want to segment their farmer data for analysis.

## Detailed Requirements
### SegmentGenerator Component refactoring
- **Initial State**: `variableType` should be initialized to `null` to ensure no variables are shown initially and to force user interaction.
- **UI Order**:
    1. **Variable Type Selection**:
        - Label: "What type of variable do you want to use for segmentation?"
        - Component: `Radio.Group` (Categorical/Numerical).
    2. **Variable Selection**:
        - Label: "Select a variable to segment by:"
        - Component: `Select`.
        - Behavior: Disabled if `variableType` is null. Empty options if `variableType` is null.
- **Explanatory Content**: Add a brief explanation: "Segmentation allows you to group your results by a specific characteristic, such as geographic area or farm size."
- **Wording**: Ensure all labels match the acceptance criteria exactly.

## Technical Notes
- Component: `frontend/src/pages/cases/components/DataUploadSegmentForm.js` -> `SegmentGenerator`
- Logic:
    - Update `const [variableType, setVariableType] = useState(null);`
    - Swap the `Form.Item` for `Radio.Group` and `Select`.
    - Update `variableOptions` to return `[]` if `!variableType`.
    - Update `placeholder` and `disabled` props of the `Select` component.

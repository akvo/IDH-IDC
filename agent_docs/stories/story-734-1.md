# Story: [Data Upload] Dynamic Segmentation Variable Selection

**ID**: STORY-734-1
**Status**: Completed
**Effort**: 1

## Description
As a user uploading data, I want to be guided through the segmentation variable selection process so that I understand why the dropdown is empty and how to proceed.

## Acceptance Criteria
- [x] `variableType` in `SegmentGenerator` defaults to `null`.
- [x] Labels match the specification:
    - Variable Type: Label "Variable type" with Tooltip icon "?" ("What type of variable do you want to use for segmentation?")
    - Variable Selection: "Select a variable to segment by:"
- [x] The variable dropdown is disabled when no type selected.
- [x] The variable dropdown shows "Select a variable type first" when disabled.
- [x] Switched UI order: Type selection comes BEFORE specific variable selection.

## Technical Notes
- Component: `DataUploadSegmentForm.js`
- Use `antd` `Alert`, `Radio`, `Select` components.
- Ensure `useMemo` for `variableOptions` handles the `null` type.

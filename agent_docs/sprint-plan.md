# Sprint Plan: Case UX & Analysis Refinement (#739, #740)

## Sprint Objective
Improve the "Case Creation" experience by preventing accidental data loss and providing clear feedback during the Data Upload phase.

## Stories in Scope
| ID | Title | Priority | Status |
|----|-------|----------|--------|
| [STORY-739](file:///Users/galihpratama/Sites/IDH-IDC/agent_docs/stories/STORY-739.md) | Case Save UX Refinement | HIGH | [ ] |
| [STORY-740](file:///Users/galihpratama/Sites/IDH-IDC/agent_docs/stories/STORY-740.md) | Feature Gating for High Income | HIGH | [ ] |

## Technical Approach
- **Frontend**:
    - Use `Form.useWatch` in `CaseSettings.js` to monitor `import_id` for button guarding.
    - Implement `form.isFieldsTouched()` in `handleCancel` to trigger the exit confirmation.
    - Standardize modal usage with `Modal.confirm`.

## Verification Plan
### Manual Verification
1. Open "Create new case" drawer.
2. Fill in Case Name.
3. Switch to "Data upload" tab.
4. Verify "Save case" button is disabled and shows tooltip.
5. Upload a file.
6. Verify "Save case" button becomes enabled.
7. Click "Cancel"/ "X" and verify the "Unsaved changes" modal appears.
8. Confirm "Discard" and verify the drawer closes.

### Automated Tests
- Run `yarn lint` to ensure no regressions.
- (Optional) Use `App.test.js` patterns if unit testing component state is required.

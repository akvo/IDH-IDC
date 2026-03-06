# Sprint Plan: Case UX & Analysis Refinement (#739, #740)

## Sprint Objective
Improve the "Case Creation" experience by preventing accidental data loss and providing clear feedback during the Data Upload phase.

## Stories in Scope
| ID | Title | Priority | Status | Actual Time |
|----|-------|----------|--------|-------------|
| STORY-739 | Case Save UX Refinement | HIGH | [x] | 1.5h |
| STORY-739-C | Data Upload Cleanup | HIGH | [x] | 2.5h |
| STORY-740 | Feature Gating for High Income | HIGH | [x] | 2h |

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

# UI QA Guide: Issue #739 Case Save UX Refinement

**Auditor**: Murat (Test Architect) 🧪
**Feature**: Case Creation Guard & Data Cleanup

## 1. Role Identification
- **Internal / External Advanced**: Primary users for Data Upload.
- **External Regular**: Can define segments manually (view-only or editor if assigned).

## 2. Happy Path: Guided Upload
1.  **Action**: Open "Create new case" drawer.
2.  **Action**: Enter Case Name and Description.
3.  **Action**: Switch to **Data upload** tab.
4.  **Check**: "Save case" button is **disabled**.
5.  **Action**: Hover over the button.
6.  **Check**: Tooltip appears: "Please upload a data template, or switch to 'Manual data input'..."
7.  **Action**: Upload a valid spreadsheet.
8.  **Check**: "Save case" button becomes **enabled**.
9.  **Action**: Click "Save case".
10. **Check**: Case is created successfully.

## 3. Edge Case: Unsaved Changes Guard
1.  **Action**: Start a new case, enter a name.
2.  **Action**: Click the "X" (Close) or "Cancel" button.
3.  **Check**: Confirmation modal appears: "You have unsaved changes. Are you sure you want to discard them?"
4.  **Action**: Click "Keep editing".
5.  **Check**: Modal closes, data remains in the form.
6.  **Action**: Click "Cancel" -> "**Discard changes**".
7.  **Check**: Drawer closes, form is reset.

## 4. Edge Case: Cleanup Verification
1.  **Action**: Open drawer, upload a file.
2.  **Action**: Click "Cancel" -> "**Discard changes**".
3.  **Check (Developer Console)**: Verify a `DELETE` request was sent to `/api/v1/case-import/{id}`.
4.  **Action**: Verify the "Save case" button is disabled again if you re-open and go to the upload tab.

## 5. Acceptance Criteria Checklist
- [ ] Save button state is tab-aware.
- [ ] Tooltip is present and accurate.
- [ ] Exit guard modal appears only when form is "dirty" (name entered or file uploaded).
- [ ] Immediate cleanup called on Discard.
- [ ] Drawer reset state verified on second open.

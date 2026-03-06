# Stories: #739 Case Save UX Refinement

## Story: Disable Save Button when Data Upload Incomplete
**As a** Sustainability Manager
**I want** the "Save case" button to be inactive until I successfully upload my data template
**So that** I don't accidentally click save and encounter a silent failure or confusing state.

### Timeline & Effort
- **Estimated Time**: 2h
- **Actual Time**: 0.75h
- **Effort Points**: 3

### Acceptance Criteria
#### User Acceptance Criteria (UAC)
- [x] Given I am in the "Create new case" drawer, when I have the "Data upload" tab selected and no file is uploaded, then the "Save case" button must be disabled. (0.5h)
- [x] Given the "Save case" button is disabled due to missing upload, when I switch to the "Manual data input" tab, then the "Save case" button must immediately become enabled (unless no segments are defined). (0.25h)
- [x] Given the "Save case" button is disabled, when I hover over it, then a tooltip must appear saying: "Please upload a data template, or switch to 'Manual data input' and define at least one segment to save this case." (0.25h)
- [x] Given the "Save case" button is disabled, when I successfully upload a valid template, then the button must immediately become enabled. (0.5h)

#### Technical Acceptance Criteria (TAC)
- [x] Monitor both `import_id` and the current active tab in `CaseSettings.js`.
- [x] Lift/Propagate active tab state from `CaseForm.js` to `CaseSettings.js` (e.g., via `onTabChange` prop).
- [x] Define the `disabled` logic: `const isUploadMissing = activeTab === 'upload' && !importId;`.
- [x] Implement conditional `Tooltip` wrapping for the "Save case" button.

### Technical Notes
- Component: `frontend/src/pages/cases/components/CaseSettings.js`
- State: `import_id` from `CaseForm.js` via Ant Design Form instance.
- Coordination: Update `CaseForm` to accept an `onTabChange` callback to track `activeTab` in the parent `CaseSettings`.

---

## Story: Unsaved Changes Guard for Case Creation
**As a** Data Analyst
**I want** to be warned if I try to close the case creation drawer without saving my progress
**So that** I don't lose my entered name, description, and settings by accident.

### Timeline & Effort
- **Estimated Time**: 2h
- **Actual Time**: 0.75h
- **Effort Points**: 3

### Acceptance Criteria
#### User Acceptance Criteria (UAC)
- [x] Given I have entered data into the "Create new case" form, when I click the "Cancel" button or the "X" (Close) icon, then a confirmation modal must appear.
- [x] Given the confirmation modal is visible, when I click "Discard changes", then the drawer must close and all data must be reset.
- [x] Given the confirmation modal is visible, when I click "Keep editing", then the modal must close and the drawer must remain open with my data intact.
- [x] Given I have not modified any fields (clean form), when I click "Cancel" or "X", then the drawer must close immediately without a warning.

#### Technical Acceptance Criteria (TAC)
- [x] Use `form.isFieldsTouched()` to detect unsaved changes in `CaseSettings.js`.
- [x] Implement `Modal.confirm` from Ant Design in the `handleCancel` function.
- [x] Ensure the "Save case" success flow correctly resets the "dirty" state or bypasses the guard.

### Technical Notes
- Component: `frontend/src/pages/cases/components/CaseSettings.js`
- Logic: Integration with Ant Design `Form` and `Drawer` onClose/onCancel handlers.

### Definition of Done
- [x] Unit tests passing (if applicable - Lint pass)
- [x] Code reviewed
- [x] Documentation updated

# Feature: #739 Case Save UX & Data Upload Guard

## 1. Problem Statement
Users reported confusion and data loss during the case creation process. Specifically:
- Clicking "Save case" before uploading a required file results in "nothing happening" (silent failure or lack of feedback).
- Closing the drawer after a "failed" save leads to total loss of entered information.
- The "Save case" button is active even when required data upload is pending.

## 2. Requirements (Phase 1/2)

### 2.1 Save Button Intelligence
- [HIGH] The "Save case" button in the `CaseSettings` drawer should be **disabled** if:
    - The "Data upload" tab is active AND no file has been successfully uploaded (`import_id` is missing).
- [HIGH] The "Save case" button must be **enabled** if:
    - The "Manual data input" tab is active (regardless of upload status).
    - The "Data upload" tab is active AND a file has been successfully uploaded.
- [MED] provide a **tooltip** explaining why the button is disabled (e.g., "Please upload a data template, or switch to 'Manual data input' and define at least one segment to save this case").
- [HIGH] If "Manual data input" is selected, the button is enabled **only if** at least one segment is present (even if empty, as per current form defaults, but we should consider making it name-required).

### 2.2 Unsaved Changes Guard
- [HIGH] implement a **confirmation modal** when a user tries to close the `CaseSettings` drawer if the form is "dirty" (has unsaved changes).
- [MED] update the "Close" (X) and "Cancel" buttons to trigger this guard.

### 2.3 Visual Feedback
- [MED] Ensure that clicking "Save case" provides immediate visual feedback (loading state already exists, but success/error messages should be prominent).

- [x] **Immediate Cleanup**: Verified that selecting "Discard changes" triggers `DELETE /api/v1/case-import/{import_id}`.
- [x] **Periodic Cleanup**: Created `backend/scripts/cleanup_imports.py` with verbose logging and a `--force` flag for manual/scripted maintenance.
## 3. Analysis (Phase 2)
- **Frontend Component**: `CaseSettings.js` manages the drawer. It should trigger a cleanup call on "Discard".
- **Backend Lifecycle**:
    - **Immediate Cleanup**: `DELETE /api/v1/case-import/{import_id}` endpoint.
    - **Periodic Cleanup**: Background job to purge records where `expires_at < NOW()`.
- **Storage**: Files are in `/tmp/idc_case_imports`. Deletion removes both file and DB record.
- **Safety**: Cleanup skips `CaseImport` records linked to a finalized `Case`.

## 4. UX Specification (Phase 4)
- **Button State**: Secondary/Disabled style when `activeTab === 'upload' && !importId`.
- **Confirmation Modal**: Standard Ant Design `Modal.confirm` with "Discard changes" and "Keep editing".
- **Discard Behavior**: On "Discard", the `import_id` is sent to the backend for deletion while the UI resets.

## 5. Technical Constraints
- **Atomicity**: Best effort deletion for both storage and DB.
- **Environment**: Script must have permissions for `/tmp/idc_case_imports`.

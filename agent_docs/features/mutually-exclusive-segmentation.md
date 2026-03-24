# Feature Document: Mutually Exclusive Segmentation

## 1. Overview
Current implementation allows segments from "Manual data input" and "Data upload" to coexist in the same case. This results in the interface displaying more than the supported maximum of 5 segments and causes confusion about the source of truth for segmentation.

## 2. Requirements
- **Mutual Exclusivity**: A case can only have segments created via ONE method at a time.
- **Confirmation Guards**: Switching between "Manual" and "Upload" tabs must trigger a confirmation modal if the current method has segments.
- **Clear on Switch**: Confirming a switch to a new method will permanently remove all segments from the previous method.
- **Read-Only States**:
    - If segments exist via upload, the manual tab is read-only and directs the user to the upload tab.
    - If segments exist via manual, the upload tab (before a file is uploaded) indicates manual creation.
- **Consistency**: The UI must never show more than 5 segment headers.
- **Data Persistence & Re-upload**: Spreadsheets are NOT stored long-term post-save. To adjust thresholds on an existing "Upload" case, the user must re-upload the template to "Unlock" the calculation logic.

## 3. Technical Specification
### Frontend
- **State Management**:
    - `CaseForm.js`: Track `segmentation_source` (local/form state or persisted).
    - `handleTabChange`: Logic to intercept tab switches and show `Modal.confirm`.
- **Component Guarding**:
    - `SegmentForm.js`: Render a "Read-only" message if `segmentation_source === 'upload'`.
    - `SegmentConfigurationForm.js`:
        - If `uploadResult` is missing but `segments` exist (existing case), render the segments in a "limited" mode (names editable, "Adjust" disabled).
        - Show an Alert: "To adjust thresholds or recalculate counts, please upload your data template again."

### Backend
- **Database Schema**: Add `segmentation_source` (Enum: `manual`, `upload`) to the `Case` model.
- **CRUD Logic**: Ensure that when updating segments, we respect the source and don't allow "mixing".

## 4. User Journeys
### Switching from Manual to Upload
1. User adds 3 segments manually.
2. User clicks "Data upload" tab.
3. Confirmation Modal appears: "Switching to Data Upload will clear your manual segments. Continue?"
4. User clicks "Confirm".
5. Manual segments are cleared from form state. `segmentation_source` becomes `upload`.
6. User uploads file and proceeds with data upload segmentation.

### Switching from Upload to Manual
1. User has segments from a previous upload.
2. User clicks "Manual data input" tab.
3. Tab is Read-Only: "Segments were created via data upload. To edit, use the Data Upload tab."
4. (Optional) Provide a "Convert to Manual" button that clears the upload link/source and enables manual editing of farmer counts.

### Editing an Existing "Upload" Case
1. User opens a case where `segmentation_source === 'upload'`.
2. "Manual data input" tab is read-only.
3. "Data upload" tab displays existing segments. Names are editable.
4. "Adjust" (thresholds) and "Recalculate" buttons are disabled/hidden.
5. User uploads the original spreadsheet -> `uploadResult` is populated.
6. "Adjust" buttons become active for the session.

## 5. Timeline & Effort Estimation

| Phase | Activity | Estimated Effort |
| :--- | :--- | :--- |
| **Frontend** | Intercept tab switches, implement `Modal.confirm` guards, clear-on-confirm logic, and "Re-upload to Unlock" UI states. | 6 - 8 hours |
| **Backend** | Add `segmentation_source` to `Case` model, run migrations, and update CRUD `update_case` logic to enforce mutual exclusivity. | 2 - 4 hours |
| **Verification** | Unit tests for backend logic, sanity checks for session handling, and manual E2E verification of tab guards. | 2 hours |
| **Total** | | **10 - 14 hours** |

## 6. Definition of Done
- [x] Tab switches are guarded by confirmation modals.
- [x] Segments are cleared when switching and confirming.
- [x] UI never exceeds 5 segments.
- [x] Read-only state correctly identifies the source.
- [x] Backend persists the `segmentation_source`.
- [x] Editing an existing upload-based case handles the missing spreadsheet safely.

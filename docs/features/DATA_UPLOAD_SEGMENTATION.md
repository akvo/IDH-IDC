# Feature Specification: Data Upload & Segmentation Logic

This document consolidates all features related to automated segmentation and the spreadsheet-based data upload workflow.

---

## 1. Overview
The IDC platform supports two primary methods for farmer segmentation: **Manual data input** and **Data upload**. These methods are now mutually exclusive to ensure a single source of truth for calculations.

---

## 2. Mutually Exclusive Segmentation

To prevent UI confusion and calculation errors, a case can only utilize segments from ONE method at a time.

### Implementation Rules
*   **Tab Guards**: Switching between the "Manual" and "Upload" tabs triggers a `Modal.confirm` if the current method already has defined segments.
*   **Destructive Switch**: Confirming the switch permanently clears all segments from the previous method.
*   **Read-Only States**:
    *   If a case is "Upload-based", the Manual tab is restricted to read-only mode.
    *   A "Re-upload to Unlock" workflow is enforced for existing cases; since spreadsheets are not stored long-term, users must re-upload their template to adjust thresholds or recalculate counts.

---

## 3. Data Upload UI Refinement (#737)

The segmentation configuration interface has been refined to guide users through a logical order of operations.

### Order of Operations
1.  **Select Variable Type**: Users must first choose between "Categorical" or "Numerical" via a button-style toggle.
2.  **Select Variable**: The specific variable dropdown (e.g., "Gender", "Land Size") is disabled until a type is selected.
3.  **Specify Count**: For numerical variables, the user then defines the number of segments (max 5).

### Layout & Wording Updates (#744)
*   **Labels**: Updated to "Download required data template" and "Upload your validated data template" to emphasize the IDH standardized format.
*   **Tooltips**: Inlined help tooltips ("?") provide non-intrusive guidance on "Variable type" vs "Segmentation" definitions.
*   **Responsive Grid**: The layout uses a robust two-column Ant Design grid to prevent overflow on 1280x720 screens.

---

## 4. Technical Reference
*   **Frontend Logic**: `frontend/src/pages/cases/components/DataUploadSegmentForm.js`
*   **Confirmation Guards**: `frontend/src/pages/cases/CaseForm.js`
*   **Backend Model**: `segmentation_source` field in the `Case` model (Enum: `manual`, `upload`).

---

> [!IMPORTANT]
> The spreadsheet data is processed in the browser session and then used to populate the `Segment` and `SegmentAnswer` tables. The original `.csv/.xlsx` file is **not** persisted on the server after the import is completed.

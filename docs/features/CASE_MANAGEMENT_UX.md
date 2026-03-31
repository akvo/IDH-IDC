# Feature Specification: Case Management & UX Enhancements

This document summarizes user experience (UX) improvements related to creating, saving, and managing cases within the IDC platform.

---

## 1. Case Creation Flow

The case creation interface is split into two primary tabs: "Manual data input" and "Data upload".

### Tab-Aware Logic (#739)
The **"Save case"** button in the case creation drawer is dynamically enabled/disabled based on the active tab's requirements:
*   **Manual Tab**: Enabled if at least one segment is defined.
*   **Data Upload Tab**: Disabled until a valid data template has been uploaded and processed.
*   **Guidance Tooltip**: A tooltip explains why the button is disabled (e.g., "Please upload a data template to save this case").

---

## 2. Unsaved Changes Guard (#739)

To prevent accidental data loss during the multi-step case configuration process, a **confirmation guard** is implemented on the case creation drawer:
*   **Trigger**: Clicks on "Cancel", the "X" close button, or clicking outside the drawer.
*   **Logic**: If the form is "dirty" (fields have been modified) or a data template is currently being processed, a confirmation modal (`Modal.confirm`) appears.
*   **Action**: "Discard" clears the form and closes the drawer; "Cancel" returns the user to the form.

---

## 3. Data Cleanup & Integrity (#739)

### Immediate Discard Cleanup
If a user uploads a spreadsheet and subsequently clicks **"Discard"**, the backend immediately deletes the temporary `CaseImport` record and its related files to ensure data privacy and storage efficiency.

### Scheduled Maintenance
A standalone script (`backend/cleanup_imports.py`) is provided for administrative maintenance to purge expired or orphaned upload records that were not properly discarded.

---

## 4. UI Text & Terminology Updates (#744)

Standardized labels and tooltips have been updated throughout the application to align with business terminology:
*   **Feasibility Tooltip**: Updated in Step 2 to explain the 90th quantile calculation used to determine "Feasible" values from uploaded data.
*   **Step 5 Reference**: Changed "physically possible" to "possible" for professional consistency.
*   **Guidance Tooltips**: Dedicated "?" icons are provided in Step 1 for "Variable type" and "Number of segments".

---

## 5. Technical Reference
*   **Validation Logic**: `frontend/src/pages/cases/CaseForm.js`
*   **Cleanup Script**: `backend/cleanup_imports.py`
*   **UI Components**: Ant Design `Select`, `Tooltip`, and `Modal`.

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
*   **Feasibility Tooltip**: Updated in Step 2 to explain the 80th quantile calculation used to determine "Feasible" values from uploaded data.
*   **Step 5 Reference**: Changed "physically possible" to "possible" for professional consistency.
*   **Guidance Tooltips**: Dedicated "?" icons are provided in Step 1 for "Variable type" and "Number of segments".

---

## 5. Step 5 Collapsible Scenario Modeling Sections (#814)

To reduce excessive page scrolling and focus the analyst's workspace, all four primary sections in Step 5 (Scenario Modelling) are converted into styled collapsible panels:
*   **Section 1 ("Fill in values for your scenarios")**: Styled with light teal background (`#eaf2f2`) and top border (`#e9e9e9`). Chevron expand icons are teal (`#1b625f`). Includes "?" info tooltip and the "Add scenario" button located inline (with event propagation handled so it does not collapse the panel). Expanded by default.
*   **Section 2 ("Compare your scenarios")**: Wraps the scenario income gap comparison chart. Expanded by default.
*   **Section 3 ("Assess the impact of your investment")**: Wraps the ROI charts and tables. Expanded by default.
*   **Section 4 ("Better understand scenario outcomes for your segments")**: Wraps the segment comparison outcomes table, which is also styled with a bordered wrapper for premium aesthetics. Expanded by default.

---

## 6. Technical Reference
*   **Validation Logic**: `frontend/src/pages/cases/CaseForm.js`
*   **Scenario Modeling Parent**: `frontend/src/pages/cases/components/StandardScenarioModeling.js`
*   **Outcomes Table Component**: `frontend/src/pages/cases/visualizations/TableScenarioOutcomes.js`
*   **Styling Rules**: `frontend/src/pages/cases/steps/steps.scss`
*   **Cleanup Script**: `backend/cleanup_imports.py`
*   **UI Components**: Ant Design `Select`, `Tooltip`, `Collapse`, `Panel`, and `Modal`.

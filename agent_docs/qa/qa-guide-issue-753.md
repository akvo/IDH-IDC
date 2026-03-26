# QA Guide: Custom ROI Components (#753)

## Objective
Verify that users can add multiple "Other" investment components, give them custom names with character limits, and see them accurately reflected in ROI visualizations.

## Prerequisites
- User has permissions to edit a case (Internal or External Advanced).
- A case exists with at least one segment.

## Test Steps

### 1. ROI Table Interaction
1. Navigate to **Step 5: Closing the Gap**.
2. Expand the **Return on Investment** section for any segment.
3. In the investment breakdown table, click **Add Component**.
4. Select **Other** from the dropdown.
    - [x] Verify that an input box appears below the "Other" selection.
5. In the input box, type "Land rights assistance".
    - [x] Verify that character count shows `22 / 30`.
6. Try to type more than 30 characters.
    - [x] Verify that the input is truncated at 30 characters.

### 2. Multiple "Other" Selections
1. Click **Add Component** again.
2. Select **Other** again.
    - [x] Verify that "Other" is NOT disabled in the dropdown (unlike "Training" or "Financing").
3. Give the second "Other" a name: "Market provision".
4. Enter a cost (e.g., 50,000) for both entries.

### 3. Visualization Check
1. Scroll down to the **Impact of Investment** charts.
2. Select the **Scenario Cost by component** chart.
    - [x] Verify that "Land rights assistance" and "Market provision" appear as distinct legend items/bars.
    - [x] Verify that their respective colors are distinct.

### 4. Responsiveness
1. Resize the browser window to a narrower width (e.g., 1024px).
    - [x] Verify that the ROI breakdown table columns scale proportionally and labels do not overlap.

### 5. Persistence
1. Save the Case.
2. Refresh the page or reopen the case.
    - [x] Verify that the custom names ("Land rights assistance", etc.) are still present in the ROI table.

## Automated Checks
- [x] `yarn lint` passes.
- [x] `calculateScenarioROI` unit tests pass.

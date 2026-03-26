# UI QA Guide: ROI Cost Input Tweaks (#751)

## Objective
Verify the dynamic unit labels and alignment of the ROI cost input section in Step 5.

## Prerequisites
- User must be logged in as an Admin or Internal user (to access Step 5).
- An existing case with multiple segments and a scenario target should be open.

## Step-by-Step Verification

### 1. Dynamic Unit Label (Total Cost)
1.  Navigate to **Step 5 (Closing the Gap)**.
2.  Expand a scenario to see the **Scenario Modeling** section.
3.  Ensure "Yes, per segment" or "Yes, for all farmers" is selected for costing.
4.  Expand the **Total Cost** card.
5.  Change the **Total Cost unit** dropdown from "Total Cost" to **"Per farmer"**.
    - **Expected**: A label like `x 3,000 Farmers` (with the correct number for the segment) appears below the input box.
6.  Change the unit to **"Per land unit"**.
    - **Expected**: The label changes to `x Land Area`.
7.  Change it back to **"Total Cost"**.
    - **Expected**: The label disappears.

### 2. Layout Stability
1.  While toggling the units in Step 1, observe the "Total Cost:" label and the unit dropdown.
    - **Expected**: They should remain at the top of the row and not jump vertically when the label appears/disappears.

### 3. Investment Breakdown Table Alignment
1.  Add at least one cost component (e.g., Training).
2.  Look at the **"Total"** column on the right side of the table.
    - **Expected**: The "Total" header and the value boxes (readonly InputNumbers) are aligned to the **left**.

## Regression Check
- Ensure individual components' unit labels (below their cost inputs) still work as before.

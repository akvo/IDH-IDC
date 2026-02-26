# QA Guide: [Data Upload] Segmentation Variable Selection Order

## Overview
This guide covers the manual verification of the improved segmentation selection flow in Step 2.

## Test Environment
- UI: [localhost:3000](http://localhost:3000)
- Step: 2. Data Upload

## Test Cases

### TC-1: Initial State & Explanation
1. Navigate to Step 2.
2. Click **"Add segment based on a different variable"**.
3. **Verify**:
    - An Informational Alert is visible: "Segmentation allows you to group your results by a specific characteristic..."
    - The first field is "Variable type" with a `?` icon.
    - Hovering over the `?` icon shows "What type of variable do you want to use for segmentation?".
    - The "Select a variable to segment by:" dropdown is **disabled**.
    - The dropdown placeholder is "Select a variable type first".

### TC-2: Categorical Selection
1. Select **"Categorical"** in the Variable type.
2. **Verify**:
    - The "Select a variable to segment by:" dropdown is **enabled**.
    - The dropdown placeholder is "Select variable".
    - The dropdown only contains categorical variables from the uploaded file.
    - The "Number of Segments" input remains **disabled**.

### TC-3: Numerical Selection
1. Change the Variable type to **"Numerical"**.
2. **Verify**:
    - The "Select a variable to segment by:" dropdown is reset (empty).
    - The dropdown only contains numerical variables.
    - The **"Number of Segments"** input becomes **enabled**.

### TC-4: Functionality End-to-End
1. Select a numerical variable.
2. Enter "3" in "Number of Segments".
3. **Verify**:
    - Segments are automatically generated and displayed below the card.
    - Farmer counts are retrieved from the backend.

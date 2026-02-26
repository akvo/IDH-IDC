# QA Guide: [Data Upload] Segmentation UI Refinement

## Overview
This guide covers the manual verification of the improved segmentation selection flow in Step 2, focusing on the refined two-column layout and enforced selection order.

## Test Environment
- UI: [localhost:3000](http://localhost:3000)
- Step: 2. Data Upload

## Test Cases

### TC-1: Initial State & Guidance
1. Navigate to Step 2.
2. Click **"Add segment based on a different variable"**.
3. **Verify**:
    - The headers "Variable type" and "Segmentation" both have `?` icons (tooltips).
    - Hovering over "Variable type" shows: "What type of variable do you want to use for segmentation?".
    - Hovering over "Segmentation" shows: "Configure how you want to divide your data into segments.".
    - The "Select a variable to segment by:" dropdown is **disabled**.
    - The dropdown placeholder is "Select a variable type first".
    - **No informational alert** is displayed (replaced by tooltips).

### TC-2: Categorical Selection
1. Select **"Categorical"** in the Variable type toggle.
2. **Verify**:
    - The "Select a variable to segment by:" dropdown is **enabled**.
    - The dropdown placeholder is **"Select segmentation variable"**.
    - The dropdown only contains categorical variables.
    - The "Number of Segments" input remains **disabled**.

### TC-3: Numerical Selection
1. Change the Variable type to **"Numerical"**.
2. **Verify**:
    - The "Select a variable to segment by:" dropdown is reset (empty).
    - The dropdown placeholder is **"Select segmentation variable"**.
    - The dropdown only contains numerical variables.
    - The **"Number of Segments"** input becomes **enabled**.

### TC-4: Layout Fidelity
1. Verify that "Variable type" header and its toggle are on the same line, with the toggle floated to the right.
2. Verify that the "Segmentation" header is aligned in the right column.
3. Verify that all inputs are full-width and aligned within their respective columns.

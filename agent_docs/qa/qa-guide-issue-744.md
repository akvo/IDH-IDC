# UI QA Guide - Issue #744

## Objective
Verify that all text updates and UI refinements for #744 are correctly applied, readable, and do not cause layout regressions.

## Verification Steps

### 1. Data Upload UI (Step 1)
- **Path**: Open a case -> "Manual data input" -> "Data upload" tab.
- **Title**: Ensure it reads **"Upload your completed data template"**.
- **Subtitle**: Ensure it reads **"Download the template, enter your data, run the validation in Excel, and upload the validated file here."**
- **Spacing**: Verify there is clear spacing between the subtitle and the upload zone (no overlap).
- **Upload Zone**: Verify browse button and drag-and-drop text are clear.
- **Footer**: Ensure the upload box does not overlap with the bottom "Cancel / Save case" buttons.

### 2. Income Data (Step 2)
- **Path**: Open Step 2 "Enter Income Data".
- **Feasible Tooltip**: Hover over the `(i)` icon next to the "Feasible" label.
- **Content**: Verify the 90th quantile note is present.
- **Formatting**: Verify there is a clear line break between the general description and the quantile note.

### 3. Segmentation (Case Settings)
- **Path**: Click "Settings" (cog icon) -> "Configure segmentation".
- **Tooltip**: Hover over the `(i)` icon next to "Number of segments".
- **Content**: Verify it explains the grouping logic and potential edge cases correctly.

### 4. Advanced Modelling (Step 5)
- **Path**: Open Step 5 "Scenario Modelling".
- **Impossible Scenario**: Enter values that trigger an "impossible" warning (e.g., negative required values).
- **Text**: Ensure the warning says **"The scenario is not possible"** (the word "physically" should be removed).
- **Code Comments**: (Technical only) Verify `AdvancedModellingTool.js` comments match the new terminology.

## Success Criteria
- [ ] No grammar or spelling errors in new text.
- [ ] Tooltips are readable and properly formatted.
- [ ] No UI elements are overlapping or clipped (especially on 1280px resolution).

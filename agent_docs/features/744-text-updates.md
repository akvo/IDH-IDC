# Feature Document: Text Updates & Clarifications (06-03-2026)

## Overview
This document outlines a series of text updates and clarifications across the IDC application to improve user guidance, particularly in the Data Upload feature and modelling steps.

## Requirements

### 1. Data Upload UI Updates
- **Title Change**: Update "Upload your data" (or similar) to "Upload your completed data template".
- **Subtitle Addition**: Add "Download the template, enter your data, run the validation in Excel, and upload the validated file here."
- **Icon Label**: Update label under upload icon to "Select a .xlsm data template to upload".
- **Drag & Drop**: Ensure text says "Drag and drop your data file here or click to upload".

### 2. General Wording Refinements
- **Step 5**: Remove the word "physical" or "physically" from descriptions.

### 3. Step 2 "Feasible" Tooltip Clarification
- **Clarification Addition**: Add the following text to the "Feasible" (i) tooltip in Step 2:
    > "If you used the data upload function, the feasible values represent top-performing farmers in your dataset. They are based on the 90th quantile of each driver."

### 4. Segmentation UI
- **Help/Info Tooltip**: Add or update an info box by "Number of segments" input:
    > "Indicate the number of segments to create from the numerical variable. After selecting the number of segments, the tool groups farmers into roughly equal-sized segments. In some datasets this may lead to unexpected results, especially when the segmentation variable contains many zero, missing, or repeated values."

## Traceability
- Source: [Google Doc (06-03-2026)](https://docs.google.com/document/d/1t3R4TxdRq_P9irI-YngxzKl0uoA-pBGT0Gkm1vQr5OI/edit?usp=sharing)
- Related Issue: General UX Refinement

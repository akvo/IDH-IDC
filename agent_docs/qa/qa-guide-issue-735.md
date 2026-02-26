# QA Guide - Issue #735

## Overview
**Feature**: Refine Data Upload Wording
**Objective**: Verify clarity of labels and responsive layout at 1280x720.

## Preparation
1. Ensure the frontend is running locally.
2. Login as an Internal or External Advanced user.
3. Open a Case and navigate to Step 1 (or any step where "Manual data input" / "Data upload" tabs are visible).

## Manual Verification Steps

### 1. Label Wording
- [ ] Observe the button in the top right of the "Data upload" tab area. It should read: **"Download required data template"**.
- [ ] Select the **"Data upload"** tab.
- [ ] Observe the header above the drag-and-drop area. It should read: **"Upload your validated data template"**.

### 2. Responsive Layout (1280x720)
- [ ] Open Browser DevTools and set dimensions to **1280 x 720**.
- [ ] Verify the "Download required data template" button does not overlap the tab labels or overflow the card.
- [ ] Verify the "Upload your validated data template" header is fully visible and does not cause horizontal scrolling.

### 3. Functionality Check
- [ ] Click "Download required data template" and verify the file starts downloading.
- [ ] Drag a valid `.xlsm` file to the upload area and verify the upload process begins.

## Expected Results
- Labels are exactly as requested.
- UI remains clean and usable on 1280x720 screens.
- Core functionality (download/upload) is unaffected.

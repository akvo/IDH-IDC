# QA Guide: ROI Scenario-Segment Multi-Selector (#743)

## Overview
This guide provides step-by-step instructions for verifying the multi-selector refinement for the ROI chart in Step 5 (Scenario Modelling).

## Prerequisites
- User must have a case with at least one scenario and at least one segment defined.
- Investment analysis must be enabled for the scenario(s).

## Test Cases

### 1. Default Chart State
**Steps:**
1. Navigate to Step 5 (Scenario Modelling) and scroll to the "Impact of Investment" section.
2. Observe the "Return on Investment (%)" chart.
**Expected Result:**
- The chart should automatically display all modeled scenarios for "All Segments".
- The selector should be empty (placeholder: "Select Scenarios and Segments to compare").

### 2. Multi-Selection Logic
**Steps:**
1. Click the selector in the "Return on Investment" section.
2. Select any combination (e.g., "Scenario 1 - All Segments").
3. Select another combination (e.g., "Scenario 1 - Male Farmers").
**Expected Result:**
- The chart should update to show exactly two bars.
- Labels should match the selection: "Scenario 1 - All Segments" and "Scenario 1 - Male Farmers".
- Bars should have distinct colors.

### 3. Maximum Limit Enforcement
**Steps:**
1. Select 5 different combinations in the ROI selector.
2. Open the dropdown again.
**Expected Result:**
- All other non-selected options should be disabled (greyed out).
- Verify that a tooltip or standard Ant Design behavior prevents further selection.

### 4. Comparison Accuracy
**Steps:**
1. Select 3 combinations:
    - Scenario A - All Segments
    - Scenario A - Segment 1
    - Scenario B - Segment 1
2. Verify the ROI % values.
**Expected Result:**
- ROI % for "Scenario A - Segment 1" should match the value calculated previously (when single-select was active).
- Formula verification: `(Scenario Income - Baseline Income) / Total segment cost` (times number of farmers).

### 5. Responsiveness & UI
**Steps:**
1. Resize the browser window to 1280px and 768px.
2. Toggle between Scenario Modelling tabs.
**Expected Result:**
- The selector width should adjust to the container (100%).
- The chart should rescale properly within its card.
- No layout overflow or overlap between Row 1 and Row 2.

## Success Criteria
- [ ] ROI chart accurately displays multiple selected combinations.
- [ ] Selector limit (5) is strictly enforced.
- [ ] Default state provides an immediate "All Segments" overview.
- [ ] Bar labels are clear and concise.

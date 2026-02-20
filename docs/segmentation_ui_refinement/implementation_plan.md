# Segmentation UI and Flow Improvements

This task aims to improve the visibility of farmer counts per segment and refine the manual segment adjustment process to make it more intuitive and prioritized.

## User Review Required

> [!IMPORTANT]
> **Cascading Exclusivity**: As requested in the feedback, adjusting the **Maximum** of Segment N will automatically update the **Minimum** of Segment N+1. This ensures segments remain exclusive without manual entry for both sides.

> [!NOTE]
> **Scope Clarification**: This plan focuses strictly on the UI refinement (visibility, layout, and cascading boundaries). The separate technical issue of "Inverted Ranges" (Auto-Sorting) is documented in [docs/segmentation_fix/implementation_plan.md](file:///Users/galihpratama/Sites/IDH-IDC/docs/segmentation_fix/implementation_plan.md) and is considered out of scope for *this* UI task unless explicitly combined.

> [!NOTE]
> **Manual Preference**: I will move the "Add segment manually" button to be more prominent, suggesting it as the primary way to define segments if automatic generation isn't used.

## User Acceptance Criteria (UAC)

1.  **Enhanced Farmer Visibility**:
    *   Each segment card displays the farmer count in a prominent box.
    *   **Style**: IDC Green background (`#00605A`), white text, bold font.
    *   **Label**: `Number of Farmers: [Count]`.
2.  **Numerical Range Configuration UI**:
    *   Minimum and Maximum thresholds are displayed in two clearly labeled white boxes.
    *   An **"Adjust"** button (IDC Green) is placed next to these boxes.
    *   The thresholds are editable upon clicking "Adjust" or directly (as per existing logic, but with improved styling).
3.  **Segment Name Initialization**:
    *   New segments have blank names by default.
    *   Placeholder: `"Please specify the segment name"`.
4.  **Automatic Segment Exclusivity**:
    *   Modifying the **Maximum** of Segment N automatically updates the **Minimum** of Segment N+1 to match.
    *   This ensures segments remain exclusive and continuous without manual intervention for adjacent boundaries.
5.  **Prioritized Manual Flow**:
    *   The option to adjust segments manually is presented as the preferred/first method.

## Technical Acceptance Criteria (TAC)

1.  **Frontend Component Updates**:
    *   Modify `renderSegmentCard` in [DataUploadSegmentForm.js](file:///Users/galihpratama/Sites/IDH-IDC/frontend/src/pages/cases/components/DataUploadSegmentForm.js).
    *   Implement the horizontal layout: Name Input (left) | Farmer Card (middle-ish) | Range Boxes + Adjust Button (right).
    *   Update [SegmentConfigurationForm.js](file:///Users/galihpratama/Sites/IDH-IDC/frontend/src/pages/cases/components/SegmentConfigurationForm.js) to handle cascading range updates in `handleOnChangeFieldValue`.
2.  **Styling**:
    *   Define new utility classes in `steps.scss` for the "Farmer Card" and "Threshold Box" styles.
    *   Apply IDC branding colors: `$primary-color` (`#00605A`) for backgrounds and buttons.
3.  **Data Logic**:
    *   Ensure the `segments` array in the form state correctly initializes `name` to `null` or `""`.
    *   Implement boundary checks to prevent overlapping logic in the frontend before sending to the backend for recalculation.
4.  **Verification**:
    *   Verify cascading logic for at least 3 segments.
    *   Verify farmer count visibility across different screen sizes.

## Estimation

| Component | Task | Effort |
| :--- | :--- | :--- |
| **Frontend UI** | Refactoring `renderSegmentCard` layout and implementing new boxes. | 4h |
| **Logic** | Implementing cascading range updates and name initialization. | 2h |
| **Styling** | SCSS updates for IDC branding and alignment. | 2h |
| **Total** | | **8h (~1 Story Point)** |

## Proposed Changes

### [Frontend]

#### [MODIFY] [DataUploadSegmentForm.js](file:///Users/galihpratama/Sites/IDH-IDC/frontend/src/pages/cases/components/DataUploadSegmentForm.js)
- Update `renderSegmentCard` to use a horizontal layout.
- Add "Number of farmers" green box styling.
- Add Min/Max threshold boxes with "Adjust" button.

#### [MODIFY] [SegmentConfigurationForm.js](file:///Users/galihpratama/Sites/IDH-IDC/frontend/src/pages/cases/components/SegmentConfigurationForm.js)
- Update `handleOnChangeFieldValue` to implement cascading adjustment logic.

#### [MODIFY] [steps.scss](file:///Users/galihpratama/Sites/IDH-IDC/frontend/src/pages/cases/styles/steps.scss) (Assuming this is the location)
- Add styles for `.farmer-count-card` and `.threshold-box-container`.

## Verification Plan

### Automated Tests
- Run existing segmentation tests to ensure no regressions:
  `./dc.sh test backend/tests/test_unit_segmentation_strategy.py`

### Manual Verification
1.  Open segment configuration in Step 1.
2.  Select a numerical variable and set 3 segments.
3.  Verify the "Number of Farmers" is clearly visible in green.
4.  Adjust the Maximum of Segment 1.
5.  Verify Segment 2's Minimum updates automatically.
6.  Verify segment names are blank with the correct placeholder.

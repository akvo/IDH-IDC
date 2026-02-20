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

1.  **Enhanced Farmer Visibility**: [x]
    *   Each segment card displays the farmer count in a prominent box.
    *   **Style**: IDC Green background (`#00605A`), white text, bold font.
    *   **Label**: `Number of Farmers: [Count]`.
2.  **Segment Name Initialization**: [x]
    *   New segments have blank names by default for numerical variables.
    *   Placeholder: `"Please specify the segment name"`.
3.  **Numerical Range Configuration UI**: [x]
    *   Minimum and Maximum thresholds are displayed in two clearly labeled white boxes.
    *   An **"Adjust"** button (IDC Green) is placed next to these boxes.
    *   The thresholds are editable upon clicking "Adjust" or directly (as per existing logic, but with improved styling).
4.  **Bi-directional Segment Exclusivity**: [x]
    *   Modifying the **Maximum** of Segment N automatically updates the **Minimum** of Segment N+1.
    *   Modifying the **Minimum** of Segment N+1 automatically updates the **Maximum** of Segment N.
    *   This ensures segments remain exclusive and continuous regardless of which side is adjusted.
5.  **Prioritized Manual Flow**: [x]
    *   The option to adjust segments manually is presented as the preferred/first method.
6.  **Recalculation Trigger**: [x]
    *   Inputting values should not auto-trigger recalculation until "Adjust" is clicked.
7.  **Static Calculated Range Display**: [x]
    *   The "Segment range: X - Y" label should show the *calculated* range from the backend.
    *   It should NOT update when the user is typing into the Min or Max boxes.
    *   It should only update when the "Adjust" operation is completed and new backend data is received.

## Numerical Range Behavior: Manual Authority

To ensure the UI respects user intent exactly as discussed, we will adopt the **Manual Authority** model:

1.  **Ground Truth**: The values currently visible in the **Min** and **Max** input boxes are the only values used to filter data for a segment.
2.  **Recalculation**: When "Adjust" is clicked, the backend will count farmers where `Min < Value <= Max`.
3.  **Full Bi-directional Cascading**:
    *   **Backward**: Adjusting Segment N **Min** to `V` updates Segment N-1 **Max** to `V - offset`.
    *   **Forward**: Adjusting Segment N **Max** to `V` updates Segment N+1 **Min** to `V + offset`.
    *   *Note*: `offset` is constant at `0.01` for all numerical data types to ensure maximum mathematical precision and prevent data gaps.
4.  **Payload Synchronization**: Both `min` and `max` fields must be explicitly synchronized in the API payload to prevent stale values from overriding the new `value` (reversion bug).
5.  **No Reversion**: The backend must accept the provided `Min` and `Max` and return them as-is, rather than recalculating the `Min` based on a previous segment.

## Bug Fixes

### Answer Value Generation Fix
- [x] **Inclusive Lower Bound**: Modified `recalculate_numerical_segments` and `process_confirmed_segmentation` to use `>=` for the first segment of each variable. This ensures the minimum value (e.g., 0) is included and answer values are generated.

### Save Case React Crash Fix
- [ ] **Error Detail Stringification**: Update `CaseSettings.js` to handle `detail` objects (422 errors) from FastAPI, preventing React from crashing when an object is rendered as a child.
- [ ] **Payload Sanitization**: Ensure `min` and `max` are only sent as numbers for numerical segments. For categorical segments, these should be `null` to avoid Pydantic validation errors (422).

### UnboundLocalError Fix
- [x] **Scoping Fix**: Move `prev_seg_same_var` lookup outside the `if/else` block in `process_confirmed_segmentation.py` to ensure it is always defined before being referenced.

## Technical Acceptance Criteria (TAC)

1.  **Frontend Component Updates**:
    *   Modify `renderSegmentCard` in [DataUploadSegmentForm.js](file:///Users/galihpratama/Sites/IDH-IDC/frontend/src/pages/cases/components/DataUploadSegmentForm.js).
    *   Implement the horizontal layout for thresholds: Range Boxes + Adjust Button.
    *   Update [SegmentConfigurationForm.js](file:///Users/galihpratama/Sites/IDH-IDC/frontend/src/pages/cases/components/SegmentConfigurationForm.js) to handle both `min` and `max` cascading range updates in `handleOnChangeFieldValue`.
2.  **Styling**:
    *   Define new utility classes in `steps.scss` for the "Threshold Box" styles.
    *   Apply IDC branding colors: `$primary-color` (`#00605A`) for backgrounds and buttons.
3.  **Data Logic**:
    *   Ensure the `segments` array in the form state correctly initializes `name` to `null` or `""` for numerical variables.
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
- Update `renderSegmentCard` to include Min/Max threshold boxes with "Adjust" button.

#### [MODIFY] [SegmentConfigurationForm.js](file:///Users/galihpratama/Sites/IDH-IDC/frontend/src/pages/cases/components/SegmentConfigurationForm.js)
- Update `handleOnChangeFieldValue` to implement bi-directional cascading adjustment logic (Min updates previous Max).

#### [MODIFY] [steps.scss](file:///Users/galihpratama/Sites/IDH-IDC/frontend/src/pages/cases/styles/steps.scss)
- Add styles for `.threshold-box-container` and `.threshold-adjust-btn`.

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

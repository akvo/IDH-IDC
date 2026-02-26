# UI QA Guide - Issue #733

## Role Identification
- **Affected Roles**: All users with access to "Step 3: Understand Income Gap" (Admin, Internal, External Advanced, External Regular).
- **Scope**: Visualization of income gaps and driver distribution.

## Happy Path: Visual Confirmation
1. **Action**: Login and open an existing case with validated data.
2. **Action**: Navigate to **Step 3: Understand Income Gap**.
3. **Check**: Ensure the following three charts are visible and rendered with data:
    - **Income Gap**: A bar chart showing Actual Income vs. Benchmark.
    - **Compare Income Gap**: A visualization comparing the gap across different segments/scenarios.
    - **Income Driver Across Segments**: A chart showing how drivers vary between segments.
4. **Action**: Switch between different segments using the `SegmentSelector`.
5. **Check**: Verify that all three charts update correctly to reflect the selected segment's data.

## Edge Cases
1. **Missing Data**:
    - **Action**: Open a case with incomplete or unvalidated data.
    - **Check**: Verify that the charts display empty states or "No Data" indicators rather than crashing the page.
2. **Single Segment**:
    - **Action**: Open a case with only the "Total Population" segment.
    - **Check**: Verify "Income Driver Across Segments" handles the single-segment case gracefully (usually showing one data point).

## Acceptance Verification
- [ ] **Check**: Chart "Income Gap" renders at the top of the page.
- [ ] **Check**: Chart "Compare Income Gap" renders below the main gap chart.
- [ ] **Check**: Chart "Income Driver Across Segments" renders after the commodity income levels.
- [ ] **Check**: No console errors present during Step 3 navigation.

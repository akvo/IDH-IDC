# Implementation Plan: Fix Inverted Segment Ranges

Ensure that numerical segments are always processed and displayed in increasing order of their threshold values, preventing inverted ranges like "3.01 - 1.95".

## Expected Behavior

The system should automatically re-order segments by their threshold values to maintain logical range continuity.

### Before Fix (Current State)
If a user enters values out of order:
| Segment | Threshold | Calculated Range | Farmers |
| :--- | :--- | :--- | :--- |
| Segment 1 | 1.0 | 0.20 - 1.00 | 45 |
| Segment 2 | **3.0** | 1.01 - 3.00 | 92 |
| Segment 3 | **1.95** | **3.01 - 1.95** | **0** |

### After Fix (Expected Output)
The system re-sorts by value before calculating ranges:
| Segment | Threshold | Calculated Range | Farmers |
| :--- | :--- | :--- | :--- |
| Segment 1 | 1.0 | 0.20 - 1.00 | 45 |
| Segment 2 | **1.95** | 1.01 - 1.95 | ... |
| Segment 3 | **3.0** | 1.96 - 3.00 | ... |

## Proposed Changes

### Backend
Modified `backend/utils/case_import_processing.py` to sort segments by `value` instead of `index` during recalculation.

### Frontend
Modified `frontend/src/pages/cases/components/SegmentConfigurationForm.js` to re-order the UI list whenever a threshold is changed.

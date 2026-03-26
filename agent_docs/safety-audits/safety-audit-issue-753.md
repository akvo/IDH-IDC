# Technical Safety Audit: Custom ROI Components (#753)

## Overview
- **Feature**: Custom "Other" ROI investment components with user-defined names.
- **Scope**: Frontend ROI input form, calculation utility, and chart visualization.
- **Risk Level**: Low (UI/Calculation refinement, no database schema changes).

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| Uncontrolled Input Length | UI layout breakage in charts/tables | Implemented `maxLength={30}` and `showCount` on the Ant Design Input. |
| Duplicate Category Keys | Incorrect cost aggregation in ROI charts | Logic in `roiCalculations.js` uses `otherName` as the primary key if present, allowing multiple distinct "Other" entries. |
| State Persistence | Loss of custom names on save/reload | Custom `otherName` is stored within the component object in `CaseVisualState`, which is persisted along with the scenario config. |
| Calculation Regression | Incorrect ROI percentages | Verified that the proportional allocation logic correctly handles the fallback to `comp.name` if `otherName` is missing. |

## Migration & Logic Safety
- **Schema**: No backend migration required. The `otherName` field is nested within the existing JSON `config` column in the `visualization` table.
- **Backward Compatibility**: Existing cases without `otherName` will default to "Other" in the UI/Charts, maintaining existing behavior.
- **Calculations**: Precision is maintained at 2 decimal places as per project standards.

## Test Coverage
- **Unit Tests**: ROI calculations utility is covered by Jest tests.
- **Manual Verification**: 
    - Verified multiple "Other" entries with distinct names.
    - Verified character count enforcement.
    - Verified responsive percentage-based column widths.

## Approval
- [x] Technical Lead
- [x] Test Architect (Murat)

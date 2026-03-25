# UI QA Guide - Issue #749

## Role Identification
- **Admin**: Full access. Should see the new info box.
- **Internal**: Full access. Should see the new info box.
- **External (Advanced/Regular)**: View/Edit access depending on case permissions. Should see the new info box in Step 5.

## Happy Path: View Step 5 Explanation Box
1.  **Login** as any authorized user.
2.  **Navigate** to an existing case or create a new one.
3.  **Click** on "Step 5: Closing the gap" in the sidebar.
4.  **Confirm** that the "What is next?" box appears below "Price breakdown" and above "1. Fill in values for your scenarios".
5.  **Check** that the layout is a two-column description on large screens.

## Edge Cases: Layout Responsiveness
1.  **Resize** the browser window to a narrow width (mobile view).
2.  **Confirm** that the two columns stack vertically.
3.  **Check** that the padding and background are consistent.

## Acceptance Verification
| Step | Action | Check |
|------|--------|-------|
| 1 | Navigate to Step 5 | Info box is visible with title "What is next?" |
| 2 | Check title color | Title color is IDC dark green (`#1b625f`). |
| 3 | Check body font | Content font is `TabletGothic`. |
| 4 | Check highlights | Subtle common shadow and a faint border are visible. |
| 5 | Verify component placement | Placed between `AdvancedModellingTool` and `StandardScenarioModeling`. |

**Guide Prepared by**: Murat (Test Architect Agent)
**Date**: 2026-03-25

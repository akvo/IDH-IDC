# STORY-743-4: Per-Segment ROI Breakdown (Tabs)

## Description
As a premium user, I want to define different investment costs for different segments within a scenario, so that I can perform more accurate ROI analysis for targeted interventions.

## User Acceptance Criteria (UAC)
- [ ] A "**Per segment**" toggle exists in the ROI breakdown section.
- [ ] When enabled, a `Tabs` interface appears, allowing the user to select a specific segment.
- [ ] Each segment tab has its own independent list of ROI components (Training, etc.).
- [ ] Switching between segments preserves the data for each segment.
- [ ] The top-level "**Total investment cost**" field displays the sum of ALL costs across ALL segments.
- [ ] The top-level field remains read-only and shows a lock icon when per-segment mode is active.

## Technical Acceptance Criteria (TAC)
- [ ] Update `CaseVisualState` schema to store `components` keyed by `segment_id` (or use a nested structure).
- [ ] If `is_per_segment` is FALSE, the system uses the `default` component list (case-wide).
- [ ] If `is_per_segment` is TRUE, the system initializes/retrieves components from the secondary segment-keyed storage.
- [ ] Implement `activeRoiSegmentId` in `CaseUIState` to track the current tab.
- [ ] Ensure `onAddComponent`, `onComponentChange`, and `onDeleteComponent` are segment-aware.

## Timeline & Effort
- **Estimation**: 4 hours
- **Priority**: HIGH
- **Definition of Done**: UI implemented, state synchronized, and manual verification of segment isolation.

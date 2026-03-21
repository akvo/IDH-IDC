# STORY-743-4: Per-Segment ROI (Nested in Tabs)

## Description
As a premium user, I want the investment cost form to be integrated within the segment-specific modelling tabs, so that I can easily enter costs for targeted interventions while modelling drivers for that specific segment.

## User Acceptance Criteria (UAC)
- [ ] The ROI Breakdown form appears at the bottom of the active **Segment Tab**.
- [ ] Switching between Segment 1 and Segment 2 correctly isolates and loads the respective cost components.
- [ ] Multipliers (e.g., `x 100 Farmers`) correctly use the current segment's population.
- [ ] The scenario's aggregate investment cost is automatically calculated from all segment contributions.

## Technical Acceptance Criteria (TAC)
- [ ] Relocate `ScenarioModelingROIForm` inside the `SegmentTabsWrapper` rendering loop.
- [ ] Use the `segment.id` prop to partition state within `CaseVisualState`.
- [ ] Update `CaseVisualState` schema to store `components` keyed by `segment_id` (or use a nested structure).
- [ ] If `is_per_segment` is FALSE, the system uses the `default` component list (case-wide).
- [ ] If `is_per_segment` is TRUE, the system initializes/retrieves components from the secondary segment-keyed storage.
- [ ] Implement `activeRoiSegmentId` in `CaseUIState` to track the current tab.
- [ ] Ensure `onAddComponent`, `onComponentChange`, and `onDeleteComponent` are segment-aware.

## Timeline & Effort
- **Estimation**: 4 hours
- **Priority**: HIGH
- **Definition of Done**: UI implemented, state synchronized, and manual verification of segment isolation.

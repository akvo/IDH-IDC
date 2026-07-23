# Feature Specification: Segment Consistency in Step 5 Visualizations (#820)

## 📊 Overview

### Purpose
Resolve a data inconsistency where old, renamed, or deleted segments appear in Step 5 (Closing the Gap) visualizations — and the "Hidden:" alert shows incorrect segment names — after segments have been edited in Step 1 (Set an Income Target).

### Key Principle
**The `segment` table is the single source of truth.** The JSONB `visualization.config` is a derived, saved snapshot. On every load, in-memory scenario values must be reconciled against the live segment table before rendering any chart or table.

### User Experience
A user edits their segments in Step 1 (adding, renaming, or deleting a farmer segment), saves, then navigates to Step 5. They should see:
- Only the **current, active segments** — no ghost entries from deleted segments.
- Segments displayed **in the same left-to-right order** as the tabs on the input pages.
- The **"Hidden:" alert accurately reflecting** which segments are excluded from the chart.
- Previously configured scenario driver inputs **preserved for unchanged segments**.

---

## 🎯 Design Principles
- **Segment table as source of truth**: All segment name, identity, and ordering decisions derive from `currentCase.segments[]` (fetched from `GET /case/:id`).
- **Reconcile, don't replace**: Existing `scenarioValues` (driver inputs, ROI data) are preserved where the segment still exists; only orphaned entries (deleted segments) are discarded.
- **Frontend-only fix**: No backend changes or DB migrations. The JSONB config format is unchanged; reconciliation happens in memory at render time.
- **Silent discard of orphaned data**: When a segment is deleted, its associated scenario driver inputs are quietly removed on next load.

---

## 📐 Architecture Design

### Root Cause

The `visualization.config` JSONB is a snapshot that becomes stale when segments are edited. The reconciliation in `StandardScenarioModeling.js` is incomplete — it only attaches `currentSegmentValue` to existing entries, but does NOT:
1. Purge stale entries for deleted segments
2. Add entries for newly created segments
3. Correct segment names from the live DB
4. Order entries to match `currentCase.segments` order

### Three Observed Bugs

| # | Symptom | Root Cause |
|---|---------|------------|
| 1 | Old/deleted segments appear in chart | Stale entries never purged from `scenarioValues` |
| 2 | Wrong bar order in chart vs. tabs | Old `segmentId` values survive, breaking relative order |
| 3 | "Hidden:" alert lists wrong names | `ChartSegmentsIncomeGapScenarioModeling` falls back to stale `sv.name` string |

### Data Flow — Current (Buggy)

```
Case.js: GET /case/:id
  → CurrentCaseState.segments  ← live, authoritative

Case.js: GET /visualization/case/:id
  → CaseVisualState.scenarioModeling  ← JSONB snapshot
      scenarioData[].scenarioValues[]  ← may contain stale/deleted segmentIds & names

StandardScenarioModeling useEffect([dashboardData])
  → Partial reconcile: only attaches currentSegmentValue to existing sv entries
  → Does NOT purge deleted segment entries
  → Does NOT add entries for new segments

ChartSegmentsIncomeGapScenarioModeling useMemo
  → scenarioValues.map(sv => find segment by sv.segmentId)
  → If not found: FALLS BACK to sv.name  ← stale string = ghost segment in chart
```

### Data Flow — Fixed (Target)

```
StandardScenarioModeling useEffect([dashboardData, currentCase.segments])
  → FULL reconcile: iterate currentCase.segments as outer loop
      For each liveSeg:
        - If matching scenarioValue exists → preserve driver inputs, update name + currentSegmentValue
        - If no match → create fresh empty entry
      Deleted segment entries → excluded automatically (not in currentCase.segments)

ChartSegmentsIncomeGapScenarioModeling useMemo
  → Filter scenarioValues: keep only entries where segmentId ∈ currentCase.segments
  → Always resolve name from currentCase.segments — no fallback to sv.name
```

### Data Structure — `scenarioValues` Entry

```javascript
// Each entry in scenarioData[].scenarioValues[]
{
  segmentId: number,               // FK to segment.id — the authoritative key
  name: string,                    // MUST derive from currentCase.segments (not persisted)
  selectedDrivers: [],             // User-configured driver choices — PRESERVED for valid segments
  allNewValues: {},                // Form field snapshot — PRESERVED for valid segments
  currentSegmentValue: {},         // dashboardData entry — always refreshed on load
  updatedSegmentScenarioValue: {}, // Computed scenario output — always refreshed
  updatedSegment: {},              // Calculation intermediate state — always refreshed
}
```

---

## ✅ Acceptance Criteria

### User Acceptance Criteria (User AC)
- [ ] After deleting a segment in Step 1 and navigating to Step 5, the deleted segment does NOT appear in any chart, table, or label.
- [ ] After renaming a segment in Step 1 and navigating to Step 5, the new name appears everywhere — charts, labels, tabs, and the "Hidden:" alert.
- [ ] The bar order in the Step 5 "Optimal driver values" chart matches the tab order on the Step 2 "Enter your income data" page.
- [ ] The "Hidden:" alert text lists exactly and only the segments truly excluded from the chart (income decreased) — no extras, none missing.
- [ ] After adding a new segment and uploading income data, the segment appears in Step 5 charts immediately upon navigating to Step 5.
- [ ] For segments that were NOT deleted or added, previously configured driver change values in Step 5 remain intact after returning from Step 1.

### Technical Acceptance Criteria (Tech AC)
- [ ] `StandardScenarioModeling.js`: The `useEffect` iterates over `currentCase.segments` (not `scenarioValues`) as the outer loop to produce the reconciled list.
- [ ] `ChartSegmentsIncomeGapScenarioModeling.js`: All `scenarioValues` entries with a `segmentId` absent from `currentCase.segments` are filtered out before chart data generation. `sv.name` fallback is removed.
- [ ] Segment ordering in reconciled `scenarioValues` matches the order of `currentCase.segments[]` (ordered by `id`, consistent with `SegmentTabsWrapper.js` pattern).
- [ ] No backend changes or DB schema changes.
- [ ] `yarn lint` passes with zero errors introduced by this change.
- [ ] `yarn test:ci` passes with zero new failures.

---

## 🔧 Implementation Details

### Files to Modify

| File | Change Type | Purpose |
|------|-------------|---------|
| `frontend/src/pages/cases/components/StandardScenarioModeling.js` | Modify | Primary fix — full reconciliation on load |
| `frontend/src/pages/cases/visualizations/ChartSegmentsIncomeGapScenarioModeling.js` | Modify | Defensive fix — filter stale + always use live name |

### Phase 1: Primary Fix — `StandardScenarioModeling.js`

Rewrite the body of the `useEffect([dashboardData])` hook (currently lines ~105–159) to iterate over `currentCase.segments` as the outer loop:

```javascript
// KEY CHANGE: iterate over currentCase.segments (source of truth),
// not scenarioValues (which may be stale)
const reconciledValues = currentCase.segments.map((liveSeg) => {
  const existing = scenario.scenarioValues?.find(
    (sv) => sv.segmentId === liveSeg.id
  );
  const dashData = dashboardData.find((d) => d.id === liveSeg.id) || {};

  if (existing) {
    // Segment still exists — preserve all user-configured driver inputs,
    // but always correct the name and refresh computed values
    return {
      ...existing,
      name: liveSeg.name,            // Always use live name from segment table
      currentSegmentValue: dashData, // Always fresh
    };
  }

  // Segment is new (no existing entry) — create a fresh, empty entry
  return {
    name: liveSeg.name,
    segmentId: liveSeg.id,
    selectedDrivers: [],
    allNewValues: {},
    currentSegmentValue: dashData,
    updatedSegmentScenarioValue: dashData,
    updatedSegment: {},
  };
  // Entries for deleted segments are automatically excluded —
  // they are not in currentCase.segments so they never appear in reconciledValues
});
```

- [ ] Replace the current `map` over `scenario.scenarioValues` with `map` over `currentCase.segments`
- [ ] Add `currentCase.segments` to the `useEffect` dependency array
- [ ] Retain the `isEqual` guard to prevent unnecessary state updates and re-renders

### Phase 2: Defensive Fix — `ChartSegmentsIncomeGapScenarioModeling.js`

Update the `useMemo` hook (lines ~85–115) to filter stale entries before any chart data generation:

```javascript
// Build a Set of valid segmentIds from live segments
const liveSegmentIds = new Set(
  (currentCase?.segments || []).map((s) => s.id)
);

// Filter out stale entries; always resolve name from live segment
const validScenarioValues = (currentScenarioData?.scenarioValues || [])
  .filter((sv) => liveSegmentIds.has(sv.segmentId))
  .map((sv) => {
    const liveSeg = currentCase.segments.find((s) => s.id === sv.segmentId);
    return { ...sv, name: liveSeg.name }; // No stale name fallback
  });

// Use validScenarioValues for both filteredValues and hiddenSegmentNames
const filteredValues = validScenarioValues.filter((sv) => {
  const current = sv.currentSegmentValue?.total_current_income || 0;
  const updated = sv.updatedSegmentScenarioValue?.total_current_income || 0;
  return updated >= current;
});

const hiddenSegmentNames = validScenarioValues
  .filter((sv) => {
    const current = sv.currentSegmentValue?.total_current_income || 0;
    const updated = sv.updatedSegmentScenarioValue?.total_current_income || 0;
    return updated < current;
  })
  .map((sv) => sv.name);
```

- [ ] Replace existing `scenarioValues` mapping with `validScenarioValues` (filtered + live name)
- [ ] Remove the `|| sv.name` fallback entirely
- [ ] Use `validScenarioValues` as the basis for both `filteredValues` and `hiddenSegmentNames`

---

## 📡 API Reference

No API changes required. Existing endpoints are used unchanged:
- `GET /case/:id` → provides authoritative `segments[]` — **the single source of truth**
- `GET /visualization/case/:id` → provides JSONB config (reconciled in memory at render time)
- `PUT /segment` → updates segment table (called from Step 1 — no change needed)
- `POST /visualization` → save endpoint, JSONB format unchanged

---

## ✅ Implementation Checklist
- [ ] `StandardScenarioModeling.js` — full reconciliation in `useEffect([dashboardData])`
- [ ] `ChartSegmentsIncomeGapScenarioModeling.js` — filter + live name, no stale fallback
- [ ] `yarn lint` passes with no new issues
- [ ] `yarn test:ci` passes with no new failures
- [ ] All 5 manual QA scenarios verified in browser
- [ ] `docs/LLD.md` updated to note the segment-table-as-source-of-truth pattern
- [ ] `agent_docs/sprint-plan.md` status updated

---

## 📊 Example Scenarios

### Scenario 1: Deleted Segment (Bug #1 — Ghost Segment)
- **Setup**: Case with 4 segments: Visionary, Pragmatics, Sceptics, Traditionalist. User deletes "Traditionalist" in Step 1, saves, navigates to Step 5.
- **Expected**: Chart shows exactly 3 bars — Visionary, Pragmatics, Sceptics. "Traditionalist" does not appear in any chart, label, or "Hidden:" alert.

### Scenario 2: Renamed Segment
- **Setup**: A segment previously named "Skeptical" is renamed to "Sceptics" in Step 1, saved, and user navigates to Step 5.
- **Expected**: All charts, tabs, and alerts show "Sceptics". The name "Skeptical" does not appear anywhere.

### Scenario 3: Correct Bar Ordering (Bug #2 — Wrong Order)
- **Setup**: Step 2 tab order is: Visionary → Pragmatics → Sceptics → Traditionalist.
- **Expected**: Step 5 "Optimal driver values" chart bars appear in exactly the same left-to-right order.

### Scenario 4: Accurate "Hidden:" Alert (Bug #3 — Wrong Label)
- **Setup**: A scenario where only Pragmatics has an income decrease; Visionary, Sceptics, and Traditionalist all improve.
- **Expected**: Chart shows 3 bars (Visionary, Sceptics, Traditionalist). Alert reads: `Hidden: Pragmatics`. No other names appear in the alert.

### Scenario 5: Driver Inputs Preserved
- **Setup**: Volume +20% and Cost of Production +5% are configured for Scenario 1, Visionary segment. User then renames "Traditionalist" → "Traditional" in Step 1 and returns to Step 5.
- **Expected**: Volume +20% and Cost of Production +5% inputs for Visionary are still present and unchanged in Scenario 1.

---

## 🔮 Future Enhancements
- Consider a non-blocking toast notification when stale segment data is auto-corrected on load, so users are aware the configuration was updated automatically.
- Explore persisting the reconciled `scenarioValues` back to the DB on the next save, to avoid repeated reconciliation on each page load.

# ADR 008: Proportional Scenario Cost Allocation

## Status
Proposed

## Context
The "Impact of Investment" feature currently supports only per-segment cost inputs. However, users often have cost data for a whole scenario (all farmers) and need it proportionally allocated to segments based on farmer headcount. We also need to simplify the ROI onboarding by providing a "No" (disabled) option within the same selector.

## Decision
We will implement an explicit `cost_allocation_mode` property within the ROI scenario configuration.

1.  **State Schema**:
    - Add `cost_allocation_mode: "no" | "all_farmers" | "per_segment"` to the scenario-specific configuration.
    - If `all_farmers`, costs will be stored in a shared `all_farmers_config` object within the scenario.
    - If `per_segment`, costs remain in the existing `segments[segmentId]` map.

2.  **Calculation Logic**:
    - In `all_farmers` mode:
        - `Segment Cost = Total Scenario Cost * (Segment Farmers / Total Case Farmers)`.
        - Per-farmer/Per-land units will also use shared costs but apply segment-specific multipliers.
    - `totalFarmers` will be calculated as the sum of `number_of_farmers` across all segments defined in the case.

3.  **UI Synchronization**:
    - The ROI segment selector will be bidirectional: changing the segment in ROI will update the top-level Step 3 tabs, and vice versa. This ensures context clarity when in `per_segment` mode.

## Consequences
- **Pros**:
    - Reduces data entry burden for case-wide interventions.
    - Provides a clearer "Off" state via the "No" option.
    - Maintains data isolation for granular users.
- **Cons**:
    - Adds slightly more complexity to the frontend calculation utility (`roiCalculations.js`).
    - Requires robust state synchronization across components.

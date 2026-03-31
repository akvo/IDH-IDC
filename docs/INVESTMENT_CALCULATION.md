# Impact of Investment: Calculation Specification

This document defines the logic for calculating scenario costs and the "Impact of Investment" (ROI) KPI for farmer segments.

## 1. Scenario Cost Calculation

The `total_cost_segment` is the cost of implementing a scenario for a specific farmer segment.

### 1.1 "All Farmers" Mode
Cost is defined once for the entire case and then distributed among segments.

| Allocation Mode | Input Type | Calculation per Segment |
|-----------------|------------|-------------------------|
| **Total Cost** | Total | `total_cost * (segment_farmers / total_farmers)` |
| **Total Cost** | Per Farmer | `cost_per_farmer * segment_farmers` |
| **Total Cost** | Per Land Unit | `cost_per_land_unit * segment_farmers * segment_land_area` |
| **Component Cost** | Total | `sum(component_costs) * (segment_farmers / total_farmers)` |
| **Component Cost** | Per Farmer | `sum(comp_cost_per_farmer * segment_farmers)` |
| **Component Cost** | Per Land Unit | `sum(comp_cost_per_land_unit * segment_farmers * segment_land_area)` |

### 1.2 "Per Segment" Mode
Cost is defined independently for each segment.

| Allocation Mode | Input Type | Calculation per Segment |
|-----------------|------------|-------------------------|
| **Total Cost** | Total | `total_cost_segment` (explicitly provided) |
| **Total Cost** | Per Farmer | `cost_per_farmer_segment * segment_farmers` |
| **Total Cost** | Per Land Unit | `cost_per_land_unit_segment * segment_farmers * segment_land_area` |
| **Component Cost** | Total | `sum(component_costs_segment)` |
| **Component Cost** | Per Farmer | `sum(comp_cost_per_farmer_segment * segment_farmers)` |
| **Component Cost** | Per Land Unit | `sum(comp_cost_per_land_unit_segment * segment_farmers * segment_land_area)` |

---

## 2. ROI & Impact Metrics

### 2.1 Income Metrics
- `income_increase` = `scenario_net_income - baseline_net_income`
- `income_increase_percentage` = `income_increase / baseline_net_income * 100`

### 2.2 Impact of Investment
`impact_of_investment = income_increase_percentage / total_cost_segment * 100`

**Note**: All input values and results should adhere to strict 2-decimal precision for visual consistency.

# Visualization Config Schema Documentation

This document describes the structure of the `config` JSONB column in the `visualization` table for different tabs. It serves as a reference for developers to maintain backward compatibility.

## Tab: `sensitivity_analysis` (Step 4)

Used in `AssessImpactMitigationStrategies.js`.

### Schema Structure (Dynamic Key Patterns)
Step 4 uses dynamic keys prefixed with the `segment_id` (e.g., `123_x-axis-driver`).

| Feature | Key Pattern | Description |
|---------|-------------|-------------|
| **Two Driver Heatmap** | `{id}_x-axis-driver` | Name of the selected X driver |
| | `{id}_y-axis-driver` | Name of the selected Y driver |
| | `{id}_x-axis-min-value` | Min boundary for X |
| | `{id}_x-axis-max-value` | Max boundary for X |
| | `{id}_y-axis-min-value` | Min boundary for Y |
| | `{id}_y-axis-max-value` | Max boundary for Y |
| **Line Chart (Binning)** | `{id}_binning-driver-name` | Name of the driver used for binning (lines) |
| | `{id}_binning-value-{index}` | Explicit values for each binning line |
| | `{id}_adjusted-target` | Custom income target for this segment's analysis |
| **Three Driver Calc** | `{id}_third-driver` | Name of the selected third driver |
| **Optimization Model**| `optimizationModel` | Nested object containing model state (see below) |

### `optimizationModel` Structure
This nested object stores the results and state of the Step 4 optimization model.

```json
{
  "selectedDrivers": {
    "{id}_selected-drivers": string[]
  },
  "increaseValues": {
    "{id}_percentage-increase-{index}": number,
    "{id}_absolute-increase-{index}": number
  },
  "optimizationResult": {
    "{id}_optimized": object // Backend response from /optimize/run-model
  }
}
```

> [!NOTE]
> All other Step 4 keys are stored directly at the root of the `config` object for the `sensitivity_analysis` tab.

---

## Tab: `scenario_modeling` (Step 5)

Used in `ClosingGap.js`, `AdvancedModellingTool.js`, and `ScenarioModelingIncomeDriversAndChart.js`.

### Core Keys

| Key | Type | Description |
|-----|------|-------------|
| `scenarioData` | Array | Stores data for standard scenarios (Scenario 1, Scenario 2, etc.) |
| `advancedModeling` | Object | Stores data for the high-fidelity Advanced Modelling Tool |
| `percentage` | number | Default percentage change if not specified in scenarioData |
| `investment_analysis` | Object | **[NEW]** Stores costs and ROI data for the Impact of Investment feature |

### `scenarioData` Structure
```json
[
  {
    "key": "scenario-1",
    "percentage": boolean,
    "scenarioValues": [
      {
        "segmentId": number,
        "selectedDrivers": [
          { "field": string, "value": string }
        ],
        "allNewValues": {
          "absolute-scenario-1-SEGMENTID-0": number,
          "percentage-scenario-1-SEGMENTID-0": number,
          "driver-scenario-1-SEGMENTID-0": string
        }
      }
    ]
  }
]
```

### `advancedModeling` Structure
```json
{
  "selectedSegmentId": number,
  "segmentData": {
    "SEGMENT_ID": {
      "selectedDriver": string, // e.g., "cop", "price"
      "activeScenario": "model" | "feasible" | "current",
      "lockedFields": {
        "price": boolean,
        "volume": boolean,
        "land": boolean,
        "cop": boolean,
        "odi": boolean,
        "secondary": boolean,
        "tertiary": boolean
      },
      "modelValues": {
        "price": number,
        "volume": number,
        "cop": number,
        "land": number,
        "odi": number,
        "secondary": number,
        "tertiary": number
      },
      "calculationResults": {
        "current": { "value": number, "change": number, "cost": number, "profit": number, ... },
        "feasible": { ... },
        "model": { ... }
      }
    }
  }
}
```

### `investment_analysis` Structure (Premium Feature)
```json
{
  "is_enabled": boolean,
  "scenarios": {
    "scenario_id": {
      "investment_cost": number,
      "cost_unit": "total" | "per_farmer" | "per_land_unit",
      "distribution": "proportionate" | "manual",
      "manual_allocations": {
        "segment_id": number
      }
    }
  },
  "metadata": {
    "currency": string,
    "last_updated": string
  }
}
```

## Backward Compatibility Rules
1. **Never delete** existing keys in the `config` root unless a migration script is provided.
2. **Always use optional chaining** and nullish coalescing when reading these values in React.
3. **Pydantic Validation** should always allow for extra fields (`Extra.allow`) to avoid crashing when the frontend adds new UI state values that aren't yet in the schema.

# ADR 005: Impact of Investment Architecture

## Status
Accepted

## Context
The "Impact of Investment" feature requires users to input costs for various scenarios to calculate ROI/Impact per dollar. The current IDC architecture uses a "Visualization" table with a JSONB `config` field for Step 5 modelling, where calculations are handled primarily on the frontend for real-time responsiveness.

## Decision
We will adopt **Option A (Frontend-Heavy)** with a **Standardized JSON Schema** for persistence.

1.  **Calculations**: All "Impact per $" and cost distribution logic will reside in the React frontend to ensure zero-latency UI updates during modelling.
2.  **Persistence**: Data will be stored in the existing `visualization.config` field using a strictly defined nested object structure (`investment_analysis`).
3.  **Validation**: The FastAPI backend will implement a Pydantic model to validate the `investment_analysis` object upon save, ensuring data types (numbers, specific enums) are correct even though the logic remains on the frontend.
4.  **Reporting**: By standardizing the JSON format, backend reporting tools (PDF/Excel) will be able to parse and display these values consistently in the future.

## Consequences
- **Pros**: Maintains high UI performance; follows existing project patterns; easy to iterate on formulas.
- **Cons**: Logic is duplicated if required in both PDF and UI (though minimized by standardizing the JSON format).
- **Security**: Premium status will be checked at the API level when saving any record containing `investment_analysis` data.

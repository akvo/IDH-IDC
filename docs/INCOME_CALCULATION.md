# Net Income Calculation Guide: Technical Logic & Variable Mapping

This document provides a detailed overview of the mathematical logic used to calculate farmer net income within the Income Driver Calculator (IDC).

---

## 1. General Calculation Framework

The IDC uses a **Unified Formula** approach to calculate income across various commodity categories. This allows the system to remain flexible while ensuring consistency across different farm types.

### Core Principles
*   **Variable Hierarchy**: Income is the top-level "Aggregator," composed of sub-aggregators (like Land, Volume, and Price) which are themselves derived from individual "Questions" (raw data points).
*   **Dynamic Filtering**: The system identifies the `commodity_category` (Crop, Aquaculture, or Livestock) and only "activates" the variables relevant to that category.
*   **Zero-Value Default**: In the unified formula, any variable not applicable to the current commodity is automatically treated as `0`. This ensures the formula collapses into the correct simplified version for each case.
*   **Calculation Engine**: Formulas are stored as strings using `#ID` references (e.g., `#2` refers to Question ID 2) and evaluated dynamically.

### The Unified Income Formula
All income calculations are derived from the following master equation:

**`Income = ((#2 * #3 * #4) + (#40 * #41 * #42)) - ((#5 * #2) + (#26 * #3 * #2) + (#43 * #40)) + #7`**

*Where:*
*   **Primary Revenue**: `(#2 * #3 * #4)` + `(#40 * #41 * #42)`
*   **Primary Expenses**: `(#5 * #2)` + `(#26 * #3 * #2)` + `(#43 * #40)`
*   **Adjustments**: `+ #7`

---

## 2. Commodity-Specific Logic

### A. Crop & Timber (e.g., Coffee, Cocoa)
Calculations focus on land area and production costs per unit of area.
*   **Simplified Formula**: `Income = (Land * Volume * Price) - (Cost_per_Area * Land)`
*   **Variable Mapping**:
    *   **Land (#2)**: The total area used for production (#6).
    *   **Volume (#3)**: Net yield available for sale `(Yield - Loss)`.
    *   **Price (#4)**: Combined value `(Farmgate Price + Price Premium)`.
    *   **Cost (#5)**: Input as **Currency per Area Unit** (e.g., $/Acre).

### B. Aquaculture (e.g., Tilapia, Shrimp)
Calculations focus on area size with costs typically calculated per unit of volume (kg).
*   **Simplified Formula**: `Income = (Area * Volume * Price) - (Cost_per_Volume * Volume * Area) + Area`
*   **Variable Mapping**:
    *   **Area (#2)**: Total area under production (#7).
    *   **Volume (#3)**: Net yield available for sale `(Yield - Loss)`.
    *   **Price (#4)**: Combined value `(Farmgate Price + Price Premium)`.
    *   **Cost (#26)**: Input as **Currency per Volume Unit** (e.g., $/kg).

### C. Livestock (e.g., Pigs, Chickens)
Calculations shift to animal counts and per-animal costs.
*   **Simplified Formula**: `Income = (Animals * Volume_per_Animal * Price) - (Cost_per_Animal * Animals)`
*   **Variable Mapping**:
    *   **Animals (#40)**: The count of livestock items.
    *   **Volume (#41)**: Produce volume generated per animal.
    *   **Price (#42)**: Price per unit of volume.
    *   **Cost (#43)**: Input as **Currency per Animal** (e.g., $/Chicken).

---

## 3. Aggregation Levels & Sub-Calculations

Data points "bubble up" through multiple levels of calculation to reach the final Net Income.

| Level | Role | Example |
| :--- | :--- | :--- |
| **L1** | Master Aggregator | Net Income (#1) |
| **L2** | Category Drivers | Land (#2), Volume (#3), Price (#4), Cost (#5) |
| **L3** | Detailed Drivers | Labour Costs (#12), Yield (#8), Feed Cost (#27) |
| **L4** | Raw Data Points | Feed Conversion Ratio (#28), Irrigation Cost (#19) |

### Key Shared Formulas:
*   **Net Volume (#3)** = `Yield (#8) - Loss (#9)`
*   **Feed Cost (#27/#44)** = `Feed Conversion Ratio (#28/#45) * Feed Price (#29/#46)`

---

## 4. Diversified Income Sources

Total Household Income also includes sources that do not use complex driver formulas:
*   **Livestock Income**: Direct revenue from secondary animals.
*   **Off-farm Activities**: Income from external employment or businesses.
*   **Investments & Transfers**: Cash transfers, remittances, or grants.
*   **Other On-farm Income**: Revenue from secondary crops or miscellaneous products.

These components are added directly to the primary commodity income to calculate the total financial position.

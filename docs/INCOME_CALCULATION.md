# Net Income Calculation Guide: Technical Logic & Variable Mapping

This document provides a technical deep-dive into the mathematical logic and variable mapping used to calculate farmer net income in the Income Driver Calculator (IDC).

---

## 1. The Unified Income Formula

The IDC utilizes a master equation capable of collapsing into specific formulas based on the commodity category (Crop, Aquaculture, or Livestock).

### The Master Equation
**`Net Income = (Primary Revenue) - (Primary Expenses) + (Other Income)`**

Translating to Question IDs (#ID):
**`Income = ((#2 * #3 * #4) + (#40 * #41 * #42)) - ((#5 * #2) + (#26 * #3 * #2) + (#43 * #40)) + #7`**

*   **Primary Revenue**: `(#2 * #3 * #4)` + `(#40 * #41 * #42)`
*   **Primary Expenses**: `(#5 * #2)` + `(#26 * #3 * #2)` + `(#43 * #40)`
*   **Other Income**: `#35 + #36 + #37 + #38 + #39`

---

## 2. Technical Variable Mapping (Public Keys)

Variables are identified in the database by unique IDs and mapped to `public_key` strings for frontend rendering and logical grouping.

| ID | Public Key | Description | Driver Type |
| :--- | :--- | :--- | :--- |
| **1** | `income.total` | Final Aggregated Net Income | **Aggregator** |
| **2** | `crop.land` | Land area under production | **Land/Area** |
| **3** | `crop.volume` | Net volume available for sale (`#8 - #9`) | **Volume** |
| **4** | `crop.price` | Final price per unit (`#10 + #11`) | **Price** |
| **5** | `crop.cost.total` | Aggregated cost of production for crops | **Cost** |
| **40** | `livestock.animals` | Number of livestock items | **Land/AreaEquivalent** |
| **41** | `livestock.volume` | Volume of produce per animal | **Volume** |
| **42** | `livestock.price` | Price per unit of livestock produce | **Price** |
| **43** | `livestock.cost.total` | Total production cost for livestock | **Cost** |

### Breakdown of Cost Clusters

#### Crop & Timber Costs (#5)
*   `#12`: Labour Costs
*   `#13`: Seed/Seedling Costs
*   `#14/#15`: Fertiliser (Conventional/Organic)
*   `#16/#17`: Chemicals (Conventional/Organic)
*   `#18`: Other operational costs (Irrigation, Energy, Certification, etc.)

#### Aquaculture Costs (#26)
*   `#27`: Feed Cost (Managed via FCR `#28` * Feed Price `#29`)
*   `#31`: Fingerling Costs
*   `#32`: Labour Costs

---

## 3. Calculation Engines

### A. Dynamic Evaluation
The system uses a string-based formula evaluation engine. Formulas like `"#2 * #3 * #4"` are interpreted at runtime, allowing the admin team to update calculation logic via the `question` table without code changes.

### B. Proportional Distribution
For shared scenarios (e.g., "All Farmers" mode), costs are distributed across segments based on the **farmer headcount ratio**:
```text
Segment_Allocation = Total_Investment * (Segment_Farmer_Count / Total_Case_Farmer_Count)
```

---

## 4. Diversified Income Mapping

The total household income includes secondary sources that bypass the driver-based modeling:

*   **Livestock Component (#35)**: Direct revenue from secondary animals.
*   **Off-farm Activities (#36)**: External wages or business income.
*   **Transfers (#37)**: Remittances or government support.
*   **Secondary On-farm (#38)**: Intercropping or secondary product revenue.

---

> [!IMPORTANT]
> All formulas assume a **Zero-Value Default**. If data for a specific #ID is missing, it is treated as `0` in the equation to prevent calculation failures.

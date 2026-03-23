# User Guide Supplement: Advanced Modelling Tool

## Understanding Modelling Results

The Advanced Modelling Tool provides high-fidelity simulations for closing the living income gap. When interpreting the results, pay attention to the guidance alerts provided:

### ℹ️ Income Surplus
If you see the message: *"Farmers in this segment already earn more than the income target. In this calculated scenario, incomes would decrease."*
- **What it means**: The selected segment, based on the current/feasible drivers and your manual inputs, already exceeds the living income benchmark. The "Required [Driver]" value shown is what would be needed just to *reach* the target (mathematically, this would represent a decrease from the current surplus).
- **Price Breakdown**: Still available.

### ❌ Physically Impossible
If you see the message: *"It is not physically possible to reach the income target with the specified model values."*
- **What it means**: The mathematical model requires a negative value for the selected driver (e.g., a negative Price or negative CoP) to hit the income target. This usually happens when other income drivers are set too low.
- **Price Breakdown**: The bar chart is replaced with a warning because a breakdown for a negative or impossible value is not visually representative.

---

## Modelling Tool: View-Only Mode

If you are assigned to a case as a **Viewer**, the modelling tools (Step 4 and 5) will be **VISIBLE** so you can inspect the current population's data and feasibility, but all input fields and "Save" buttons will be **DISABLED**. This ensures that data consumers can benefit from the analysis without risk of accidental modification.

---

# User Management: Partner Access Levels

The IDC manages partner data through three distinct access levels for "Guest" (External) users:

### External Regular
*   **Best for**: Individual partner companies or regional managers.
*   **Privacy**: Users can only see cases they created or cases assigned to their specific **Company**. They cannot see data from other companies within the same Organisation.

### External Advanced (Org Lead)
*   **Best for**: Technical leads or program managers who oversee multiple partners.
*   **Visibility**: Users have "Lead" visibility, allowing them to see all cases (public and private) within their entire **Organisation** boundary.

### Internal User
*   **Best for**: IDH staff and internal analysts.
*   **Visibility**: Can see all public cases system-wide and all private cases within their assigned **Business Units**.
---

# Data Upload: Segmentation Configuration

When uploading your own validated data template, you can configure how the IDC segments your farmers for analysis.

## Adding Segments via Generator
When using the "Add segment based on a different variable" option, the UI utilizes a robust **two-column horizontal layout** to guide you through a logical sequence:

1.  **Select Variable Type**: Choose between **Categorical** (e.g., Region, Gender) or **Numerical** (e.g., Farm Size, Yield) using the button-style toggles.
    - *Tip*: Look for the `?` icon next to the "Variable type" and "Segmentation" headers for contextual help.
2.  **Select Variable**: Once the type is selected, the variable dropdown ("Select a variable to segment by:") will populate with relevant columns from your spreadsheet.
3.  **Configure Segmentation**: For numerical variables, enter the desired number of segments in the right column.

# Step 5: Impact of Investment Analysis (Premium)

Premium users can evaluate the cost-effectiveness of their strategies by toggling the "Add Investment" option in Step 5 modeling tabs.

## Comparing Scenarios & Segments
The **Scenario Cost by component** chart utilizes a multi-selector to allow side-by-side comparison of up to 5 unique combinations of scenarios and segments.
- **Default View**: If no specific selection is made, the chart defaults to showing all modelled scenarios for "All Segments."
- **Deep Dives**: Select specific farmer segments (e.g., "Male", "Smallholder") to see how implementation costs vary across your population.
- **Zero-Value Display**: Segments without explicitly defined investment costs will appear as 0-value entries to maintain visual comparison without data gaps.

## ROI Performance Metrics
- **Return on Investment (%)**: Measures the percentage point increase in household income for every 100 units of currency invested.
- **Payback Period (Years)**: The estimated time required for the projected income gains to recover the total implementation cost.
- **Income Increase (%)**: The net percentage growth in household income compared to the baseline.

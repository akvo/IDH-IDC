# PRD: Income Driver Calculator (IDC)

## 1. Vision & Goals
**Vision**: To be the industry-standard tool for modelling and closing the living income gap in agriculture.
**Goals**:
- Provide an intuitive interface for farmer population segmentation.
- Enable complex multi-driver simulations with real-time feedback.
- Ensure data persistence and consistency across modeling scenarios.

## 2. Target Users
### 2.1 Sustainability Manager (John)
- **Goal**: Identify high-level strategy for income improvement.
- **Pain Point**: Distinguishing between the impact of price premiums vs. productivity gains.

### 2.2 Data Analyst (Mary)
- **Goal**: Clean and segment survey data accurately.
- **Pain Point**: Handling mixed categorical and numerical data from diverse supply chains.

## 3. User Journeys
1. **Case Setup**: Define commodities, benchmarks, and upload survey data.
2. **Segmentation**: Break down the population into actionable segments (e.g., By farm size, by region).
3. **Gap Analysis**: Visualizing the distance between current income and the living income benchmark.
4. **Driver Modelling**: Experimenting with driver changes (e.g., "What if yields increase by 20%?").
5. **Scenario Comparison**: Comparing "Current", "Feasible", and "Modelled" scenarios to select the best intervention.

## 4. Functional Requirements

### 4.1 Segmentation Engine (Step 2)
- [HIGH] Support for manual count entry and preservation.
- [HIGH] Numerical cascading logic with configurable precision (0.01).
- [MED] Categorical mapping for diverse survey response values.
- [HIGH] Real-time preview of segment distribution.

### 4.2 Calculation Engine (Step 4 & 5)
- [HIGH] Three-driver simultaneous calculation (Volume, Land, Income Target).
- [HIGH] Advanced modelling for Primary, Secondary, and Tertiary crops.
- [HIGH] Formula visualization via `EquationVisualizer`.
- [MED] Diversified Income (ODI) integration into scenario modelling.

### 4.3 UI & Visualizations
- [HIGH] Responsive charts (Pie, Bar, Heatmap) using projects' `Chart` patterns.
- [HIGH] "VisualCardWrapper" usage for consistent styling.
- [MED] Feasibility alerts (Signal Green/Orange/Impossible).

### 4.4 Authentication & Access
- [HIGH] Standard "External" users migrate to "Regular" type by default.
- [HIGH] Permission Parity: Advanced modelling tools are visible to all but restricted to "Editor" authority for interactivity.
- [HIGH] Data Upload Isolation: Strictly restricted to Advanced User Types (Admin/Internal/Ext Adv) with Editor permissions.

## 5. Non-Functional Requirements
- **Performance**: Recalculations should occur in <1s for segments up to 5,000 farmers.
- **Persistence**: Per-segment state must be preserved in the DB for all modelling inputs.
- **Security**: JWT-based authentication with role-based access to cases.

## 6. Out of Scope
- Direct integration with farmer payment systems (e.g., Mobile Money).
- Automated data cleaning/outlier detection (assumed to be done pre-upload).

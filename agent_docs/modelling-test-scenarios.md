# Modelling Test Scenarios (3-Segment Breakdown)

This document provides specific values for **Current** and **Feasible** scenarios for three different farmer segments. Use these to verify the **Advanced Modelling Tool** (Step 5) logic gates.

---

## Shared Benchmarks
- **Total Income Target**: 5,000

---

## Segment 1: Normal Scenario (Income < Target)
*Goal: Test a standard gap closing calculation.*

| Scenario | Land | Volume | Price | CoP | Secondary | ODI | Total Income |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Current** | 2 | 800 | 1.80 | 350 | 800 | 400 | **3,380** |
| **Feasible** | 2 | 1,000 | 2.00 | 300 | 1,000 | 500 | **4,900** |

**Test Step**:
1. Click **Model** tab.
2. Select **Model Price**.
3. **Calculation Result** should be **2.81** (based on modelling from Current drivers: L=2, V=800, CoP=350, Others=1,200).
4. **Expected UI**: No warnings. Value is 2.81.

---

## Segment 2: Surplus Scenario (Income > Target)
*Goal: Test the "Income Surplus" informational alert.*

| Scenario | Land | Volume | Price | CoP | Secondary | ODI | Total Income |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Current** | 2.5 | 1,200 | 2.30 | 200 | 1,200 | 600 | **8,200** |
| **Feasible** | 2.5 | 1,500 | 2.50 | 150 | 1,500 | 800 | **11,300** |

**Test Step**:
1. Click **Model** tab. (Note: The tool may default to Feasible values if they exist, but you can manually enter the **Current** drivers to see this exact result).
2. Select **Model Price**.
3. **Calculation Result** should be **1.23** (based on modelling from Current drivers: L=2.5, V=1,200, CoP=200, Others=1,800).
4. **Expected UI**:
    - Alert: *"Farmers in this segment already earn more than the income target. In this calculated scenario, incomes would decrease."*
    - Value Box: Shows **1.23**.
    - Price Breakdown: **Available**.

---

## Segment 3: Impossible Scenario (Target Unreachable)
*Goal: Test the "Physically Impossible" warning alert.*

| Scenario | Land | Volume | Price | CoP | Secondary | ODI | Total Income |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Current** | 0.5 | 50 | 10.00 | 200 | 200 | 100 | **450** |
| **Feasible** | 0.5 | 80 | 12.00 | 150 | 300 | 200 | **905** |

**Test Step**:
1. Click **Model** tab.
2. Select **Model CoP**.
3. **Calculation Result** should be **-8,900.00** (based on modelling from Current drivers: L=0.5, V=50, P=10.00, Others=300).
4. **Expected UI**:
    - Alert: *"It is not physically possible to reach the income target with the specified model values."*
    - Value Box: Shows **-8,900.00**.
    - Price Breakdown: **Disabled** / Replaced with warning.

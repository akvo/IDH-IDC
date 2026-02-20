# Explainer: Handling Segment Threshold Adjustments

This document explains the issue with numerical segment ranges when thresholds are updated out of order.

---

## 1. Initial State (Balanced)
Initially, segments are generated with increasing thresholds and logical ranges.

| Segment | Threshold | Calculated Range |
| :--- | :--- | :--- |
| Segment 1 | 1.0 | 0.20 - 1.00 |
| Segment 2 | 1.95 | 1.01 - 1.95 |
| Segment 3 | 9.0 | 1.96 - 9.00 |

---

## 2. Current Behavior (The Bug)
If a user updates **Segment 2** to a value higher than **Segment 3** (e.g., changing `1.95` to `3.0`), the system creates an **inverted range** for Segment 3 because it assumes Segment 2's value is the starting point for Segment 3.

**User Action**: Change Segment 2 Threshold from `1.95` to `3.0`.

| Segment | Threshold | Calculated Range | Result |
| :--- | :--- | :--- | :--- |
| Segment 1 | 1.0 | 0.20 - 1.00 | ✅ OK |
| Segment 2 | **3.0** | 1.01 - 3.00 | ✅ OK |
| Segment 3 | **1.95** | **3.01 - 1.95** | ❌ **Broken (Inverted)** |

---

## 3. Expected Behavior (The Fix)
The system should automatically **re-sort** all segments by their threshold value whenever one is changed. This ensures that the ranges always flow logically from smallest to largest.

**User Action**: Change Segment 2 Threshold from `1.95` to `3.0`.

| Segment (Re-ordered) | Threshold | Calculated Range | Result |
| :--- | :--- | :--- | :--- |
| Segment 1 | 1.0 | 0.20 - 1.00 | ✅ OK |
| **Segment 2** | **1.95** | **1.01 - 1.95** | ✅ **Fixed (Auto-sorted)** |
| **Segment 3** | **3.0** | **1.96 - 3.0** | ✅ **Fixed (Auto-sorted)** |

---

## Key Takeaway
By enforcing **Auto-Sorting by Value**, we ensure that No. 3 always stays logically connected to No. 1 and No. 2, preventing data errors regardless of how a user chooses to tweak the numbers.

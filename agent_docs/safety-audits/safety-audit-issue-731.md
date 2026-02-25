# Technical Safety Audit: User Restrictions (#731)

**Issue**: Aligning User Restrictions (#731)
**Scope**: Frontend Gating & Access Control Refactoring

---

## 1. Risk Assessment

| risk | level | mitigation |
| :--- | :--- | :--- |
| **Data Leakage (Advanced)** | Low | Verified backend `case.py` removes the Organisation-wide access. Advanced users are now strictly silod to their Company. |
| **Logic Bypass (Regular)** | Low | **Enforced**: `verify_case_creator` in `middleware.py` returns 403 Forbidden for restricted users on creation/import endpoints. |
| **Feature Over-exposure** | Low | Intentionally granting full access to `External Advanced` as per business requirement (Power User). |
| **Data Integrity** | Low | Permission model still relies on backend ownership checks; power users only edit their own/assigned data. |
| **Feature Gating (Refinement)** | Low | Refined `External Regular` restrictions to **HIDE** specific complex tools (Data Upload, Optimization) instead of just disabling. |
| **Benchmark Gating** | Low | Disabled CPI adjustment button in `SetIncomeTarget.js` when `enableEditCase` is false to prevent unauthorized benchmark overrides. |

---

## 2. Refactoring Audit
- **Simplification**: Unifying External Advanced with Internal for features simplifies the `Case.js` state logic.
- **Privacy Boundary**: Restoring Company-level visibility for Advanced users ensures Org-wide privacy is maintained by default unless explicitly shared.
- **Future Proofing**: Added `enableImpactOfInvestment` centralized flag as a placeholder for the upcoming feature, ensuring it's restricted by default for external regular users.

---

## 3. Migration Safety
- **State Migration**: No changes to the database schema were required for this alignment, ensuring zero downtime for existing cases.
- **Backward Compatibility**: Existing cases continue to follow the same permission model, only the UI interaction is more strictly gated for external users.

---

## 4. Final Sign-off
- [x] Logic reviewed for consistency.
- [x] Linting passed (0 errors).
- [x] Manual verification plan (QA Guide) created.
- [x] No side-effects on internal/admin users.

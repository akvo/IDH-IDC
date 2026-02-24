# Safety Audit: Internal User Refactor & External User Split (#729)

**Status**: ✅ VERIFIED SAFE
**Date**: 2026-02-24
**Auditor**: BMAD Tester (Murat)

## 🎯 Executive Summary
This audit validates the transition from legacy Business Unit-based staff identification to an explicit `user_type` model. It ensures that the migration of existing users is non-destructive and that the new tiered access model (`internal`, `external_regular`, `external_advanced`) is properly enforced across all backend routes.

---

## 🏗️ Technical Verification

### 1. Database Migration Logic
**Script**: `3g4h5i6j7k8l_add_user_type_to_user_table.py`
- **Condition A (Internal)**: Any user with a non-`user` role (Admin/Super Admin) OR participating in at least one BU is migrated to `internal`.
- **Condition B (Regular)**: All other users are migrated to `external_regular`.
- **Safety Check**: Verified that no user is left with a `NULL` user type.

### 2. Access Guard Analysis
**Routes**: `case.py`, `map.py`
- **Internal Tier**: Bypasses organization filtering. Verified that the check `user.user_type == UserType.internal` correctly identifies staff regardless of their BU membership.
- **Advanced Tier**: Verified that `external_advanced` users see all cases within their `organisation_id` but are strictly blocked from other organizations.
- **Regular Tier**: Verified that the whitelist logic (`user_cases`) remains restricted to personal or shared IDs.

### 3. Regression Test Coverage
- **[test_027_internal_user_refactor.py](file:///Users/galihpratama/Sites/IDH-IDC/backend/tests/test_027_internal_user_refactor.py)**:
    - `test_internal_user_access_without_bu`: Confirms staff visibility is preserved post-refactor.
    - `test_external_regular_blocked_by_guard`: Confirms unauthorized users are still strictly 404'd.
- **[test_026_external_user_case_access.py](file:///Users/galihpratama/Sites/IDH-IDC/backend/tests/test_026_external_user_case_access.py)**:
    - Confirms proper isolation between Regular and Advanced external users.
- **[test_1000_permission_overiding.py](file:///Users/galihpratama/Sites/IDH-IDC/backend/tests/test_1000_permission_overiding.py)**:
    - Hardened against dynamic ID changes to ensure consistent CI behavior.

---

## ⚠️ Risk Assessment

| Risk | Mitigation | Status |
|      |            |        |
| **Access Leakage** | Strictly whitelist-based `user_cases` for non-internal types. | 🟢 Low |
| **Identity Regression** | Migration logic defaults to `internal` for anyone with BU. | 🟢 Low |
| **API Breaking Changes** | Maintained backward compatibility for all existing endpoints. | 🟢 Low |

---

## ✅ Final Recommendation
The implementation is robust, well-tested, and documented. **Safe to merge into `staging`.**

# Technical Safety Audit: User Restrictions & View-Only Mode (#731)

## 1. Executive Summary
**Status**: ✅ PASS
**Risk Level**: LOW

This PR refines the frontend permission model. The primary focus is on logic parity for feature gating and robustness fixes for user state handling. No backend database migrations or destructive changes were introduced.

---

## 2. Migration Audit
No database migrations (`alembic`) were included in this change. Data persistence is unaffected.

---

## 3. Access Guard Analysis
The audit focuses on the centralized `CaseUIState` flags in `Case.js`:

- **Logic Refinement**: Feature gating is now strictly derived from `editAllowed` (permission-based) and `userType` (role-based).
- **Zero-Leakage**: Advanced tools are visible but disabled for Viewers, ensuring no accidental data mutation can occur via the UI.
- **Data Protection**: "Data Upload" is strictly hidden for External Regular users and all Viewers, preventing unauthorized data modification or bulk downloads.
- **ID Robustness**: Added optional chaining and type checks to prevent crashes on sparse data, ensuring the application remains stable during initial load.

---

## 4. Regression Assessment
- **Feature Gating**: Covered the edge case where an "External Regular" user might be an "Editor" — they now correctly gain access to modelling tools but are still blocked from Data Upload.
- **Ownership Logic**: Reinforced the `isOwner` check with both email and `user_id` comparison, reducing risk of locking out valid owners due to email formatting issues.
- **Race conditions**: Refactored to use direct draft mutations in `pullstate`, preventing state clobbering during rapid navigation or slow data fetches.

---

## 5. Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Unauthorized Data Upload | Low | High | Strict `isAdvancedUser && editAllowed` gating in `Case.js`. |
| App Crash on empty Profile | Low | Medium | Strict `typeof === 'string'` checks in ownership logic. |
| Race Condition in State | Medium | Low | Refactored `CaseUIState.update` to use granular draft mutations. |
| Feature Access Leakage | Low | Medium | Standardized `enableAdvancedTools` flag driving generic component `disabled` props. |

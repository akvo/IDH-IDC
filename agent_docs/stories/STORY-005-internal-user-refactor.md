# STORY-005: Internal User Logic Refactor

## Title
Refactor backend identity logic to use `user_type` for Internal Users

## User Story
**As a** system maintainer,
**I want to** use the explicit `user_type` column to identify internal staff,
**So that** the identity model is consistent across all user roles and does not rely on relationship existence (Business Units).

## Acceptance Criteria
- [ ] Backend route `case.py:get_all_case` uses `user.user_type == UserType.internal` to grant staff visibility (Public cases).
- [ ] Backend route `map.py:get_map_data` uses `user.user_type == UserType.internal` to grant staff visibility.
- [ ] All "404 Guard" checks in these routes are updated to include `UserType.internal`.
- [ ] Existing internal users (assigned to BUs) continue to function correctly.
- [ ] Automated tests verify that a user with `user_type == internal` has access regardless of BU participation.

## Technical Notes
- Replace `len(user.user_business_units)` with `user.user_type == UserType.internal`.
- Replace `not len(user.user_business_units)` with `user.user_type != UserType.internal`.
- Ensure `UserType` is imported from `models.user`.

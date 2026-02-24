# Story: Frontend Implementation of External User Split

**ID**: STORY-003
**Title**: Update User Management UI for External Type Selection
**Priority**: High
**Effort**: 3 hrs

## Description
As an Admin, I want to select whether an external user is "Regular" or "Advanced" in the User Management form.

## Acceptance Criteria (UAC)
- [ ] User Form shows a sub-type selector ("Regular" / "Advanced") when "External" is selected.
- [ ] Advanced users are saved with the correct `user_type` in the database.
- [ ] The Users list shows the type (Regular/Advanced) for external users.

## Technical Acceptance Criteria (TAC)
- [ ] `UserForm.js` updated with conditional `Form.Item` for `user_type`.
- [ ] `onFinish` handles merging `user_type` into the payload.
- [ ] Data loading correctly initializes the sub-type selector for existing users.
- [ ] Users list table column updated to show descriptive labels for `user_type`.

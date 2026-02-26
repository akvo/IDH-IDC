# Story: Frontend Implementation of External User Split
**Status**: Completed

**ID**: STORY-003
**Title**: Update User Management UI for External Type Selection
**Priority**: High
**Effort**: 3 hrs

## Description
As an Admin, I want to select whether an external user is "Regular" or "Advanced" in the User Management form.

## Acceptance Criteria (UAC)
- [x] User Form shows a sub-type selector ("Regular" / "Advanced") when "External" is selected.
- [x] Advanced users are saved with the correct `user_type` in the database.
- [x] The Users list shows the specific type (Regular/Advanced) for external users.
- [x] The Users list filter includes "External Regular" and "External Advanced" options.

## Technical Acceptance Criteria (TAC)
- [x] `UserForm.js` updated with conditional `Form.Item` for `user_type`.
- [x] `onFinish` handles merging `user_type` into the payload.
- [x] Data loading correctly initializes the sub-type selector for existing users.
- [x] Users list table column updated to show descriptive labels for `user_type`.
- [x] `Users.js` filter items updated to support `external_regular` and `external_advanced`.

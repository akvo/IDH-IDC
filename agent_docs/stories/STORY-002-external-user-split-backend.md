# Story: Backend Implementation of External User Split

**ID**: STORY-002
**Title**: Split External Users into Regular/Advanced in Backend
**Priority**: High
**Effort**: 6 hrs

## Description
As an Admin, I want to distinguish between "Regular" and "Advanced" external users in the database so that I can control their organization-wide case access.

## Acceptance Criteria (UAC)
- [ ] User table has a `user_type` column (internal, external_regular, external_advanced).
- [ ] All existing users are correctly migrated (Internal if BU exists, else Regular).
- [ ] Advanced external users can see all cases in their organization via `GET /case`.
- [ ] Regular external users only see cases from their company or shared with them.

## Technical Acceptance Criteria (TAC)
- [ ] Alembic migration adds `user_type` enum and column.
- [ ] `User` model and Pydantic schemas include `user_type`.
- [ ] `crud_case.get_all_case` updated with specialized ORM filter for `external_advanced`.
- [ ] Unit tests verify access isolation between Regular and Advanced types.

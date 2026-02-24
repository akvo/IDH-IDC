# Story: Backend Implementation of External User Split

**ID**: STORY-002
**Title**: Split External Users into Regular/Advanced in Backend
**Priority**: High
**Effort**: 6 hrs

## Description
As an Admin, I want to distinguish between "Regular" and "Advanced" external users in the database so that I can control their organization-wide case access.

## Status
Implemented

## Acceptance Criteria (UAC)
- [x] User table has a `user_type` column (internal, external_regular, external_advanced).
- [x] Column is nullable, but defaults to `internal` for all non-user roles (admins/editors/viewers).
- [x] All existing users are correctly migrated (Internal if BU exists, else Regular).
- [x] Advanced external users can see all cases in their organization via `GET /case`.
- [x] Regular external users only see cases from their company or shared with them.

## Technical Acceptance Criteria (TAC)
- [x] Alembic migration adds `user_type` as a `VARCHAR(150)` column instead of native PG ENUM.
- [x] `User` model and Pydantic schemas include `user_type` mapped to Python Enum (`native_enum=False`).
- [x] `crud_case.get_all_case` updated with specialized ORM filter for `external_advanced`.
- [x] Unit tests verify access isolation between Regular and Advanced types.

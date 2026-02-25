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
- [x] **External Advanced Users**: Siloed to **Company** visibility (unified with standard users). This ensures power users can only manage their own sub-company data.
- [x] **External Regular Users**: Restrict visibility same as standard users.

## Technical Acceptance Criteria (TAC)
- [x] Alembic migration adds `user_type` as a `VARCHAR(150)` column instead of native PG ENUM.
- [x] `User` model and Pydantic schemas include `user_type` mapped to Python Enum (`native_enum=False`).
- [x] `crud_case.get_all_case` / `routes/case.py`: Unified `external_advanced` visibility with standard `user.company` logic.
- [x] Unit tests verify access isolation between Regular and Advanced types.

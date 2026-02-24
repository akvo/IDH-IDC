# Feature: External User Split (Regular vs Advanced)

## Overview
Currently, users with the `role == "user"` are classified as "Internal" if they belong to a business unit, and "External" otherwise. This feature formalizes this by adding a `user_type` column and splitting "External" into "Regular" and "Advanced" to better support organizational case access for partners.

## Requirements
- **Internal**: Users belonging to a Business Unit. Access to cases within their BU/Org.
- **External (Regular)**: Current external behavior. Access only to cases from their `company` or specifically shared with them.
- **External (Advanced)**: Behaves like an internal user for their `organisation`. Can see all cases (private/public) within their org boundary.
- **Admin Control**: Admins can select the `user_type` during creation/edit for users with the `user` role.

## User Journeys
1. **Admin Invites Advanced Partner**: Admin creates a user, selects "External" and then "Advanced". The user is associated with an Organisation and Company.
2. **Advanced Partner Access**: The user logs in and can see all cases created by any user in their same Organisation, helping them manage regional data.

## Functional Specs
- [MOD] `User` model: add `user_type` (Enum: `internal`, `external_regular`, `external_advanced`).
- [MOD] `get_all_case` logic: add condition for `external_advanced` to see org-wide cases.
- [MOD] `UserForm.js`: add conditional sub-selector for external type.
- [MOD] `Users.js`: update `userRoleOptions` filter and column display to show specific external types.

## Non-Functional Specs
- **Data Integrity**: Migration script must correctly identify existing "Internal" vs "External" users based on BU presence.
- **Security**: "Advanced" status must NOT grant access outside the user's organisation.

## Technical Requirements
- **Database**: Add `user_type` enum field to `user` table. Values: `internal`, `external_regular`, `external_advanced`.
- **API**:
  - `POST /user/register`: Payload must accept `user_type`.
  - `PUT /user/{id}`: Allow updating `user_type`.
  - `GET /case`: Update filtering logic to include `organisation` matches for `external_advanced`.
- **Frontend**:
  - `UserForm.js`: Logic to toggle sub-selection based on role and primary type.

## Validation Logic
- **Internal**: Must have at least one Business Unit.
- **External (Regular/Advanced)**: Must have a Company associated (existing requirement).
- **Organisation**: All external users must have an Organisation (existing requirement).

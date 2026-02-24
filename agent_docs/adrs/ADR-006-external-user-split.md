# ADR-006: External User Type Split (Regular vs Advanced)

**Status**: Approved
**Date**: 2026-02-24
**Context**: Issue #729

## Context and Problem Statement

Initially, "External" users were defined implicitly as users without a `business_unit` relationship. These users were restricted to seeing only their own cases or cases from their assigned `company`.

However, requirements evolved to support "Partners Leads" (Advanced Partners) who need to oversee data from multiple companies within a single Organisation boundary, while standard partner staff (Regular Partners) should remain isolated to their specific company's data.

## Decision

We have formalized the identity and access management for external users by splitting the "External" role into two distinct `user_types`:

1.  **`external_regular`**: The default behavior. Users can only see cases they created or cases linked to their assigned `company_id`.
2.  **`external_advanced`**: Granted "Org Lead" visibility. Users can see all cases created by any user within their same `organisation_id`, including private cases.

### Implementation Details

*   **Database**: Added a `user_type` Enum column to the `user` table.
*   **Defaulting**: New registrations default to `external_regular`. Existing users are migrated based on the presence of Business Units (Internal) vs. Companies (External).
*   **Enforcement**: Access is enforced at the `get_all_case` route layer using a dynamic `user_cases` ID list or organization-wide filtering.

## Alternatives Considered

### Option A: Implicit Logic (Status Quo)
Continue using the presence of BUs vs. Companies to infer access.
*   **Result**: Rejected. Fragile and lacks the ability to grant "Lead" access to specific partner accounts without granting them "Internal" status (which carries other permissions).

### Option B: New Roles (e.g. "External Admin")
Create entirely new top-level roles.
*   **Result**: Rejected. Many parts of the codebase use `UserRole.user` check. Adding a new role would require widespread updates to conditional logic. Using a sub-type selector (`user_type`) preserves existing role-based checks.

## Consequences

*   **Positive**: Clearer distinction between partners and staff. Superior organizational oversight for lead partners.
*   **Neutral**: Requirement for admins to explicitly select the type for new users.
*   **Negative**: Slight increase in complexity in the Case retrieval SQL query/ORM logic.

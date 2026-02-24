# Research Findings: Managing `user_type` for Admin Roles

## 1. How are current non-"user" roles managed?
Upon investigating the `User` model (`backend/models/user.py`), specifically the `to_user_info` property which is returned during login and profile fetching, I found the following logic:

```python
"internal_user": (
    False
    if not business_unit_detail and self.role == UserRole.user
    else True
),
```

**Conclusion**: Yes, you are absolutely correct. **All roles except "user"** (`super_admin`, `admin`, `editor`, `viewer`) are hardcoded to be managed as **`is_internal: True`** (specifically via the `internal_user` property).

## 2. Should `user_type` be `NULL` or `internal` for these roles?

Given that non-user roles are functionally internal, we have two architectural choices for the new `user_type` column for these users.

### Option A: Mark them as `NULL` (Current Plan)
In this approach, `user_type` is treated strictly as a sub-classification *only* for people with the `user` role.
- **Reasoning**: Roles like Admin or Editor inherently carry structural authority and are strictly internal staff. Their `role` column already fully defines their access pattern. The `user_type` was introduced to solve the "External User Split", so it only applies to the `user` role.
- **Pros**:
  - Cleaner separation of concerns: `role` defines system authority, `user_type` defines external relationship limits for standard users.
  - Less redundant data in the database.
- **Cons**:
  - Frontend or downstream analysis might have to check two columns (`if role == admin OR user_type == internal`) to fully grasp all internal users.

### Option B: Mark them as `internal`
In this approach, any user who evaluates to `internal_user == True` is explicitly given the `internal` value in the `user_type` column.
- **Reasoning**: If a Super Admin is functionally an internal user, marking them as `internal` in the database creates a single, unified source of truth for "Internal vs External" categorization directly at the database level.
- **Pros**:
  - Unified querying: You can find *all* internal staff (admins, editors, and standard internal users) by simply querying `WHERE user_type = 'internal'`.
  - Directly maps to the frontend `internal_user: True` logic.
- **Cons**:
  - Slightly redundant. A Super Admin is *always* internal, so assigning them a `user_type` of `internal` is technically restating a known fact.

### Recommendation
If we want the database `user_type` column to strictly serve as a single source of truth for "Is this person an Internal or External stakeholder?", then **Option B (`internal`)** is better because it aligns beautifully with the existing `internal_user: True` frontend flag.

If we want `user_type` to strictly serve as an "External User Sub-type Splitter", **Option A (`NULL`)** is better.

However, from a purely data-analytics and query-simplicity standpoint, **Option B (`internal`) is highly recommended** because writing `WHERE user_type = 'internal'` is much safer and easier than writing `WHERE role != 'user' OR user_type = 'internal'`.

## 3. Migration Script Query Correction
During the implementation of the data migration for `user_type`, a query was written to check if a user had a business unit:
`SELECT DISTINCT user_id FROM user_business_unit`

Upon inspecting `backend/models/user_business_unit.py`, the column establishing the foreign key to the `user` table is actually named `user`, not `user_id`:
```python
user = Column(Integer, ForeignKey("user.id"), nullable=False)
```
**Conclusion**: The migration script must be updated to select from `"user"` (in quotes, since `user` is a reserved keyword in PostgreSQL) instead of `user_id` to prevent the migration from crashing with a `column does not exist` error.

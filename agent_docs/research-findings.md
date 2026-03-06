# Research Findings: Data Upload Cleanup Lifecycle

## Context
Uploaded spreadsheets for case creation currently persist indefinitely in `/tmp/idc_case_imports` and as `case_import` records in the database. While the database includes an `expires_at` field, no mechanism exists to enforce it.

## Findings

### 1. Storage Backend
- **Location**: `/tmp/idc_case_imports`.
- **Naming**: `{import_id}.xlsx` where `import_id` is a UUID.
- **Persistence**: Relies on OS `/tmp` cleanup policies, which vary by environment.

### 2. Database Record
- **Model**: `CaseImport`.
- **Metadata**: Tracks `user_id`, `file_path`, and `expires_at` (default 24h).
- **Cleanup Status**: No CRUD or background task currently handles deletion.

### 3. Proposed Mitigation Strategies

#### A. Immediate Cleanup (Active Guard)
- **Flow**: When user clicks "Discard changes" in `CaseSettings.js` drawer.
- **Implementation**:
    - Backend: Add `DELETE /api/v1/case-import/{import_id}` endpoint.
    - Frontend: Call this endpoint during `onOk` of the "Discard changes" modal if `importId` is present.
- **Risk**: User might close the browser tab or lose connection before the call completes.

#### B. Periodic Cleanup (Passive Guard)
- **Flow**: Background task running every Hour.
- **Implementation**:
    - Backend: Fastapi `BackgroundTasks` is not suitable for recurring jobs. Recommend a simple `cleanup_imports.py` script run via `cron` or a dedicated container.
    - Logic: `DELETE FROM case_import WHERE expires_at < NOW()`. Then delete files at `file_path`.
- **Risk**: Minor storage overhead for up to 24 hours.

## Recommendations
1. **Implement Both**: Immediate cleanup for UX responsiveness/security, and Periodic cleanup for robustness (orphaned sessions).
2. **Safety Audit**: Ensure deletion logic only affects `CaseImport` records not yet associated with a finalized `Case`. (The `case_id` foreign key is nullable and only set on successful save).

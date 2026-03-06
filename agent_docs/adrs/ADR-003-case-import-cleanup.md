# ADR-003: Case Import Cleanup Strategy

## Status
Proposed

## Context
Uploaded spreadsheets currently persist indefinitely. We need a way to clean them up both immediately (on user discard) and periodically (for abandoned sessions).

## Decision
1. **API Endpoint**: Implement `DELETE /case-import/{import_id}` for immediate frontend-triggered cleanup.
2. **Cleanup Script**: A lightweight Python script `backend/scripts/cleanup_imports.py` will be created for purging expired records (`expires_at < NOW`).
3. **Execution**: The script will be run **manually** by the administrator when storage cleanup is required, rather than automated via cron/periodic task.
4. **Storage Logic**: Deletion will be "Best Effort" — if a file is missing, the DB record should still be pruned.

## Alternatives Considered
- **Celery/Redis**: Too heavy for this single task.
- **FastAPI BackgroundTasks**: Only works on request context; doesn't handle periodic cleanup of abandoned files.
- **OS-level Cron**: Simple and effective, but requires Docker-level scheduling.

## Consequences
- Requires frontend to proactively call the DELETE endpoint on discard.
- Periodic script ensures storage doesn't grow indefinitely even if frontend fails to call cleanup.
- Minimal technical debt compared to introducing a full task queue.

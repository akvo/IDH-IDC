# Story: STORY-739-cleanup: Data Upload Lifecycle Management

## Story 1: Immediate Cleanup on Discard
**As a** system user
**I want** my uploaded files to be deleted immediately when I discard my changes
**So that** my data is promptly removed from the server when I decide not to proceed.

### Timeline & Effort
- **Estimated Time**: 4h
- **Effort Points**: 3

### Acceptance Criteria
#### User Acceptance Criteria (UAC)
- [ ] Clicking "Discard changes" in the Unsaved Changes modal triggers a server-side deletion of the associated spreadsheet.
- [ ] The user receives a visual confirmation (or no error) that the cleanup was successful.
- [ ] If the cleanup fails, the user can still close the drawer without being blocked.

#### Technical Acceptance Criteria (TAC)
- [ ] Implement `DELETE /api/v1/case-import/{import_id}` in `backend/routes/case_import.py`.
- [ ] Endpoint must verify user ownership of the `import_id`.
- [ ] Implement `delete_import_file` in `backend/utils/case_import_storage.py`.
- [ ] Frontend `CaseSettings.js` must call the DELETE endpoint on `onOk` discard action.

---

## Story 2: Periodic Background Purge
**As a** system administrator
**I want** abandoned upload files and database records to be automatically purged
**So that** storage costs are managed and privacy is protected even if users don't explicitly discard.

### Timeline & Effort
- **Estimated Time**: 4h
- **Effort Points**: 3

### Acceptance Criteria
#### User Acceptance Criteria (UAC)
- [ ] Abandoned files older than 24 hours are removed from the server.
- [ ] Database records for expired imports are pruned.
- [ ] Finalized cases (where upload was successful and saved) are NOT affected.

#### Technical Acceptance Criteria (TAC)
- [ ] Create `backend/scripts/cleanup_imports.py` to handle the purge logic.
- [ ] Script must filter `CaseImport` where `expires_at < now()` AND `case_id` is NULL.
- [ ] Script must be executable manually within the backend container environment.

### Technical Notes
- **API**: `DELETE /case-import/{import_id}`
- **Models**: `CaseImport`
- **Dependencies**: STORY-739 (UX)

### Definition of Done
- [ ] Unit tests for deletion logic
- [ ] Integration test for DELETE endpoint
- [ ] Script verified to delete both files and DB records
- [ ] Frontend integration verified
- [ ] Documentation updated

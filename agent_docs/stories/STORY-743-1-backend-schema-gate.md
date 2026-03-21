## Story: Define Investment Persistence Schema (Backend)
**As a** System Architect
**I want** the backend to validate and restrict investment cost data
**So that** only premium users can save high-quality, typed investment metadata

### Timeline & Effort
- **Estimated Time**: 4h
- **Actual Time**: [Leave empty initially]
- **Effort Points**: 3

### Acceptance Criteria
#### User Acceptance Criteria (UAC)
- [ ] Backend allows saving `investment_analysis` key in `visualization.config` only for premium users.
- [ ] Saving invalid data types (e.g., string for cost) returns a 422 validation error.
- [ ] Metadata like `currency` and `last_updated` is preserved.

#### Technical Acceptance Criteria (TAC)
- [ ] Create `InvestmentAnalysisSchema` Pydantic model in `backend/schemas/visualization.py`.
- [ ] Implement middleware or dependency in `backend/routes/visualization.py` to check `user.is_premium`.
- [ ] Ensure the existing `visualization` CRUD supports the updated nested schema without breaking backward compatibility.

### Technical Notes
- Follow patterns in `backend/schemas/case.py` for nested JSONB validation.
- Reference `ADR-005` for schema structure.

### Definition of Done
- [x] Pydantic unit tests for the updated schema.
- [x] API integration test verifying premium gating.
- [x] Code reviewed.
- [x] Documentation updated.

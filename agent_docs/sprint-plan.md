# Sprint Plan: Modelling Tool Logic Refinement

**Goal**: Implement and verify the refined modelling logic and feedback UI.

## Sprint Backlog
1. [x] **STORY-001**: Model Logic - Raw Value Display (Complexity: 1)
2. [x] **STORY-002**: Model UI - Feasibility Alerts (Complexity: 1)
3. [x] **STORY-003**: Model UI - Price Breakdown Visibility (Complexity: 2)

## Schedule
- [x] **Day 1**: Implementation of logic change (STORY-001) and UI alerts (STORY-002) @STORY-001-modelling-logic.md.
- [x] **Day 2**: Refinement of Price Breakdown visibility (STORY-003) and linting @STORY-001-modelling-logic.md.
- [x] **Day 3**: Final verification and documentation.

---

# Sprint Plan: External User Split

## Timeline Summary
- **Total Estimated Effort**: 12 hours
- **Proposed Sprint Duration**: 2-3 Days (depending on parallelization)

## Milestone Breakdown (Phased Rollout)

### Phase 1: Foundation & Data Formalization [x]
- [x] **Research & Requirement Definition**: Formalize `user_type` split (Strategy B).
- [x] **Database Migration**: Add `user_type` enum field to `user` table (internal, external_regular, external_advanced).
- [x] **Data Cleanup & Migration**: Script to correctly update existing users based on Business Unit presence.
- [x] **Backend Model Updates**: Refactor `User` model and Pydantic schemas to support `user_type`.
- **ROI**: Cleaner database architecture; infra ready for advanced access.

### Phase 2: Advanced Access & UI Controls [/]
- [x] **API Enhancements**: Update `POST /user/register` and `PUT /user/{id}` to handle `user_type`.
- [x] **Access Logic**: Update `get_all_case` in `backend/routes/case.py` for `external_advanced` org-wide visibility.
- [ ] **Admin UI Update**: Implement conditional sub-selector for external types in `UserForm.js`.
- [ ] **Users List Update**: Modify `Users.js` table to display `user_type` labels.
- [ ] **Validation Logic**: Enforce mapping rules (Internal must have BU, External must have Company).
- [x] **Feature Restrictions (STORY-004)**: Hide Data Upload, make Optimization chart read-only, and make Advanced Modelling Tool read-only for `external_regular` (unified with Advanced for now).
- [x] **QA & Verification**: Full integration testing of access boundaries via frontend gating.
- **ROI**: Full feature delivery; granular control over partner organization access.

## Documentation Checkpoint
All research and requirements are finalized in:
- [prd.md](file:///Users/galihpratama/Sites/IDH-IDC/agent_docs/prd.md)
- [external-user-split.md](file:///Users/galihpratama/Sites/IDH-IDC/agent_docs/features/external-user-split.md)
- [external-regular-restrictions.md](file:///Users/galihpratama/Sites/IDH-IDC/agent_docs/features/external-regular-restrictions.md)
- [STORY-002 (Backend)](file:///Users/galihpratama/Sites/IDH-IDC/agent_docs/stories/STORY-002-external-user-split-backend.md)
- [STORY-003 (Frontend Split)](file:///Users/galihpratama/Sites/IDH-IDC/agent_docs/stories/STORY-003-external-user-split-frontend.md)
- [STORY-004 (Frontend Restrictions)](file:///Users/galihpratama/Sites/IDH-IDC/agent_docs/stories/STORY-004-external-regular-restrictions.md)

# Architecture Update: Data Upload Wording Refinement

## System Context
The change is a pure UI refinement within the `CaseForm` component. No structural architectural changes are required.

## ADR-007: Plain Text Labels vs. i18n
**Status**: Accepted
**Context**: The application currently uses hardcoded English strings for labels in many components.
**Decision**: Stick to literal string replacement in `CaseForm.js` to maintain consistency with the existing codebase. Introducing an i18n framework is out of scope for this task.
**Consequences**: Easier to implement quickly, but maintains the limitation of being English-only and harder to maintain across multiple files if labels are reused.

## Data Model & API Contracts
No changes required.

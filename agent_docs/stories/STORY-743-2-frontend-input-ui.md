## Story: Investment Cost Input Interface (Frontend)
**Status**: [x] COMPLETED
**As a** Business User
**I want** to input implementation costs for my modelling scenarios
**So that** I can calculate the ROI of my investment

### Timeline & Effort
- **Estimated Time**: 6h
- **Actual Time**: 5h
- **Effort Points**: 5

### Acceptance Criteria
#### User Acceptance Criteria (UAC)
- [x] "Toggle if you have an estimate of the cost required to implement the scenarios" appears below the scenario form.
- [x] Enabling the toggle reveals a "**Total investment cost**" field with unit selection.
- [x] Detailed breakdown section allows selecting "**ROI Component**" and defines "**Unit**", "**Cost**", and "**Total**" columns.
- [x] "**Total investment cost**" field becomes **read-only and locked** with an icon when detailed components are added.
- [x] Real-time multipliers (e.g., `x 100 Farmers`) are displayed in the Cost column for clarity.
- [x] Real-time "**Total**" column updates based on `Cost * Multiplier`.

#### Technical Acceptance Criteria (TAC)
- [x] Create standalone `ScenarioModelingROIForm.js` component using Ant Design.
- [x] Integrate with `CaseVisualState` (Scenario Modelling store).
- [x] Implement robust state synchronization between the detailed breakdown and the summary total.
- [x] Avoid Immer state mutation errors by using direct state updates.

### Technical Notes
- Use `InputNumberThousandFormatter` for currency inputs.
- Multipliers derived from `farmers_count` (per farmer) or are static (total).

### Definition of Done
- [x] UI verified on 1280x720.
- [x] Form state persists locally when switching scenarios.
- [x] No React hook dependency warnings.

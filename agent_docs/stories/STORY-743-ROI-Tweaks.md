# Story: ROI Cost Input Refinements (#743-Tweak)

## Description
As a user modeling scenarios, I want to see the applied cost multiplier (farmers/land) for the total investment cost and have consistent table alignment so that I can easily verify my cost assumptions.

## User Acceptance Criteria (UAC)
1. **Total Cost Unit**: [x] When "Per farmer" or "Per land unit" is selected for the total investment, a label like `x 3,000 Farmers` or `x Land Area` must appear below the input box.
2. **Total Cost Unit Visibility**: [x] If "Total Cost" is selected, the multiplier label must be hidden.
3. **Table Alignment**: [x] The "Total" column in the cost component breakdown table must be aligned to the left (instead of right).

## Technical Acceptance Criteria (TAC)
1. **Component**: [x] Modify `ScenarioModelingROIForm.js`.
2. **Context Provider**: [x] Use `Form.Item` with `shouldUpdate` or `useMemo` to detect `cost_unit` changes and render the unit text.
3. **Multiplier Logic**: [x] Ensure `farmers` and `land_size` variables from the current segment are used for the unit label.
4. **AntD Table**: [x] Change `align` property of the `Total` column definition to `"left"`.
5. **Linting**: [x] Ensure `yarn lint` passes.

## Timeline & Effort
- **Estimation**: 0.5 hours
- **Priority**: Medium (UX polish)

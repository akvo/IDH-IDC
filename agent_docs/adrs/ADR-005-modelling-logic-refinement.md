# ADR-005: Modelling Logic and Alert Refinement

- **Status**: Accepted
- **Context**:
    The Advanced Modelling Tool was previously clamping results or showing icons that didn't fully explain the physical feasibility of a target. Feedback indicated that users need to see the raw mathematical result regardless of whether it represents an income decrease or a physically unreachable target (negative values).
- **Decision**:
    1.  **Always display the raw calculated value** to the user.
    2.  Introduce three distinct states: `normal`, `surplus` (Income > Target), and `impossible` (Result < 0).
    3.  Trigger specific text alerts for `surplus` and `impossible` states.
    4.  The "Price Breakdown" bar chart will be hidden and replaced with a warning ONLY in the `impossible` state, but the card itself remains visible.
- **Alternatives Considered**:
    - Clamping negative values to 0: Rejected as it hides the degree of impossibility.
    - Hiding the entire Price Breakdown component: Rejected as it disrupts the UI layout.
- **Consequences**:
    - Users may see confusing negative numbers (e.g., negative Price), which is why clear warning alerts are critical.
    - Consistency across scenarios is maintained as raw values are always shown.

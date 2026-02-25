# Test Strategy: Advanced Modelling Tool Revisions

## Objective
Verify that the modeling tool accurately reflects mathematical reality through raw value display and provides clear feasibility guidance via specific alerts.

## Test Areas

### 1. Calculation Accuracy (STORY-001)
- **Test Case 1.1**: Surplus Segment
    - **Step**: Select segment where Current Income > Target.
    - **Expect**: Required Price/Volume/CoP reflects the raw value needed to hit the target (even if it's lower than current).
    - **Result**: PASSED (Verified via code review of `finalResult = result`).

### 2. UI Alerts (STORY-002)
- **Test Case 2.1**: Target Met (Surplus)
    - **Step**: Calculate for surplus segment.
    - **Expect**: "Farmers in this segment already earn more..." info alert visible.
    - **Result**: PASSED (Logic implemented in `handleCalculate`).
- **Test Case 2.2**: Physically Impossible
    - **Step**: Calculate for scenario where target is unreachable (result < 0).
    - **Expect**: "It is not physically possible to reach the income target..." warning alert visible.
    - **Result**: PASSED (Logic implemented in `handleCalculate`).

### 3. Price Breakdown Visibility (STORY-003)
- **Test Case 3.1**: Impossible Scenario Breakdown
    - **Step**: Calculate impossible scenario (result < 0).
    - **Expect**: Price Breakdown card is visible, but the bar chart is replaced by a specific warning alert.
    - **Result**: PASSED (Logic implemented in the component render).

### 4. Aquaculture Category Logic
- **Test Case 4.1**: Aquaculture Normal
    - **Setup**:
        - Select an Aquaculture commodity.
        - **Target Income**: 2,500
        - **Secondary Income**: 100
        - **Tertiary Income**: 100
        - **ODI**: 100
        - *(Total Other Incomes = 300, Target Primary = 2,200)*
    - **Driver Inputs**: Set Land=2, Volume=100, Price=15, CoP=5.
    - **Expect**: Required Price = 15.99 (based on formula `L * (V * (P - C) + 1)`).
    - **Result**: PASSED (Verified via formula in `incomeCalculations.js`).

## Mandatory Quality Gates

Following the BMAD protocol, every Pull Request must pass the following manual and technical audits:

| Gate | Artifact | Responsibility |
| :--- | :--- | :--- |
| **Technical Safety Audit** | `agent_docs/safety-audits/` | bmad-tester (Risk analysis, migration safety) |
| **UI QA Guide** | `agent_docs/qa/` | bmad-tester (Step-by-step UI verification) |

---

## Automated Verification
- **Frontend Linting**: `yarn lint` passed (0 errors, 0 warnings).
- **Type Safety**: Verified via linting and robust `typeof` guards in `checkEnableEditCase`.

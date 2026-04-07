# UI QA Guide - Issue #759

## Summary
Step-by-step instructions for manual validation of the IDC Academy LMS professionalization in the staging environment.

## Phase 1: Academy Library Verification
1.  Navigate to **IDC Academy**.
2.  **Verify Visual Elevation**: Module cards should have a minimalist, high-reach shadow (`0.12` opacity) and **no hover lift/scale animations**.
3.  **Check Status Lifecycle**:
    - **Available**: Tag for courses not yet started.
    - **In Progress**: Tag for courses with `completed_chapters.length > 0`.
    - **Completed**: Tag for courses with `is_completed: true`.

## Phase 2: Course Player Experience
1.  Open the **"Introduction to IDC"** module.
2.  **Verify Progress Calculation**: Confirm the header progress bar accurately reflects the ratio of completed chapters.
3.  **Check Floating Timer**: Verify the floating **`QuizTimer`** appears correctly during assessments.

## Phase 3: Premium Assessment Results
1.  Complete the module quiz.
2.  **Verify Result Card**:
    - [ ] Prominent **Gold Trophy** icon (size: `4rem`).
    - [ ] Circular metrics showing correct percentage/score.
    - [ ] Clean, branded success message.
3.  **Smart Navigation**:
    - [ ] **"Proceed to Next Module"**: Verify it correctly deep-links to the next course in the sequence.
    - [ ] **"Retake Quiz"**: Ensure it resets only the current assessment attempt.

## Verification Checklist
- [ ] Granular progress is saved across sessions.
- [ ] Legacy users see correctly normalized status tags.
- [ ] No layout regressions on 1280x720 screens.

# UX Specification: External (Regular) User Restrictions

## Overview
Standardize the visual experience for restricted users to ensure they understand why certain tools are unavailable or read-only without cluttering the interface.

## 1. Case Setup (Step 1)
### Data Upload Tab
- **Requirement**: Hide the "Data Upload" tab entirely.
- **Visual Pattern**: The `Tabs` component in `CaseForm.js` will render only the "Manual data input" key.
- **Rationale**: Reduces visual noise and prevents frustration by not showing a tool they cannot use.

## 2. Optimization Tool (Step 4)
### Interaction State
- **Input Fields**: All `InputNumber` and `Select/TreeSelect` components will use the `disabled` state (Ant Design standard low-opacity background).
- **Buttons**: "Run the model" and "Clear results" buttons will be disabled and display a `Tooltip` on hover: *"This feature is available for Internal and Advanced users only."*
- **Visual Logic**: Maintain the current chart display if results exist, ensuring the user can still consume pre-computed data.

## 3. Advanced Modelling Tool (Step 5)
### Component Gates
- **Modelling Inputs**: All inputs within scenario modelling tabs will be disabled.
- **Feasibility Icons**: Hide interactive lock icons to communicate that the entire scenario is "locked" by policy.
- **Driver Selection**: Disable the primary commodity driver dropdown.
- **Feedback**: Display a subtle `Alert` (type="info") at the top of the modelling area: *"Mode: View Only. Calculations are based on organization-wide feasible parameters."*

## 4. Backend Error Feedback
### 403 Forbidden (Case Upload)
- **Error Message**: *"Access Denied: Your user group does not have permission to upload spreadsheet data. Please contact your administrator."*
- **Frontend Handling**: `messageApi.error` will display the backend detail string to provide specific context.

## 5. Summary Table of Restricted States

| Element | User Type | Visual State |
|---------|-----------|--------------|
| Upload Tab | Regular | Hidden |
| Modeling Inputs | Regular | Disabled |
| Run Model Button | Regular | Disabled + Tooltip |
| 403 Upload Response | Regular | Global Error Alert |

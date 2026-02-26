# UX Specification: Data Upload Segmentation Flow

## Overview
This specification defines the interaction pattern for adding segments based on variables during the Data Upload process.

## Components: `SegmentGenerator` & `SegmentConfigurationForm`
The `SegmentGenerator` appears when adding new variables, and `SegmentConfigurationForm` handles the primary segmentation variable in Step 2.

### Visual Hierarchy (Robust Alignment)

1. **Top Row (Headers & Type Toggle)**:
    - **Left Col (span 12)**: Contains a nested Row. Header "Variable type" [Tooltip] on the left (span 8), and the `Radio.Group` (button style) floating right (span 16, align="end").
    - **Right Col (span 12)**: Title "Segmentation" [Tooltip] (span 24).
2. **Input Row**:
    - **Left Col (span 12)**: "Select a variable to segment by:" label followed by the `Select` input (span 24).
    - **Right Col (span 12)**: "Number of segments:" label followed by the `InputNumber` (span 24).
    - **Right Col Footer**: Help text "You can select up to 5 segments".

### Interaction Rules
- **Type Toggle**: Updates the options in the "Segmentation Variable" dropdown and resets values. Floating right for better space utilize.
- **Wording**:
    - Label: "Select a variable to segment by:"
    - Placeholder: "Select segmentation variable"
- **Tooltips**:
    - Variable type: "What type of variable do you want to use for segmentation?"
    - Segmentation: "Configure how you want to divide your data into segments."
- **Initial State**: The "Variable Type" radio is unselected (`null`). The "Variable" dropdown is disabled with placeholder "Select a variable type first".
- **Cascading Reset**: When the type is changed, the "Variable" and "Number of segments" selections are reset.

## Design Tokens
- Border Color: `#d9d9d9`
- Background (Card): `#f9f9f9`
- Radio Button Style: `optionType="button"`, `buttonStyle="solid"`
- Gutters: `[12, 18]` for outer layout, `[12, 12]` and `[12, 29]` for internal alignment.

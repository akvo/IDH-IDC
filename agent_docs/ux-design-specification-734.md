# UX Specification: Data Upload Segmentation Flow

## Overview
This specification defines the interaction pattern for adding segments based on variables during the Data Upload process.

## Components: `SegmentGenerator` & `SegmentConfigurationForm`
The `SegmentGenerator` appears when adding new variables, and `SegmentConfigurationForm` handles the primary segmentation variable in Step 2.

### Visual Hierarchy (Aligned with Reference Image)

1. **Top Row (Headers & Type Toggle)**:
    - **Left Col**: "Variable type" [Tooltip] followed by `Radio.Group` (button style).
    - **Right Col**: "Segmentation" [Tooltip].
2. **Input Row**:
    - **Left Col**: "Segmentation Variable:*" label followed by the `Select` input.
    - **Right Col**: "Number of segments:*" label followed by the `InputNumber`.
    - **Right Col Footer**: Help text "You can select up to 5 segments".

### Interaction Rules
- **Type Toggle**: Updates the options in the "Segmentation Variable" dropdown and resets values.
- **Tooltips**:
    - Variable type: "What type of variable do you want to use for segmentation?"
    - Segmentation: "How do you want to define the segments for this variable?" (derived from objective)
- **Initial State**: The "Variable Type" radio is unselected. The "Variable" dropdown is disabled.
- **Type Change**: When the type is changed, the "Variable" selection is reset to null.
- **Dropdown Population**: The dropdown is populated only with variables that match the selected type (from `uploadResult.columns[type]`).

## Design Tokens
- Border Color: `#d9d9d9`
- Background (Card): `#f9f9f9`
- Alert Margin: `marginBottom: 16px`

# Feature: Refine Data Upload Wording

## Overview
This refinement aims to clarify the user interface for data uploads by providing more descriptive text for downloading templates and uploading data. This ensures users understand they must use the specific IDH template and that it should be validated before upload.

## Problem Statement
The current labels "Download template" and "Upload your data" are generic and may not emphasize the requirement of using a specific, validated template.

## Proposed Changes
- **Update Download Button Label**: From "Download template" to "Download required data template".
- **Update Upload Section Header**: From "Upload your data" to "Upload your validated data template".

## Target Users
- **Internal Users** and **External Advanced Users** with edit permissions who are responsible for uploading case data.

## Success Metrics
- Improved clarity in the data upload workflow.
- Potential reduction in invalid data uploads due to incorrect template usage.

## Constraints and Assumptions
- **Responsive Layout**: The updated (longer) text must not cause layout breaks or horizontal overflow on screens as small as 1280 x 720 pixels.
- **Ant Design Consistency**: The implementation should leverage existing Ant Design components and grid system.

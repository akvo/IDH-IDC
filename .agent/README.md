# Antigravity Agent Configuration

This directory contains the brain and behavior configurations for the Antigravity AI agent.

## Core Components

The agent operates using three distinct layers of context and instruction:

### 1. `skills/` (The Knowledge Base)
*   **What it is**: The **Reference Manual**.
*   **File**: `skills/<skill_name>/SKILL.md`
*   **Content**: Static, foundational information about *how the code works*.
    *   Technology Stack (Language, Frameworks).
    *   Command References (Test, Lint, Build).
    *   Environment Setup logic.
*   **When used**: The agent reads this to understand the tools at its disposal (e.g., "How do I run the backend tests?").

### 2. `workflows/` (The Standard Procedures)
*   **What it is**: The **Standard Operating Procedures (SOPs)**.
*   **File**: `workflows/<workflow_name>.md`
*   **Content**: Step-by-step "recipes" for specific recurring tasks.
    *   *Examples*: "How to commit code", "How to plan a feature", "How to deploy".
*   **When used**: The agent follows these lists exactly to ensure consistency and best practices are met every time (e.g., "Always lint before committing").

### 3. `GEMINI.md` (The Living Memory)
*   **What it is**: The **Project Journal**.
*   **File**: `../GEMINI.md` (Root of project)
*   **Content**: A constantly updated log of the project's evolution.
    *   Recent Changes & PRs.
    *   Current Context & Active Tasks.
    *   Architectural decisions made along the way.
*   **When used**: The agent reads this upon starting a session to "remember" what happened yesterday and pick up exactly where it left off.

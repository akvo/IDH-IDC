---
description: Migrate from Piwik Pro to Matomo tracking
---

# Migrate from Piwik Pro to Matomo Workflow

This workflow guides you through the process of decommissioning Piwik Pro and migrating all analytics tracking to Matomo, following the project's dynamic site ID mapping.

## 🏁 Phase 1: Preparation

1.  **Audit Scripts**: Identify where Piwik Pro scripts are loaded, typically in `frontend/public/index.html`.
2.  **Audit Hooks**: Search for all occurrences of `window._paq` in `src/hooks/` and `src/components/`.

## 🚀 Phase 2: Migration

1.  **Decommission Piwik Pro**:
    -   Remove the Piwik Pro script tag from `index.html`.
    -   Delete any Piwik-specific environment variables or configuration constants.
2.  **Harden Matomo Implementation**:
    -   Ensure Matomo is initialized via the standard script tag in `index.html`.
    -   Refactor tracking hooks (e.g., `src/hooks/MatomoPageView.js`) to use isolated tracker instances.
    -   **Dynamic Site ID**: Match the `siteID` selection logic from `index.html` to ensure data routing consistency.

    ```javascript
    // Environment-based Site ID mapping
    const testEnvs = ["test", "staging"];
    const localEnvs = ["ngrok", ".dev"];
    const origin = window?.location?.origin;
    const siteID = testEnvs.some((env) => origin?.includes(env))
      ? "1"
      : localEnvs.some((env) => origin?.includes(env))
      ? "2"
      : "3";

    const tracker = window.Matomo.getTracker('https://matomo.cloud.akvo.org/matomo.php', siteID);
    tracker.trackPageView();
    ```

## ✅ Phase 3: Validation

1.  **Check Console**: Ensure no `_paq` related errors or warnings are present.
2.  **Verify Outgoing Calls**: In the browser's Network tab, filter for `matomo.php` and verify requests are sent with correct **Site ID** (1 for staging, 2 for local, 3 for prod) and custom URLs.
3.  **Confirm Dashboard**: Verify that data is appearing as expected in the Matomo cloud dashboard for the respective environment.

> [!IMPORTANT]
> Always verify that your dynamic `siteID` logic correctly identifies the current environment based on the `origin`.

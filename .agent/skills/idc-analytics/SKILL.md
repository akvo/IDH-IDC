---
name: idc-analytics
description: Guidelines for migrating from Piwik Pro to Matomo and resolving tracking conflicts.
---

# IDH-IDC Analytics Skills

Guidelines for a safe and consistent migration from Piwik Pro to Matomo tracking.

## 🚀 Migration Strategy

The goal is to decommission Piwik Pro and consolidate all tracking into Matomo.

### 1. Identify Piwik Pro Dependencies
- Search for `piwik.pro` script tags in `frontend/public/index.html`.
- Locate any custom event tracking using `window._paq` specifically for Piwik Pro.

### 2. Decommissioning Piwik Pro
- **Conditional Removal**: Remove the Piwik Pro script tag. If a rollout is needed, wrap it in a condition (e.g., `process.env.NODE_ENV === 'production'`).
- **Cleanup**: Remove any dead code or configuration variables (`PIWIK_PRO_URL`, `PIWIK_PRO_ID`).

### 3. Hardening Matomo
- Ensure Matomo is initialized before any routing events.
- **Isolation**: Use `window.Matomo.getTracker()` to ensure no collision with lingering global state.

## 🛠 Matomo Isolation Pattern (SPA)

This pattern uses dynamic `siteID` selection based on the current origin, matching the logic in `index.html`.

```javascript
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const useMatomoPageView = () => {
  const location = useLocation();
  const previousPathRef = useRef(null);

  useEffect(() => {
    if (!window.Matomo) return;
    if (previousPathRef.current === location.pathname) return;
    previousPathRef.current = location.pathname;

    // Environment-based Site ID mapping
    const testEnvs = ["test", "staging"];
    const localEnvs = ["ngrok", ".dev"];
    const origin = window?.location?.origin;
    const siteID = testEnvs.some((env) => origin?.includes(env))
      ? "1"
      : localEnvs.some((env) => origin?.includes(env))
      ? "2"
      : "3";

    const tracker = window.Matomo.getTracker(
      "https://matomo.cloud.akvo.org/matomo.php",
      siteID
    );

    tracker.setCustomUrl(window.location.href);
    tracker.setDocumentTitle(document.title);
    tracker.trackPageView();
  }, [location.pathname]);
};

export default useMatomoPageView;
```

## 🔐 Best Practices
- **No Global `_paq`**: Transition all `_paq.push` calls to isolated tracker instance methods.
- **Environment Parity**: Use the dynamic `siteID` logic to ensure data is routed correctly across local, staging, and production.

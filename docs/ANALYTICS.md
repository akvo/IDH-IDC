# Analytics & Usage Tracking (Matomo)

The IDC platform uses **Matomo Cloud** for privacy-conscious usage analytics, focused on tracking user flow through the multi-step modelling tools.

---

## 1. Implementation Overview
# Analytics Architecture

IDC uses **Matomo Cloud** as its primary analytics platform to track system usage while ensuring GDPR compliance and data privacy.

## Current Implementation: Matomo Cloud

The system is integrated with **Matomo Cloud** via a global `_paq` script and custom React hooks.

### Site ID Mapping
The tracker dynamically assigns a Site ID based on the environment to ensure data isolation:

| Environment | Pattern | Site ID | Purpose |
| :--- | :--- | :--- | :--- |
| **Production** | `idc.idhsustainability.com` | `3` | Live user tracking |
| **Staging** | `idc-test` or `staging` | `2` | QA and verification |
| **Local / Dev** | `localhost` | `1` | Developer testing |

### Implementation Details
- **Script**: The core tracker script is located in `frontend/public/index.html`.
- **Page Views**: Managed via `src/hooks/MatomoPageView.js`.
- **Custom Events**: Tracked via `src/hooks/MatomoCaseStepAnalytics.js` and direct `window._paq.push` calls for modeling actions (e.g., ROI export).

---

## [LEGACY] Piwik Pro Retirement

The system previously used **Piwik Pro**. This integration is legacy and is being phased out.

- **Status**: Redundant initialization and imports have been removed from `index.js`.
- **Next Step**: Remove Piwik Pro dependencies from `package.json` once verification is complete.

---

## GDPR & Privacy

1. **IP Anonymization**: IP addresses are masked (2 bytes) by default in the Matomo Cloud dashboard.
2. **Do Not Track**: We respect the browser's "Do Not Track" (DNT) header.
3. **Data Residency**: Data is stored on EU-based Matomo Cloud servers.

---

## 4. Privacy & Compliance (GDPR)

Matomo is intentionally selected for its strong commitment to data privacy and GDPR compliance.

### Compliance Features
*   **Internal Hosting**: Data is stored on Akvo's managed Matomo Cloud instance, not shared with third-party advertising networks.
*   **IP Anonymization**: All collected IP addresses are partially masked (e.g., `192.168.xxx.xxx`) to ensure no PII is stored.
*   **Do Not Track**: The system respects the browser's "Do Not Track" (DNT) setting natively.
*   **First-Party Cookies**: Tracking relies on first-party cookies, reducing the risk of being blocked by modern privacy-focused browsers.

---

> [!IMPORTANT]
> When implementing new tracking events, always verify the outgoing requests in the browser Network tab (filter for `matomo.php`) to ensure the correct **Site ID** is being used for your current environment.

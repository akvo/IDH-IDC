# Analytics & Usage Tracking (Matomo)

The IDC platform uses **Matomo Cloud** for privacy-conscious usage analytics, focused on tracking user flow through the multi-step modelling tools.

---

## 1. Implementation Overview
# Analytics Architecture

IDC currently utilizes a **Dual-Tracker Strategy** during a managed transition phase. This ensures continuous usage data as we migrate to centralized IDH infrastructure.

## 1. Primary Implementation: Matomo Cloud

The system is integrated with **Matomo Cloud** as the primary tracking engine.

### Site ID Mapping
The tracker dynamically assigns a Site ID based on the environment:

| Environment | Pattern | Site ID | Purpose |
| :--- | :--- | :--- | :--- |
| **Production** | `idc.idhsustainability.com` | `3` | Live user tracking |
| **Staging** | `idc-test` or `staging` | `2` | QA and verification |
| **Local / Dev** | `localhost` | `1` | Developer testing |

### Technical Integration
- **Global Script**: Initialized in `frontend/public/index.html`.
- **Event Hook**: Leverages `window._paq` for event-based tracking (Login, Modeling, Export).

---

## 2. Legacy Support: Piwik Pro

**Piwik Pro** remains active as a secondary tracker to maintain historical consistency during the transition.

- **Initialization**: Managed in `frontend/src/index.js` via `@piwikpro/react-piwik-pro`.
- **Status**: LEGACY (to be decommissioned once Matomo verification is 100% complete).

---

## 3. GDPR & Privacy

1. **IP Anonymization**: IP addresses are masked (2 bytes) by default in both Matomo and Piwik dashboards.
2. **Do Not Track**: We respect the browser's "Do Not Track" (DNT) header.
3. **Data Residency**: Data is stored on EU-based servers.

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

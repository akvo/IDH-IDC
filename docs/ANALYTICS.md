# Analytics & Usage Tracking (Matomo)

The IDC platform uses **Matomo Cloud** for privacy-conscious usage analytics, focused on tracking user flow through the multi-step modelling tools.

---

## 1. Implementation Overview
# Analytics Architecture

IDC uses a dual-tenant analytics strategy to track system usage while ensuring GDPR compliance and data privacy.

## Current Implementation: Piwik Pro

The system is currently integrated with **Piwik Pro** for usage tracking.

### Site ID Mapping
The frontend dynamically selects the Piwik Pro Site ID based on the environment's origin:

| Environment | Pattern | Site ID (UUID) |
| :--- | :--- | :--- |
| **Production** | `idc.idhsustainability.com` | `9d53ab3a-14de-4429-85e9-4afa6f570013` |
| **Staging / Local** | `test` or `localhost` | `418c8745-6f9d-4e93-946c-ef65731f366d` |

### Entry Point
Implementation is located in `frontend/src/index.js` using the `@piwikpro/react-piwik-pro` library.

---

## [PLANNED] Matomo Migration

There is a planned migration to **Matomo Cloud** to unify tracking under IDH's centralized infrastructure.

### Proposed Architecture

| Environment | Site ID | Purpose |
| :--- | :--- | :--- |
| **Production** | `3` | Live user tracking |
| **Staging** | `2` | QA and verification |
| **Local / Dev** | `1` | Developer testing |

### Implementation Details (Proposal)
*   **Library**: `react-piwik-pro` (Matomo compatible) or a custom breadcrumb wrapper.
*   **Target URL**: `https://akvo.matomo.cloud`
*   **Event Tracking**: Standardized `_paq` calls for:
    *   `Case Overview` -> `Create new case`
    *   `Standard Modelling` -> `Adjust Driver`
    *   `Advanced Modelling` -> `Compare Scenarios`

---

## GDPR & Privacy

1. **Anonymization**: IP addresses are masked (2 bytes) by default in the analytics dashboard.
2. **Do Not Track**: We respect the browser's "Do Not Track" (DNT) header.
3. **Data Residency**: Data is stored on EU-based servers (Piwik Pro / Matomo Cloud).

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

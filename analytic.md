# Evaluation of GDPR-Compliant Analytics Platforms with Custom Event Tracking

**Recommendation, Feature Assessment, and Cost Projection (Multi-Client Use Case)**

---

## 1. Executive Summary

This document evaluates GDPR-compliant analytics tools that support custom event tracking for multi-client, multi-domain environments to replace current Matomo/Piwik. The focus is on cloud-hosted solutions to reduce infrastructure overhead.

**Top Recommendation:** **PostHog Cloud**
**Rationale:** Best combination of cost-efficiency (under €5,000/year for moderate traffic multi-client setup) and custom dashboard/event capabilities similar to Matomo/Piwik.

---

## 2. Tools Included in This Evaluation

| # | Platform | Reason for Inclusion | GDPR Reference |
|---|----------|--------------------|----------------|
| 1 | **Plausible Analytics** | Strong privacy positioning, predictable pricing, supports goals/events | https://plausible.io/data-policy |
| 2 | **Fathom Analytics** | Fully GDPR-compliant, cookieless, basic event tracking | https://usefathom.com/legal/compliance/gdpr-compliant-website-analytics |
| 3 | **Umami Cloud** | Lightweight, privacy-focused, supports event tracking | https://umami.is/features |
| 4 | **PostHog Cloud** | Advanced event analytics, generous free tier | https://posthog.com/docs/privacy/gdpr-compliance |
| 5 | **Countly Cloud (Managed)** | Enterprise-grade event analytics with GDPR configuration | https://countly.com/privacy-by-design |

---

## 3. Feature Comparison: Customization & Dashboard Capabilities

| Platform | Custom Dashboard | Custom Event Visualization | Third-Party BI Needed? | Notes |
|----------|-----------------|----------------------------|----------------------|-------|
| **Plausible** | Limited (built-in) | Yes | Not required | Custom events successfully tracked, but advanced reports like Matomo/Piwik are not possible |
| **Fathom** | Limited | Basic custom events | Not required | Sign-up requires credit card; pricing depends on total page-views; not tested yet |
| **Umami Cloud** | Moderate | Yes | Not required | Email verification for cloud registration not received, so testing incomplete |
| **PostHog Cloud** | Extensive | Advanced charts, formulas, funnels, cohorts | Not required | Closest match to Matomo/Piwik; custom events and dashboards tested locally |
| **Countly Cloud** | Extensive | Fully custom dashboards, segments, funnels | Not required | Enterprise-grade; excluded due to cost |

---

## 4. Cost Ranking (Cheapest to Most Expensive, Cloud Hosted, GDPR-Compliant)

| Rank | Platform | Cost Level | GDPR Strength | Why |
|------|----------|------------|----------------|-----|
| **1** | **Fathom Analytics** | Low (based on page-views) | Very strong | Cost-effective if total page-views remain within plan limits |
| **2** | **Plausible Analytics** | Low–medium | Very strong | Predictable per-site pricing, EU-hosted, cookieless |
| **3** | **Umami Cloud** | Low–medium | Strong | Lightweight, simple event tracking |
| **4** | **PostHog Cloud** | Medium | Strong | Free tier sufficient for moderate events; advanced dashboards |
| **5** | **Countly Cloud** | High | Strong | Enterprise-grade; excluded due to cost |

---

## 5. Estimated Monthly Cost in EUR (10 Client Scenario)

**Assumptions:**
- 10 client websites
- Traffic per client: small–medium (50k–300k monthly pageviews)
- Currency conversion: USD → EUR ≈ 0.92
- Fathom pricing depends on aggregated monthly page-views

| Platform | Pricing Model | Estimated Monthly Total (EUR) | Notes |
|----------|---------------|-------------------------------|-------|
| **Fathom Analytics** | ~$15–45/mo depending on total page-views | €23–€41 | Assumes aggregated page-views ~200k–500k/month; monitor page-views to avoid cost spikes |
| **Plausible** | €9–€29 per site | €90–€290 | Predictable per-site pricing |
| **Umami Cloud** | €9–€25 per site | €90–€250 | Simple cloud-hosted model |
| **PostHog Cloud** | Free tier up to ~1M events; paid >1M | €0–€80+ | Free tier sufficient for moderate traffic; scalable beyond |
| **Countly Cloud** | Enterprise plans | €200–€600+ | Exceeds €5k/year for 10 clients; excluded |

---

## 6. Top Recommendation (Cost + Feature Similarity to Matomo/Piwik)

| Rank | Platform | Reason for Top Recommendation |
|------|----------|-------------------------------|
| **1** | **PostHog Cloud** | Best combination of cost & feature richness: supports custom events, segmentation, funnels, cohort analysis, and flexible dashboards — most similar to Matomo/Piwik. Cost remains controlled for moderate traffic multi-client setup. |
| **2** | **Plausible Analytics** | Low-cost & GDPR-friendly; sufficient for simple custom events. Dashboard limited but ideal for medium-traffic clients or simpler analytics. |
| **3** | **Umami Cloud** | Mid-level option: more flexible dashboards & custom events than Plausible, costs manageable; suitable for small to medium clients. |

> **Note:** Fathom is cost-efficient but pricing depends on aggregated page-views; Countly excluded due to cost (> €5k/year).

---

## 7. Final Recommendation for Management

- **Primary Platform:** **PostHog Cloud**
  - Best for multi-client setups needing flexible dashboards & event tracking similar to Matomo/Piwik.
  - Cost remains low for moderate traffic (free or paid tier).

- **Secondary Platform:** **Plausible Analytics**
  - Default choice for clients with medium traffic or simpler analytics needs.
  - Predictable per-site pricing, cookieless, GDPR-friendly.

- **Optional Lightweight Alternative:** **Umami Cloud**
  - For clients needing basic custom events and dashboards at lower cost.

**Summary Table: Recommended Platforms Under €5k/year**

| Platform | Annual Cost (10 clients) | GDPR | Custom Dashboard / Event Similarity to Matomo/Piwik |
|----------|--------------------------|------|---------------------------------------------------|
| **PostHog Cloud** | €0–€960+ | Strong | High: closest match to Matomo/Piwik |
| **Plausible Analytics** | €1.080–€3.480 | Very strong | Moderate: simple custom events & built-in dashboards |
| **Umami Cloud** | €1.080–€3.000 | Strong | Moderate: basic dashboards, custom events supported |
| **Fathom Analytics** | €276–€492 | Very strong | Basic: limited customization; price depends on aggregated page-views |
| **Countly Cloud** | €2.400–€7.200+ | Strong | High, but excluded due to cost |

---

## 8. Developer Notes / Local Testing

- **Plausible:** Successfully tracked custom events from local site; however, advanced custom reports like Matomo/Piwik cannot be generated.
- **PostHog:** Local event tracking works as expected, including custom page-duration and user action events; dashboard supports flexible visualization.
- **Umami:** Cloud registration blocked due to missing verification email, limiting testing.
- **Fathom:** Cost depends on aggregated page-views; signed up with a credit card for testing.
- **Countly:** Excluded due to cost.

# [#890] Feature Spec: Living Income Academy Design Feedback (Small Items)

> **Status**: DRAFT / PROPOSED  
> **Target Release**: Living Income Academy MVP Polish  
> **GitHub Issue**: [#890](https://github.com/akvo/IDH-IDC/issues/890)  
> **Source Epic Branch**: `epic/843-li-academy`  
> **Feature Branch**: `feature/890-li-academy-design-feedback`  
> **Figma Reference File**: `ga4EMPcp00Bh0d883khSs6` (Living Income Academy)  
> **Total Estimated Effort**: ~3.5 hours (Vibe Coding: 1.5h | Automated Testing: 1.0h | QA & Review: 1.0h)

---

## 1. Requirements Discovery (5W1H)

* **Who (Target Personas)**:
  * Learners, Practitioners, Partners, and General Public exploring the Living Income Academy.
* **What (Core Deliverables)**:
  1. **Footer Partner Logos**: Remove the divider line (`border-top`) above the partner logos in the footer and scale the partner logos down to a maximum height of `32px` (matching Figma node `12320:15550`).
  2. **Technical Resources & Glossary Page Subtext**: Remove the explanatory subtitle paragraph underneath the main title on the Resources & Glossary page (matching Figma node `12658:17291`).
  3. **Sidebar Navigation Wording**: Update the left sidebar navigation item from `"Academy resources"` to `"Resources & Glossary"` (matching Figma node `12320:15683`).
  4. **Academy Landing Page Hero**: Replace the hero background image with the renewed asset from Figma (`cocoa production in africa`), and reduce the hero vertical height and padding (`min-height: 32rem;`, padding: `48px 0;`) so it visually matches the other IDH toolkit landing pages (Procurement Library, Cocoa Income Inventory, and IDC) (matching Figma node `11859:46314`).
* **Where (System Locations)**:
  * `frontend/src/pages/academy/components/AcademyLayout.scss`
  * `frontend/src/pages/academy/components/AcademyFooter.js`
  * `frontend/src/pages/academy/AcademyResourcesPage.js`
  * `frontend/src/pages/academy/components/AcademySidebar.js`
  * `frontend/src/pages/academy/AcademyLanding.scss`
  * `frontend/src/assets/images/academy/hero-bg.png`
  * Unit tests: `frontend/src/pages/academy/components/__tests__/AcademyLayout.test.js`, `frontend/src/pages/academy/__tests__/AcademyResourcesPage.test.js`, `frontend/src/pages/academy/__tests__/AcademyLanding.test.js`
* **When (Timeline)**: Immediate design feedback sprint.
* **Why (User Value)**:
  * Polishes visual hierarchy and reduces unnecessary vertical scroll weight on the landing page.
  * Aligns navigation wording with user expectations and Figma specs.
  * Unifies UI design consistency across the Living Income Academy and the wider IDH toolkit ecosystem.
* **How (Technical Strategy)**:
  * Surgical CSS/SCSS and JSX updates adhering strictly to declared touchpoints.
  * Zero backend changes, zero database migrations.
  * Update existing Jest/RTL unit tests to verify updated labels and UI element presence.

---

## 2. Detailed Technical Audit & Touchpoint Specifications

### 2.1 Item 1: Footer Partner Logos (Figma Node `12320:15550`)
* **Figma Spec**:
  * Node ID: `12320:15550` ("Footer")
  * Logos container: `py-[32px]`, no top border line.
  * Logo height: `h-[32px]` (max-height 32px; compact: 24px-28px).
* **Current Implementation**:
  * In `AcademyLayout.scss`:
    ```scss
    .academy-footer-partners {
      padding: 48px var(--default-landing-padding);
      border-top: 1px solid $academy-stroke; // <-- REMOVE
      .academy-footer-partner-logo {
        max-height: 56px; // <-- CHANGE to 32px
        max-width: 220px; // <-- CHANGE to 140px
      }
    }
    ```
* **Required Changes**:
  * Remove `border-top: 1px solid $academy-stroke;`.
  * Update `.academy-footer-partner-logo`: `max-height: 32px; max-width: 140px;`.
  * Update padding to `32px var(--default-landing-padding);` (compact: `24px ...`).

### 2.2 Item 2: Resources & Glossary Page Subtext (Figma Node `12658:17291`)
* **Figma Spec**:
  * Node ID: `12658:17291` ("title section")
  * Title block only contains `Technical Resources & Glossary`. No subtitle paragraph.
* **Current Implementation**:
  * In `AcademyResourcesPage.js` (lines 145-153):
    ```jsx
    <div className="academy-resources-header">
      <h1 className="academy-resources-title">
        Technical Resources &amp; Glossary
      </h1>
      <p className="academy-resources-subtitle">
        Everything referenced inside the modules, in one place, grouped by the
        four kinds of resource.
      </p>
    </div>
    ```
* **Required Changes**:
  * Remove the `<p className="academy-resources-subtitle">` element.
  * In `AcademyResourcesPage.test.js`, remove or invert assertion for the subtitle text.

### 2.3 Item 3: Sidebar Navigation Wording & Sizing (Figma Node `12320:15683`)
* **Figma Spec**:
  * Node ID: `12320:15683` ("Side menu")
  * Main navigation list:
    1. "My overview"
    2. "Course Overview"
    3. "Resources & Glossary" (was "Academy resources")
  * Account list:
    4. "Account"
    5. "Settings"
  * Menu item padding: `px-[var(--xl,12px)]`.
* **Current Implementation & Root Cause Analysis**:
  * In `AcademySidebar.js`:
    ```javascript
    const mainMenuItems = [
      { key: routePath.academy.overview, label: "My overview", icon: <HomeOutlined /> },
      { key: routePath.academy.courses, label: "Course Overview", icon: <AppstoreOutlined /> },
      { key: routePath.academy.resources, label: "Academy resources", icon: <FolderOpenOutlined /> },
    ];
    ```
  * Sidebar width was fixed at `width={220}`. With `16px` item padding, `18px` icon, and `12px` gap, only `134px` remained for the label text. On desktop displays, `"Resources & Glossary"` (20 characters, ~150px) exceeded this boundary, causing Ant Design's `.ant-menu-title-content` (`overflow: hidden; text-overflow: ellipsis`) to truncate the label to `"Resources & Glossa..."`.
* **Required Changes**:
  * Change label from `"Academy resources"` to `"Resources & Glossary"`.
  * Adjust `Layout.Sider` width from `220px` to `240px` in `AcademySidebar.js`.
  * In `_tokens.scss`, update `$academy-item-inset` from `16px` to `12px` (matching Figma `px-[var(--xl,12px)]`) and `$academy-icon-gap` to `10px`.
  * In `AcademyLayout.scss`, add `overflow: visible; white-space: nowrap;` to `.ant-menu-title-content`.
  * In `AcademyLayout.test.js`: Update tests checking for sidebar menu item labels to verify `"Resources & Glossary"`.

### 2.4 Item 4: Landing Page Hero Banner Height & Renewed Image (Figma Node `11859:46314`)
* **Figma Spec**:
  * Node ID: `11859:46314` ("Header hero section") & Node ID: `6318:15707` ("Image Container Overlay")
  * Image asset: "cocoa production in africa" (renewed photographic asset from Figma).
  * Color overlay: In Figma, the overlay does NOT cover the entire width at full dark opacity. Instead, it uses `linear-gradient(139.55deg, rgba(28, 62, 32, 0.64) 58.896%, rgba(127, 127, 84, 0) 102.75%)` (fading into completely transparent `rgba(127, 127, 84, 0)` on the right side), leaving the photographic content on the right unobstructed and vibrant while providing contrast behind the text on the left.
  * Proportionate vertical sizing comparable to IDH tool landing pages:
    * Procurement Library: `min-height: 32rem` (512px)
    * Cocoa Income Inventory: `height: 26rem` (416px)
    * IDC: `height: 32rem` (512px)
* **Current Implementation**:
  * In `AcademyLanding.scss`:
    ```scss
    .academy-hero {
      position: relative;
      width: 100%;
      min-height: 600px; // <-- Way bigger vertically than other tool landing pages
      padding: 96px 0;   // <-- Results in 700px+ height
      .hero-overlay {
        background: linear-gradient(135deg, rgba(1, 48, 47, 0.88) 0%, rgba(1, 98, 95, 0.75) 50%, rgba(2, 35, 34, 0.85) 100%); // <-- Solid dark 85% all the way across
      }
    ```
* **Required Changes**:
  * Replace `frontend/src/assets/images/academy/hero-bg.png` with the renewed asset extracted from Figma node `11859:46314`.
  * Update `.hero-overlay` to a directional fade from dark IDH green behind the text (`rgba(2, 35, 34, 0.85) 0%`, `rgba(28, 62, 32, 0.68) 40%`) transitioning to fully transparent (`rgba(127, 127, 84, 0) 80% - 100%`) so the cocoa farm photo on the right remains clear and uncovered.
  * In `AcademyLanding.scss`, align with toolkit standard:
    * Set `min-height: 32rem;` (or `512px`).
    * Reduce padding to `48px 0;` (or `3rem 0;`).
    * On mobile/tablet (`max-width: 768px`), adjust `min-height: auto; padding: 40px 20px;` and vertical gradient for readability.

---

## 3. Scope Boundary Declaration

### 🎯 Scope Boundary Declaration
- **In-Scope Touchpoints**:
  - `[MODIFY]` `frontend/src/pages/academy/components/AcademyLayout.scss`
  - `[MODIFY]` `frontend/src/pages/academy/components/AcademySidebar.js`
  - `[MODIFY]` `frontend/src/pages/academy/AcademyResourcesPage.js`
  - `[MODIFY]` `frontend/src/pages/academy/AcademyLanding.scss`
  - `[REPLACE]` `frontend/src/assets/images/academy/hero-bg.png`
  - `[MODIFY]` `frontend/src/pages/academy/components/__tests__/AcademyLayout.test.js`
  - `[MODIFY]` `frontend/src/pages/academy/__tests__/AcademyResourcesPage.test.js`
  - `[MODIFY]` `frontend/src/pages/academy/__tests__/AcademyLanding.test.js`
- **Explicitly Out-of-Scope**:
  - Backend endpoints, database models, and Alembic migrations.
  * Other toolkit landing pages (Procurement Library, Cocoa Income Inventory, IDC core).
  * Unrelated Academy features (courses, chatbot, auth, profile settings).

---

## 4. Vibe Coding Estimation & Sprint Plan

| Task ID | Task Description | Vibe Coding (Dev) | Automated Testing | QA & Review | Total Est. | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **TASK-01** | Footer: Remove line above logos, reduce logo height to 32px | 15m | 10m | 10m | **35m** | Pending |
| **TASK-02** | Resources & Glossary: Remove subtitle subtext & align tests | 15m | 10m | 10m | **35m** | Pending |
| **TASK-03** | Sidebar: Update menu label to "Resources & Glossary" & align tests | 15m | 15m | 10m | **40m** | Pending |
| **TASK-04** | Landing Hero: Replace background image & adjust vertical height | 30m | 15m | 15m | **60m** | Pending |
| **TASK-05** | Regression Suite Pass: Run full frontend test & lint verification | 15m | 10m | 15m | **40m** | Pending |
| **TOTAL** | **Living Income Academy Design Feedback (Small Items)** | **90m (1.5h)** | **60m (1.0h)** | **60m (1.0h)** | **210m (3.5h)** | **Ready** |

---

## 5. Verification Commands

```bash
# Frontend Unit Tests (Targeted)
./dc.sh exec frontend yarn test:ci --testPathPattern="AcademyLayout|AcademyResourcesPage|AcademyLanding"

# Frontend Linter
./dc.sh exec frontend yarn lint

# Full Frontend Test Regression
./dc.sh exec frontend yarn test:ci
```

# [TLSA-015] Frontend Engineering Brief — Getting an Account (Toolkit Onboarding)

## 📌 Context & Overview
This brief defines the frontend requirements and technical specifications for **[TLSA-015] Getting an Account** (Issue [#904](https://github.com/akvo/IDH-IDC/issues/904) / Asana [1220555869358073](https://app.asana.com/1/77063628301548/project/1208636722607176/task/1220555869358073)).

All backend endpoints, mailer templates, CSPRNG token verification, and database models are **already implemented, tested (41 passing tests), and live** on the `feature/902-update-email-templates` branch.

### 🔗 Figma Design Specifications
* **Master Canvas**: [Living income academy (Node 10612:21056)](https://www.figma.com/design/ga4EMPcp00Bh0d883khSs6/Living-income-academy?node-id=10612-21056&t=mAlvljt5IA3lIADu-1)
* **Screen 1 (Academy Sign Up)**: [Figma Node 11861:52124](https://www.figma.com/design/ga4EMPcp00Bh0d883khSs6/Living-income-academy?node-id=11861-52124)
* **Screen 2 ("Check your email" Toast / Confirmation)**: [Figma Node 12942:20452](https://www.figma.com/design/ga4EMPcp00Bh0d883khSs6/Living-income-academy?node-id=12942-20452)
* **Screen 3 (Invited User "Create your account")**: [Figma Node 13044:24854](https://www.figma.com/design/ga4EMPcp00Bh0d883khSs6/Living-income-academy?node-id=13044-24854)
* **Verified Landing Alert Banners**: [Figma Node 12943:7471 / 12943:7252](https://www.figma.com/design/ga4EMPcp00Bh0d883khSs6/Living-income-academy?node-id=12943-7471)

---

## 🏛️ Architecture & DRY Standard: Shared Profile Presets

> [!IMPORTANT]
> **Zero Duplication Mandate (DRY)**:
> Profile dropdown options (`company_type`, `sector`, `region_name`, `commodities`) are currently used in the Academy User Profile (`frontend/src/pages/academy/components/AdditionalInfoCard.js`).
> **DO NOT duplicate these arrays** across registration pages. They must be centralized in a shared static module (`frontend/src/store/static.js` or `frontend/src/constants/profileOptions.js`) and imported by both:
> 1. Academy Account / My Profile (`AdditionalInfoCard.js`)
> 2. Academy Public Registration (`Register.js`)
> 3. IDC Invitation Registration (`InvitationRegister.js`)

### Shared Constants Module: `frontend/src/store/static.js`
```javascript
export const PRESET_COMPANY_TYPES = [
  "Private Sector",
  "NGO",
  "Government / Public Sector",
  "Cooperative / Farmer Organization",
  "Research / Academia",
  "Financial Institution",
  "Multilateral / Donor",
  "Consultancy",
  "Other",
];

export const PRESET_SECTORS = [
  "Agriculture",
  "Food & Beverage",
  "Apparel & Textiles",
  "Retail & Consumer Goods",
  "Financial Services",
  "Development & Philanthropy",
  "Technology & Data",
  "Other",
];

export const PRESET_REGIONS = [
  "Global",
  "West Africa",
  "East Africa",
  "Southern Africa",
  "Latin America & Caribbean",
  "Southeast Asia",
  "South Asia",
  "East Asia",
  "Europe",
  "North America",
  "Middle East & North Africa",
];

export const getOptionsWithFallback = (presets, currentValue) => {
  const options = presets.map((item) => ({ label: item, value: item }));
  if (
    currentValue &&
    typeof currentValue === "string" &&
    currentValue.trim() &&
    !presets.some((p) => p.toLowerCase() === currentValue.trim().toLowerCase())
  ) {
    return [
      { label: currentValue.trim(), value: currentValue.trim() },
      ...options,
    ];
  }
  return options;
};
```
*(Note: `commodities` is already exported from `frontend/src/store/static.js`).*

---

## 📦 Touchpoint Files

| Action | File Path | Scope |
| :--- | :--- | :--- |
| `[MODIFY]` | `frontend/src/store/static.js` | Export shared profile preset arrays and helper |
| `[MODIFY]` | `frontend/src/pages/academy/components/AdditionalInfoCard.js` | Refactor to import presets from `static.js` |
| `[MODIFY]` | `frontend/src/pages/login/Register.js` | Rebuild into 2-column Toolkit layout with mandatory profile fields & email confirmation state |
| `[CREATE]` | `frontend/src/pages/login/components/AdditionalTextBlock.js` | Right-column branded card container matching Figma Node `12935:18549` |
| `[MODIFY]` | `frontend/src/pages/login/InvitationRegister.js` (or `/invitation/:token` in `ResetPassword.js`) | Rebuild invited user onboarding with pre-filled read-only email and full profile fields |
| `[MODIFY]` | `frontend/src/pages/admin/users/UserForm.js` | Real-time Academy email check, warning alert, self-reported org display, dynamic button switch |
| `[TEST]` | `frontend/src/pages/login/__tests__/Register.test.js` | Unit tests for registration, validation, and resend link |
| `[TEST]` | `frontend/src/pages/login/__tests__/InvitationRegister.test.js` | Unit tests for token resolution and account completion |
| `[TEST]` | `frontend/src/pages/admin/users/__tests__/UserForm.test.js` | Unit tests for Academy account detection and grant IDC access |

---

## 🎯 Acceptance Criteria (UAC & TAC)

### Task 1: Shared Profile Constants Centralization (DRY)
* **User Acceptance Criteria (UAC)**:
  - [ ] **UAC-1.1 (Option Parity)**: The dropdown options for Company Type, Sector, Region, and Commodities remain identical across Academy Profile, Academy Registration, and IDC Invitation screens.
  - [ ] **UAC-1.2 (Custom Fallback)**: If a user has a custom value not in the preset list, it displays seamlessly as the selected option without data loss.
* **Technical Acceptance Criteria (TAC)**:
  - [ ] **TAC-1.1 (Single Source of Truth)**: `PRESET_COMPANY_TYPES`, `PRESET_SECTORS`, `PRESET_REGIONS`, and `getOptionsWithFallback` are exported from `frontend/src/store/static.js`.
  - [ ] **TAC-1.2 (No Code Duplication)**: `AdditionalInfoCard.js` removes duplicate local definitions and imports from `static.js`.
  - [ ] **TAC-1.3 (Zero Regression)**: Existing Academy Profile tests in `AcademyAccountPage.test.js` continue passing without modification.

---

### Task 2: Academy Self Sign-Up Screen (`/register`)
* **Figma Reference**: [Node 11861:52124](https://www.figma.com/design/ga4EMPcp00Bh0d883khSs6/Living-income-academy?node-id=11861-52124)
* **User Acceptance Criteria (UAC)**:
  - [ ] **UAC-2.1 (2-Column Toolkit Layout)**: The sign-up page renders a 2-column layout. The left column contains the header (`IDH Logo` + `"Toolkit Towards Better Incomes"`), the registration form, and footer. The right column (`AdditionalTextBlock`) displays promotional cards for **Living Income Academy** and **Income Driver Calculator (invitation only)**.
  - [ ] **UAC-2.2 (Header & Subtitle)**: Displays heading `"No account yet?"` (or `"Create your Academy account"`) and subtitle: *"Learn how to understand, measure and close living income gaps. Creating an account is free and takes a few minutes: fill in your details, confirm your email address, and you can start right away."*
  - [ ] **UAC-2.3 (Form Controls & Grid)**:
    - **Row 1**: `first_name` (mandatory text) and `last_name` (mandatory text) side-by-side.
    - **Row 2**: `email` (mandatory valid email) and `password` (mandatory password input with show/hide toggle).
    - **Row 3**: `company_name` (mandatory text with autocomplete suggestions from existing companies) and `company_type` (`Select` from shared presets).
    - **Row 4**: `sector` (`Select` from shared presets) and `region_name` (`Select` from shared presets).
    - **Row 5**: `commodities` (`Select mode="multiple"` with tag display).
  - [ ] **UAC-2.4 (Live Password Criteria)**: Renders live `PasswordCriteria` checklist below the password field (at least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character). All items update dynamically as the user types.
  - [ ] **UAC-2.5 (Context Callout & Consent)**: Displays callout *"This account gives you access to the Living Income Academy. The Income Driver Calculator is available by invitation: send an email to livingincome@idhtrade.org."* and a checkbox agreeing to terms and data security provision.
  - [ ] **UAC-2.6 (Navigation Links)**: Displays primary button `"Get started"` (or `"Create account"`) and link `"Already have an account? Log in"` pointing to `/login`.
* **Technical Acceptance Criteria (TAC)**:
  - [ ] **TAC-2.1 (API Payload)**: Submitting the form dispatches `POST /user/register-academy` with:
    ```json
    {
      "first_name": "Jane",
      "last_name": "Doe",
      "email": "jane@coop.org",
      "password": "Password123!",
      "company_name": "Coop Western",
      "company_type": "Cooperative / Farmer Organization",
      "sector": "Agriculture",
      "region_name": "West Africa",
      "commodities": ["Cocoa", "Coffee"]
    }
    ```
  - [ ] **TAC-2.2 (Client-Side Validation)**: Form blocks submission and highlights errors if any mandatory field is empty, email format is invalid, password does not satisfy all 5 criteria, or terms checkbox is unchecked.
  - [ ] **TAC-2.3 (Error Handling)**: Backend HTTP 409 (User already exists) or 422 errors are displayed via Ant Design `message.error` or inline alert.

---

### Task 3: "Check Your Email" Confirmation & Resend Flow
* **Figma Reference**: [Node 12942:20452](https://www.figma.com/design/ga4EMPcp00Bh0d883khSs6/Living-income-academy?node-id=12942-20452)
* **User Acceptance Criteria (UAC)**:
  - [ ] **UAC-3.1 (Email Confirmation Toast / View)**: Upon successful sign-up submission, the page renders the confirmation alert:
    > *"Please confirm your email address first. We sent a link to **{registeredEmail}** when you signed up. Can’t find it? Check your spam folder or **send the link again**."*
  - [ ] **UAC-3.2 (Resend Link Trigger)**: Clicking **"send the link again"** dispatches a verification link resend and provides immediate user feedback: *"We sent a new link."*
  - [ ] **UAC-3.3 (Back Navigation)**: Includes links to edit the email address or return to `/login`.
* **Technical Acceptance Criteria (TAC)**:
  - [ ] **TAC-3.1 (API Integration)**: Resend action calls `POST /user/resend-verification` (or `/user/resend-academy-verification`) with payload `{ "email": registeredEmail }`.
  - [ ] **TAC-3.2 (Cooldown / Throttle UX)**: Disables the resend trigger during pending requests (`loading=true`) and applies a temporary 30-second cooldown to prevent spam.

---

### Task 4: Admin "Add User" Popup — Existing Academy User Detection (`UserForm.js`)
* **Visual Reference**: Admin "Add user" modal
* **User Acceptance Criteria (UAC)**:
  - [ ] **UAC-4.1 (Dynamic Academy Account Check)**: When an admin types an email in the "Add user" modal, the system checks whether an account already exists.
  - [ ] **UAC-4.2 (Existing User Warning Banner)**: If the email belongs to an existing Academy user who does not have IDC access:
    * Displays informational banner:
      > *"This person already has an Academy account. Giving IDC access adds the calculator to their account; they keep their current login."*
    * Shows the user's self-reported organisation next to the IDC Company selector:
      > **Self-reported organisation**: *{user.academy_company}*
    * The primary submit button switches from `"Send invitation"` to: **`"Give IDC access"`**.
  - [ ] **UAC-4.3 (New User Invitation Flow)**: If the email does not exist in the database, the modal retains the standard `"Send invitation"` button.
* **Technical Acceptance Criteria (TAC)**:
  - [ ] **TAC-4.1 (Debounced Verification)**: Triggers `GET /user/check-academy-email?email={email}` debounced by 300ms on email change/blur.
  - [ ] **TAC-4.2 (Grant IDC Access API)**: Submitting with `"Give IDC access"` dispatches `POST /user/grant-idc-access` with:
    ```json
    {
      "user_id": 142,
      "company_id": 10,
      "role": "user",
      "user_type": "external_regular",
      "business_unit_ids": []
    }
    ```
  - [ ] **TAC-4.3 (Feedback & Close)**: On success, displays `message.success("IDC access granted successfully")` and closes the modal.

---

### Task 5: IDC Invited User "Create Your Account" (`/invitation/:token`)
* **Figma Reference**: [Node 13044:24854](https://www.figma.com/design/ga4EMPcp00Bh0d883khSs6/Living-income-academy?node-id=13044-24854)
* **User Acceptance Criteria (UAC)**:
  - [ ] **UAC-5.1 (2-Column Layout & Header)**: Opens from the invitation email link (`/invitation/:token`). Displays title `"Create your account"` and intro: *"IDH invited you to the Income Driver Calculator. Your account also gives you access to the Living Income Academy."*
  - [ ] **UAC-5.2 (Pre-filled Read-Only Email)**: The `email` field is pre-filled from the invitation token and locked (disabled / read-only).
  - [ ] **UAC-5.3 (Pre-filled Company)**: The `company_name` field is pre-populated with the company assigned by the IDH Admin.
  - [ ] **UAC-5.4 (Complete Profile Fields)**: Prompts for the same mandatory fields as Academy sign-up (`first_name`, `last_name`, `password` with criteria checklist, `company_type`, `sector`, `region_name`, `commodities`).
  - [ ] **UAC-5.5 (Login Redirect with Banner)**: On successful account creation, redirects user to `/login` displaying banner (Figma Node `12943:7252`):
    > **"Your account is ready. Log in to start using the Income Driver Calculator and the Living Income Academy."**
* **Technical Acceptance Criteria (TAC)**:
  - [ ] **TAC-5.1 (Token Resolution)**: On component mount, calls `GET /user/invitation/{invitation_id}` to retrieve `{ email, company_id, company_name }`. Invalid or expired tokens render an alert with a link to request a new invitation.
  - [ ] **TAC-5.2 (Account Completion API)**: Submitting dispatches `POST /user/complete-invitation/{invitation_id}` with:
    ```json
    {
      "first_name": "Jane",
      "last_name": "Doe",
      "password": "Password123!",
      "company_name": "Olam",
      "company_type": "Private Sector",
      "sector": "Agriculture",
      "region_name": "West Africa",
      "commodities": ["Cocoa"]
    }
    ```
  - [ ] **TAC-5.3 (Session Bootstrap)**: If `access_token` is returned, sets session auth cookie or redirects to `/login` with success banner state.

---

## 🧪 Verification & Testing Strategy

```bash
# 1. Run Frontend Unit Tests
./dc.sh exec frontend yarn test:ci --testPathPattern="Register|UserForm|VerifyAcademy|AdditionalInfo" --runInBand

# 2. Run Full Frontend Test Suite
./dc.sh exec frontend yarn test:ci

# 3. Run Frontend Linter & Prettier
./dc.sh exec frontend yarn lint
./dc.sh exec frontend yarn prettier-write
```

### Coverage Gate
* New components must maintain **$\ge 80\%$ test coverage** across statements and branches.
* ESLint and Prettier must pass with **0 warnings / 0 errors**.

# Academy Public Registration & Token Verification Flow (Spec 003)

## Overview
This specification details the architecture, endpoint contracts, security constraints, and UI flows for **[TLSA-003] / Issue #861** (`Registration: Academy Public Sign-Up & Token Verification Flow`), expanding the **IDH Better Income Toolkit**.

---

## 1. Architecture & Endpoints

### 1.1 Endpoints
- **`POST /user/register-academy`**:
  - Request DTO: `UserRegisterAcademy` (`fullname`, `email`, `password`, `company_name`)
  - Enforces server-side password validation: $\ge 8$ characters, at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special symbol.
  - Case-insensitive email collision defense returning `HTTP 409 Conflict`.
  - Creates inactive `User` with `is_active=0`, `role=user`, `user_type=external_regular`, `tools=['academy']`, and a 256-bit entropy token in `invitation_id` via `secrets.token_hex(32)`.
  - Provisions `UserProfile` via `crud_profile.get_or_create_user_profile()` storing organizational name in `user_profile.company_name`.
  - Dispatches `ACADEMY_REGISTRATION_VERIFY` email linking to `${base_url}/verify-academy?token=${token}`.
  - Returns `HTTP 201 Created` with confirmation message.

- **`GET /user/verify-academy`**:
  - Query parameter: `token: str`.
  - Resolves token against `User.invitation_id`.
  - Sets `is_active=1` and nullifies `invitation_id=None` (one-time activation / replay attack defense).
  - Browser navigation (`Accept: text/html`): issues `HTTP 302 Found` redirect to `/login?verified=true`.
  - API consumers: returns `HTTP 200 OK` JSON with `{"message": "...", "verified": true}`.
  - Replay / expired / missing tokens: returns `HTTP 400 Bad Request`.

---

## 2. Mailpit Local Email Testing
- Added `mailpit` service to `docker-compose.yml` (`image: axllent/mailpit:latest`).
- Port mappings: `1025:1025` (SMTP relay) and `8025:8025` (Web UI).
- `docker-compose.yml`: Added `${EMAIL_HOST:-mailpit}` and `${EMAIL_PORT:-1025}` fallback defaults to backend service environment.
- `backend/utils/mailer.py`: Port 1025 automatically disables STARTTLS and SSL defaults for local development.

---

## 3. Frontend Architecture
- **`Register.js`**: Dedicated public registration form for the Living Income Academy with live, compact `PasswordCriteria` validation, organization name input, and seamless card-free email verification confirmation view.
- **`VerifyAcademy.js`**: Standalone verification page displaying loading spinner, seamless success outcome, or error guidance with navigation back to sign in.
- **`Login.js`**: Renders a proportional, theme-aligned emerald notification banner (`.verified-notification-banner`) when redirected with `?verified=true`.
- **`paths.js` & `App.js`**: Registered `/register`, `/verify-academy`, and `/login` routes.

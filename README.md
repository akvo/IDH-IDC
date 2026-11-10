# IDH-IDC (Income Driver Calculator)

[![Build Status](https://github.com/akvo/IDH-IDC/actions/workflows/test.yml/badge.svg)](https://github.com/akvo/IDH-IDC/actions/workflows/test.yml?query=main) [![Repo Size](https://img.shields.io/github/repo-size/akvo/IDH-IDC)](https://img.shields.io/github/repo-size/akvo/IDH-IDC) [![Languages](https://img.shields.io/github/languages/count/akvo/IDH-IDC)](https://img.shields.io/github/languages/count/akvo/IDH-IDC) [![Issues](https://img.shields.io/github/issues/akvo/IDH-IDC)](https://img.shields.io/github/issues/akvo/IDH-IDC) [![Last Commit](https://img.shields.io/github/last-commit/akvo/IDH-IDC/main)](https://img.shields.io/github/last-commit/akvo/IDH-IDC/main)

The **Income Driver Calculator (IDC)** is a web application designed to help organizations evaluate living income benchmarks, model agricultural supply chain interventions, and calculate Return on Investment (ROI) to close the living income gap for smallholder farmers.

---

## 🌐 Service Access URLs

| Service | Local URL | Notes |
| :--- | :--- | :--- |
| **Frontend (React)** | [http://localhost:3000](http://localhost:3000) | Main User Interface |
| **Backend API (FastAPI)** | [http://localhost:8000](http://localhost:8000) | REST API Endpoint |
| **API Documentation** | [http://localhost:8000/docs](http://localhost:8000/docs) | Swagger UI Interactive Docs |
| **pgAdmin** | [http://localhost:5050](http://localhost:5050) | PostgreSQL Management Tool |

---

## ⚡ Quick Start (Local Setup)

### Prerequisites

- **Docker Desktop** `>= v20.10`
- **Docker Compose** `>= v2.0`
- Available ports: `3000` (Frontend), `8000` (Backend API), `5432` (PostgreSQL), `5050` (pgAdmin).

---

### Step 1: Environment Configuration

Copy the template environment file to `.env`:

```bash
cp .env.example .env
```

> [!NOTE]
> For local development, default values in `.env.example` work out of the box. Email relay (`EMAIL_HOST`) can remain empty during local development; email sending actions will log cleanly to stdout.

---

### Step 2: Start Application Containers

Use the project's `./dc.sh` wrapper (which manages Docker Compose & Docker Sync):

```bash
# Create sync volume (required for initial setup)
docker volume create idc-docker-sync

# Start all container services in detached mode
./dc.sh up -d
```

Check running container status:

```bash
./dc.sh ps
```

---

### Step 3: Seed Database & Master Data

Once containers are up and PostgreSQL is healthy, seed the master benchmarks and initial user account:

```bash
# 1. Seed living income benchmarks & master questions
./dc.sh exec backend ./seed_master.sh

# 2. Seed initial admin user
./dc.sh exec backend python -m seeder.user
```

**Default Credentials**:
- **Email**: `admin@akvo.org`
- **Password**: `password`

Open [http://localhost:3000](http://localhost:3000) and sign in!

---

## 🧭 Core Domain & The 5-Step Calculator Journey

The primary workflow of the calculator centers on **Cases**, leading users through five sequential analytical steps:

| Step | Name | Core Purpose |
| :---: | :--- | :--- |
| **1** | **Set Income Target** | Select country, sub-region, currency, and Living Income Benchmark. |
| **2** | **Enter Income Data** | Define farmer segments (up to 5), baseline yields, prices, COP, and off-farm income. |
| **3** | **Compare Income Gap** | Visualize current farmer incomes against the living income benchmark across all segments. |
| **4** | **Assess Impact of Mitigation Strategies** | Explore single, two, and three-driver sensitivity to see what changes close the gap. |
| **5** | **Closing the Gap (Scenario Modelling & ROI)** | Model custom intervention scenarios, allocate intervention costs, and analyze ROI. |

For mathematical formulas and calculation logic, refer to:
- [`docs/INCOME_CALCULATION.md`](./docs/INCOME_CALCULATION.md) — Living income and farmer income gap calculations.
- [`docs/INVESTMENT_CALCULATION.md`](./docs/INVESTMENT_CALCULATION.md) — Cost allocation and Return on Investment (ROI) models.
- [`docs/LLD.md`](./docs/LLD.md) — Low-level technical architecture and ADRs.

---

## 📂 Repository Layout

```text
├── backend/
│   ├── alembic/              # Database migration scripts
│   ├── models/               # SQLAlchemy ORM entities (Case, User, Benchmark, etc.)
│   ├── routes/               # FastAPI endpoints (/api/v1/...)
│   ├── seeder/               # Database seed scripts for users and test data
│   ├── source/               # Master benchmark source CSVs and data transformers
│   └── tests/                # Pytest unit and integration test suite (220+ tests)
├── frontend/
│   ├── public/               # Static web assets
│   └── src/
│       ├── components/       # Reusable UI primitives, layouts, and ECharts wrappers
│       ├── pages/
│       │   ├── cases/        # Core 5-step calculator workflow, charts, and state
│       │   ├── academy/      # Living Income Academy landing and player
│       │   └── procurement-library/ # Procurement best-practices library
│       └── store/            # Global UI and case state management
├── db/                       # PostgreSQL container initialization scripts
├── docs/                     # Domain specifications, calculation specs, and LLD
│   └── features/             # Feature-specific technical designs and specs
├── .agent/                   # Multi-agent engineering configs, rules, and workflows
└── dc.sh                     # Docker Compose wrapper script
```

---

## 🔑 Environment Variables Reference

Environment variables are defined in `.env` (copied from `.env.example`) and passed to Docker containers on startup.

| Variable Name | Default Value | Category | Description |
| :--- | :--- | :--- | :--- |
| `EMAIL_HOST` | `"localhost"` | SMTP Email | SMTP Relay server address. Leave empty during local dev to log emails locally. |
| `EMAIL_PORT` | `"587"` | SMTP Email | SMTP Relay port (`587` for STARTTLS, `465` for implicit SSL). |
| `EMAIL_HOST_USER` | `""` | SMTP Email | Authenticated SMTP username / account. |
| `EMAIL_HOST_PASSWORD` | `""` | SMTP Email | Authenticated SMTP password or app-specific key. |
| `EMAIL_USE_TLS` | `"true"` | SMTP Email | Enable STARTTLS encryption (`"true"` for port 587; mutually exclusive with SSL). |
| `EMAIL_USE_SSL` | `"false"` | SMTP Email | Enable implicit SSL encryption (`"true"` for port 465; mutually exclusive with TLS). |
| `EMAIL_FROM` | `""` | SMTP Email | Custom `From:` sender email address (e.g. `idc-noreply@akvo.org`). Falls back to `EMAIL_HOST_USER` if empty. |
| `DATABASE_URL` | *(Pre-set in docker-compose)* | Database | PostgreSQL connection string (`postgresql://idc:password@db:5432/idh_idc`). |
| `SECRET_KEY` | *(Pre-set in docker-compose)* | Security | Secret key used for signing JWT authentication tokens. |

---

## 🧪 Testing & Code Quality

> [!IMPORTANT]
> Always execute commands inside containers via `./dc.sh exec`. Do not run bare `pytest`, `flake8`, `yarn`, or `npm` commands directly on the host machine.

### Backend Commands (FastAPI / Python)

```bash
# Run backend pytest suite (220+ unit & integration tests)
./dc.sh exec backend pytest

# Run verbose pytest with keyword filter
./dc.sh exec backend pytest -k "test_001_auth" -v

# Run backend Flake8 linter
./dc.sh exec backend flake8
```

### Frontend Commands (React / JavaScript)

```bash
# Run frontend unit tests (CI mode)
./dc.sh exec frontend yarn test:ci

# Run frontend ESLint audit
./dc.sh exec frontend yarn lint

# Run Prettier automatic code formatter
./dc.sh exec frontend yarn prettier-write
```

---

## 🛠️ Common Operations & Development Commands

### Viewing Logs

Follow real-time container output:

```bash
# View all logs
./dc.sh logs -f

# View specific service logs (backend, frontend, db, pgadmin)
./dc.sh logs -f backend
./dc.sh logs -f frontend
```

### Restarting & Rebuilding Services

```bash
# Restart individual services
./dc.sh restart backend
./dc.sh restart frontend

# Rebuild containers after Dockerfile or dependency updates
./dc.sh build
./dc.sh up -d
```

### Database Migrations (Alembic)

```bash
# Check current migration revision
./dc.sh exec backend alembic current

# Generate a new migration revision from SQLAlchemy model changes
./dc.sh exec backend alembic revision --autogenerate -m "describe_migration"

# Run pending migrations
./dc.sh exec backend alembic upgrade head
```

### Managing Dependencies

```bash
# Add a frontend package
./dc.sh exec frontend yarn add <package_name>

# Add a backend package:
# 1. Add package to backend/requirements.txt
# 2. Rebuild the backend container:
./dc.sh build backend && ./dc.sh up -d backend
```

### Stopping Services

```bash
# Stop running containers
./dc.sh stop

# Stop containers and remove networks/volumes
./dc.sh down -t1
```

---

## 🤝 Git & Contribution Workflow (Akvo Standard)

To maintain a clean and traceable Git history, all contributors must follow Akvo engineering guidelines:

1. **Integration Branch (`staging`)**:
   - Feature branches must always branch off from **`staging`** (never directly from `main`).
   - Pull requests must target **`staging`** for QA verification before deployment.

2. **Branch Naming Standard**:
   - Format: `feature/<issue_number>-<short-description>` or `fix/<issue_number>-<short-description>`
   - Examples: `feature/844-academy-landing-page`, `fix/832-zero-driver-input`

3. **Commit Message Format**:
   - Format: `[#issue_number] <type>(<scope>): <description>`
   - Allowed Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
   - Example: `[#844] feat(academy): add responsive roadmap section`

4. **Linear History Mandate**:
   - Always use `git pull --rebase origin staging` instead of `git merge` to avoid merge commits.

5. **Targeted File Staging**:
   - Stage explicit touchpoint files only (`git add path/to/file.js`).
   - Never run blanket `git add .` or `git add -A` at the repository root.

---

## ❓ Troubleshooting & FAQs

- **Port `5432` Conflict**:
  If Docker fails with `bind: address already in use` on port 5432, you likely have a local PostgreSQL server running. Stop the local service (`brew services stop postgresql` on macOS or `sudo service postgresql stop` on Linux) before running `./dc.sh up -d`.
- **Database Connection Refused during Seeding**:
  PostgreSQL takes a few seconds to initialize on a fresh volume. If `seed_master.sh` fails with `connection refused`, wait 10 seconds and re-run the command.
- **Docker Sync Volume Missing**:
  If `./dc.sh up` warns about a missing volume `idc-docker-sync`, run:
  ```bash
  docker volume create idc-docker-sync
  ```
- **File Changes Not Reflecting in Containers**:
  Restart the respective container (`./dc.sh restart frontend` or `./dc.sh restart backend`).

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

### Restarting Services

```bash
./dc.sh restart backend
./dc.sh restart frontend
```

### Database Migrations (Alembic)

```bash
# Check current migration revision
./dc.sh exec backend alembic current

# Run pending migrations
./dc.sh exec backend alembic upgrade head
```

### Stopping Services

```bash
# Stop running containers
./dc.sh stop

# Stop containers and remove networks/volumes
./dc.sh down -t1
```

---

## 📚 Architecture & Documentation

- **Frontend**: React application (Create React App, Ant Design, ECharts).
- **Backend**: FastAPI service with SQLAlchemy ORM and Alembic migrations.
- **Database**: PostgreSQL 14.
- **Feature Documentation**: Standardized feature specifications and LLDs located under [`docs/features/`](./docs/features/).

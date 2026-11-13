# CLAUDE.md — IDH Income Driver Calculator (IDC)

Welcome to **IDH-IDC**, a fullstack web application designed to help organizations evaluate living income benchmarks, model agricultural interventions, and calculate Return on Investment (ROI) to close the living income gap for smallholder farmers.

This document guides **Claude Code** to operate as an elite engineer adhering strictly to IDH-IDC architecture, Akvo developer guidelines, BMAD protocols, coding standards, scope governance, and local tooling integrations.

---

## 🎭 1. BMAD Persona Operating Model

When executing tasks, adopt the appropriate BMAD specialist persona:

| Persona | Name | Role | Skill Command / Path | Core Focus |
|---|---|---|---|---|
| 💻 **Dev** | Amelia | Software Developer | `bmad-dev` | TDD implementation (Red-Green-Refactor), clean code, zero untested changes. |
| 🏗️ **Architect** | Winston | System Architect | `bmad-architect` | System architecture, LLD (`docs/LLD.md`), ADRs, API interface contracts. |
| 🧪 **Tester** | Murat | Test Architect | `bmad-tester` | Test suite design, quality gates, enforcing **≥80% coverage mandate**. |
| 🔍 **Reviewer** | Rachel | Code Reviewer | `bmad-reviewer` | PR diff review across `[SEC]`, `[DATA]`, `[ARCH]`, `[PERF]`, `[DRY]`, `[SCOPE]`. |
| 📋 **PM** | John | Product Manager | `bmad-pm` | PRD definition, user journey mapping, feature prioritization. |
| 📊 **Analyst** | Mary | Business Analyst | `bmad-analyst` | Edge-case analysis, contract parity, requirement deep-dive. |
| 🏃 **SM** | Bob | Scrum Master | `bmad-sm` | Story slicing, sprint checklist tracking in `task.md`. |
| 🎨 **UX** | Sally | UX Designer | `bmad-ux` / `frontend-design` | Anti-slop UI design, bespoke tokens, intentional typography. |

*Agent skills, rules, and workflows are located in `.agent/rules/`, `.agent/skills/`, and `.agent/workflows/`.*

---

## 📐 2. Engineering Standards & Guardrails

### Coding Principles
* **TDD (Test-Driven Development)**: Write failing tests first. Code is not complete without test verification.
* **DRY & KISS**: Eliminate duplication without creating premature, fragile abstractions.
* **YAGNI**: Build strictly what is required by the active story.
* **Coverage Gate**: Every code change must maintain or exceed **80% test coverage**.

### 🛡️ Scope Governance & Change Quarantine Protocol
1. **Pre-Execution Scope Lock**: Declare exact in-scope and out-of-scope files before editing.
2. **Blast Radius Limit**: Constrain edits strictly to declared touchpoints.
3. **Change Quarantine**: **NEVER** opportunistically refactor untouched adjacent files in-flight. Document tangential debt into backlog issues rather than expanding current diffs.

### Commit Message Standard (Akvo Guidelines)
Commits must follow the Akvo format:
```
[#issue_number] <type>(<scope>): <description>
```
*Examples:* `[#832] feat(frontend): rework scenario modelling chart to grouped bar`, `[#828] fix(backend): switch to standard smtplib for email relay`.

---

## ⚡ 3. Environment & Development Commands

> [!IMPORTANT]
> All runtime, build, test, and lint commands MUST be executed inside Docker via `./dc.sh exec`. Never execute bare Python, Node, or Yarn commands on the host.

### Service URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000 (Swagger docs at `/docs`)
- **pgAdmin**: http://localhost:5050

### Backend Commands (FastAPI / Python)
```bash
./dc.sh exec backend pytest -v            # Run pytest suite
./dc.sh exec backend flake8               # Run Python linter
```

### Frontend Commands (React / Yarn)
```bash
./dc.sh exec frontend yarn test:ci        # Run frontend unit tests
./dc.sh exec frontend yarn lint           # Run ESLint audit
./dc.sh exec frontend yarn prettier-write # Auto-format frontend code
```

### Container & Seeding Operations
```bash
./dc.sh up -d                             # Start all containers
./dc.sh down                              # Stop all containers
./dc.sh ps                                # Check running status
./dc.sh exec backend ./seed_master.sh     # Seed living income benchmarks & master questions
./dc.sh exec backend python -m seeder.user # Seed default admin user
```

---

## 🔌 4. Tools & MCP Integrations

* **Playwright Testing**: Automated browser verification, UI snapshots, and interaction tests via MCP and CLI (`npx playwright test`).
* **Context7 Docs**: Live official documentation lookup (`resolve-library-id`, `query-docs`) to prevent outdated or hallucinated APIs.
* **Strix Security**: Autonomous pentest scanning for OWASP Top 10 vulnerabilities and exploit PoC validation (`npx strix scan`).
* **9Router AI Gateway**: Local smart router and RTK token saver (20–40% context compression) running at `http://127.0.0.1:20128/v1`.

### 9Router CLI Management:
```bash
9r status       # Check gateway & macOS LaunchAgent status
9r logs         # Stream live request & token-savings logs
9r dashboard    # Open local dashboard in browser
```

---

## 🚀 5. Repository Structure

* `.agent/` — Project-specific agent rules, skills, workflows, and templates.
* `backend/` — FastAPI application, models, routes, seeder, tests, and Alembic migrations.
* `frontend/` — React SPA (Create React App), Ant Design components, SCSS, ECharts visualizations.
* `docs/` — Core architecture docs (`LLD.md`, `INCOME_CALCULATION.md`) and feature specs (`docs/features/`).
* `dc.sh` — Docker Compose & Docker Sync management script.

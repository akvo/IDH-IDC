# [#013] Feature Spec: IDC Academy AI Chatbot Integration (MVP)

> **Status**: DRAFT / PROPOSED  
> **Target Release**: IDC Academy MVP  
> **Approach**: `akvo-rag` (main branch as-is) + `akvo-rag-js` (customized launcher icon UI)  
> **Total Effort**: ~10.0 hours (3 Major Work Packages)

---

## 1. Requirements Discovery (5W1H)

* **Who (Target Personas)**: 
  * IDC Academy Learners & Practitioners browsing Living Income Academy modules who need immediate answers on definitions, formulas, living income benchmarks, and course guidance.
* **What (Core Deliverable)**: 
  * An embedded, branded AI chatbot widget mounted across IDC Academy pages.
  * Powered by `akvo-rag` (WebSocket streaming) and bundled via `akvo-rag-js`.
  * Customized with IDC brand palette (`#007A78`), custom bot launcher icon/avatar, and start-minimized state.
* **Where (System Locations)**:
  1. `akvo-rag-js` (`~/Sites/akvo-rag-js`): UI enhancement for customizable floating launcher button, custom icon/avatar rendering, and dynamic brand coloring.
  2. `akvo-rag` (`~/Sites/akvo-rag`): Tenant registration for IDC, dedicated Knowledge Base creation (`idc-academy-kb`), and curriculum document ingestion.
  3. `IDH-IDC` (`frontend/src/pages/academy`): React integration wrapper mounting the widget inside `AcademyLayout.js`.
* **When (Timeline)**: MVP rollout for Living Income Academy.
* **Why (User Value)**: 
  * Learners can ask natural language questions while taking courses without navigating away or filing support tickets.
  * MVP uses existing infrastructure without risking backend delays.
* **How (Technical Flow)**:
  1. `akvo-rag-js` is patched with customizable launcher icon and theme support, built, and released.
  2. IDC is registered as an app in `akvo-rag`, and Academy curriculum is uploaded to a dedicated KB.
  3. IDC frontend initializes `initChat(...)` on `/academy/*` routes with IDC-specific bot icons and WebSocket URL.
  4. Learner clicks floating icon $\rightarrow$ widget expands $\rightarrow$ user chats via WebSocket to `akvo-rag`.

---

## 2. Architecture & Data Flow

```mermaid
sequenceDiagram
    autonumber
    actor Learner as Academy Learner
    participant UI as IDC Academy Frontend (React)
    participant Widget as akvo-rag-js Chatbox Widget
    participant WS as akvo-rag WebSocket Gateway
    participant RAG as akvo-rag Pipeline (LangGraph + ChromaDB)
    participant LLM as OpenAI (Synthesis)

    Learner->>UI: Visits /academy/*
    UI->>Widget: initChat({ title, kb_id, wsURL, launcherIcon, primaryColor })
    Widget-->>UI: Mounts floating circular launcher bubble (#akvo-rag-launcher)
    
    Learner->>Widget: Clicks launcher icon
    Widget->>Widget: Expands chat window (#akvo-rag)
    Widget->>WS: WebSocket connect (auth / visitor ID)
    WS-->>Widget: Connection established
    
    Learner->>Widget: Sends question: "What is Living Income Benchmark?"
    Widget->>WS: Send message payload
    WS->>RAG: LangGraph query workflow
    RAG->>RAG: ChromaDB similarity search (Academy KB)
    RAG->>LLM: Stream completion with context
    LLM-->>WS: Token stream
    WS-->>Widget: WebSocket text chunks
    Widget-->>Learner: Real-time streamed answer with citations
```

---

## 3. Work Package Breakdown (Asana Tasks)

Instead of micro-tasks, the implementation is organized into **3 high-level, cohesive work packages**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       IDC Academy Chatbot MVP (Epic)                        │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        ▼                              ▼                              ▼
┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
│       PACKAGE 1         │  │       PACKAGE 2         │  │       PACKAGE 3         │
│ akvo-rag-js Enhancement │  │ akvo-rag KB Ingestion & │  │ IDC Frontend Integration│
│ (Launcher & Custom UI)  │  │ App Tenant Connection   │  │ & E2E Verification      │
│  [Est: 3.5 hrs]         │  │  [Est: 3.0 hrs]         │  │  [Est: 3.5 hrs]         │
└─────────────────────────┘  └─────────────────────────┘  └─────────────────────────┘
```

---

### IAC-001: `akvo-rag-js` Package Enhancement (Launcher & Custom UI)
* **Goal**: Modernize the widget with a floating circular launcher button (FAB), dynamic theme colors, and custom icon support.
* **Scope**:
  * **Floating Launcher (FAB)**: Add `#akvo-rag-launcher` circular bubble (`56x56px`) at bottom-right. Support `startMinimized: true` so the widget mounts as a discrete button rather than an intrusive 360x500 box.
  * **Customizable Icons**: Add `launcherIcon` and `headerIcon` options supporting SVG strings, image URLs, or FontAwesome classes.
  * **Brand Theming**: Expose `--akvo-primary` CSS custom property to dynamically inherit IDC's primary teal (`#007A78`).
  * **Quality & Release**: Add DOM unit tests for new options, verify webpack production bundle (`dist/`), and run `./release.sh patch`.
* **Deliverable**: Published NPM package (or linked build) ready for IDC consumption.

---

### IAC-002: `akvo-rag` Tenant Connection & Academy KB Ingestion
* **Goal**: Prepare the knowledge base backend, register IDC as an authorized app, and ingest curriculum data.
* **Scope**:
  * **App & Tenant Registration**: Register IDC in `akvo-rag` (`apps` table: `app_name: "IDC Academy"`, generate client ID/access tokens, configure domain whitelisting and WebSocket permissions).
  * **Curriculum Content Extraction**: Export IDC Academy curriculum (all active Modules, Chapters, and Glossary terms from `backend/seeder/academy.py` and course content) into structured Markdown / Text documents.
  * **Knowledge Base Creation & Upload**: Create `IDC Living Income Academy` KB in `akvo-rag`, upload documents to MinIO S3, and trigger async ingestion worker (`vector-kb-mcp`).
  * **Search & Retrieval Verification**: Validate that ChromaDB embeddings are indexed and test raw query retrieval via WebSocket or MCP endpoint.
* **Deliverable**: Active, tested KB ID and connection credentials for IDC.

---

### IAC-003: IDC Frontend Integration & End-to-End Verification
* **Goal**: Mount the chatbot across IDC Academy, wire environment configurations, and verify user experience.
* **Scope**:
  * **Package Setup & Config**: Install/update `akvo-rag-js` in `frontend/package.json`. Add `.env.example` configurations (`REACT_APP_AKVO_RAG_WS_URL`, `REACT_APP_AKVO_RAG_KB_ID`).
  * **React Wrapper Component**: Create `frontend/src/pages/academy/components/AcademyChatbot.js`. Integrate into `AcademyLayout.js` with clean mounting and unmount cleanup (`chat.destroy()`).
  * **Asset & Style Harmonization**: Add IDC branded SVG/PNG bot icon asset. Set primary color to `#007A78`. Ensure z-index layering avoids conflicts with headers and notifications.
  * **Regression & Verification Pass**: Run `./dc.sh exec frontend yarn lint` and `yarn test:ci`. Perform full browser walkthrough across desktop and mobile viewports.
* **Deliverable**: Live, production-ready AI chatbot in IDC Academy.

---

## 4. Estimation Table for Asana ⏱️

> Tasks follow the 3-part Vibe Coding breakdown: **Vibe Coding (Dev)** + **Automated Testing** + **QA & Review** = **Total Est. Time**.

| Task ID | Task Title (Asana Task) | Vibe Coding (Dev) | Automated Testing | QA & Review | Total Est. Time | Priority |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **IAC-001** | **`akvo-rag-js` Launcher & Custom UI Enhancement**<br>Add floating circular bubble, `startMinimized`, custom icon/avatar support, CSS `--akvo-primary`, unit tests & patch release. | 1.8h | 1.0h | 0.7h | **3.5h** | P0 (Must) |
| **IAC-002** | **`akvo-rag` Tenant Connection & Academy KB Ingestion**<br>Register IDC app in `akvo-rag`, extract curriculum & glossary to markdown, create KB, upload/ingest into ChromaDB & verify. | 1.5h | 0.8h | 0.7h | **3.0h** | P0 (Must) |
| **IAC-003** | **IDC Frontend Integration & End-to-End Verification**<br>Mount `AcademyChatbot.js` in `AcademyLayout.js`, wire env vars, apply IDC branding/assets, full test pass & browser smoke test. | 1.7h | 1.0h | 0.8h | **3.5h** | P0 (Must) |
| **TOTAL** | **Full MVP AI Chatbot Integration** | **5.0h** | **2.8h** | **2.2h** | **10.0h (~1.25 days)** | |

---

## 5. Post-MVP Backlog (Phase 2 - ToC RAG & Deep Links)
* `[BACKLOG-01]` Generic Markdown header chunker in `vector-kb-mcp`.
* `[BACKLOG-02]` `source_url` metadata passthrough in `query_answering_workflow.py`.
* `[BACKLOG-03]` Clickable module/chapter link rendering in `akvo-rag-js` markdown parser (`/academy/modules/:id?chapter=:id`).

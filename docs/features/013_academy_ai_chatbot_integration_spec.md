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

### CHAT-001: `akvo-rag-js` Package Enhancement (Launcher & Custom UI)
* **Goal**: Modernize the widget with a floating circular launcher button (FAB), dynamic theme colors, and custom icon support.
* **Scope**:
  * **Floating Launcher (FAB)**: Add `#akvo-rag-launcher` circular bubble (`56x56px`) at bottom-right. Support `startMinimized: true` so the widget mounts as a discrete button rather than an intrusive 360x500 box.
  * **Customizable Icons**: Add `launcherIcon` and `headerIcon` options supporting SVG strings, image URLs, or FontAwesome classes.
  * **Brand Theming**: Expose `--akvo-primary` CSS custom property to dynamically inherit IDC's primary teal (`#007A78`).
  * **Quality & Release**: Add DOM unit tests for new options, verify webpack production bundle (`dist/`), and run `./release.sh patch`.
* **Deliverable**: Published NPM package (or linked build) ready for IDC consumption.
* **User Acceptance Criteria (UAC)**:
  - [ ] **UAC-1.1 (Floating Launcher Button)**: By default (or when `startMinimized: true`), a floating circular launcher icon (`56x56px`) renders in the bottom-right corner of the host page (`bottom: 24px; right: 24px; z-index: 99998`), without obstructing the main content with an open chatbox.
  - [ ] **UAC-1.2 (Toggle & Expand)**: Clicking the floating launcher smoothly reveals the chatbox container (`#akvo-rag`) and hides the floating button.
  - [ ] **UAC-1.3 (Minimize / Close)**: Clicking the close/minimize button in the chat header hides the chatbox container and restores the floating launcher button.
  - [ ] **UAC-1.4 (Custom Icon Support)**: When `launcherIcon` is passed, the launcher displays the custom SVG icon, image URL, or font icon; if omitted, it defaults to a clean comment bubble icon.
  - [ ] **UAC-1.5 (Header Avatar / Icon)**: When `headerIcon` is passed, an icon or avatar is rendered in the chat header adjacent to the title text.
  - [ ] **UAC-1.6 (Theme Color Harmonization)**: The launcher button and chat header background adapt to the provided primary color without hardcoded blue defaults.
* **Technical Acceptance Criteria (TAC)**:
  - [ ] **TAC-1.1 (Backward Compatibility)**: Existing `akvo-rag-js` consumers with standard options (`title`, `kb_id`, `wsURL`) continue functioning without breaking changes.
  - [ ] **TAC-1.2 (Icon Prop Sanitization)**: `_renderIcon` safely renders SVG markup, image URLs (`.svg`, `.png`, `http...`), or CSS classes (`fa ...`), sanitizing any inline HTML via DOMPurify to prevent XSS (`[SEC]`).
  - [ ] **TAC-1.3 (CSS Custom Variables)**: Uses `--akvo-primary` variable in SCSS for launcher, header, send button, and citation highlights; sets inline style on container when `options.primaryColor` is specified.
  - [ ] **TAC-1.4 (Automated Unit Tests)**: Unit tests in `akvo-rag-js/tests/` verify DOM creation of `#akvo-rag-launcher`, visibility toggling when launcher and close button are clicked, `startMinimized: true` behavior, and SVG/image/font-icon rendering branches.
  - [ ] **TAC-1.5 (Build & Release Gate)**: `npm test` passes 100%; `npm run build` generates valid `dist/akvo-rag.js` and `dist/akvo-rag.css`; patch version bumped in `package.json`.

---

### CHAT-002: `akvo-rag` Tenant Connection & Academy KB Ingestion
* **Goal**: Prepare the knowledge base backend, register IDC as an authorized app, and ingest curriculum data.
* **Scope**:
  * **App & Tenant Registration**: Register IDC in `akvo-rag` (`apps` table: `app_name: "IDC Academy"`, generate client ID/access tokens, configure domain whitelisting and WebSocket permissions).
  * **Curriculum Content Extraction**: Export IDC Academy curriculum (all active Modules, Chapters, and Glossary terms from `backend/seeder/academy.py` and course content) into structured Markdown / Text documents.
  * **Knowledge Base Creation & Upload**: Create `IDC Living Income Academy` KB in `akvo-rag`, upload documents to MinIO S3, and trigger async ingestion worker (`vector-kb-mcp`).
  * **Search & Retrieval Verification**: Validate that ChromaDB embeddings are indexed and test raw query retrieval via WebSocket or MCP endpoint.
* **Deliverable**: Active, tested KB ID and connection credentials for IDC.
* **User Acceptance Criteria (UAC)**:
  - [ ] **UAC-2.1 (Domain-Accurate Knowledge Base)**: Chatbot answers questions accurately regarding IDC Living Income concepts, Benchmarks, the 6 curriculum modules, chapter takeaways, and glossary terms.
  - [ ] **UAC-2.2 (Out-of-Scope Fallback)**: For questions not covered by the curriculum, the assistant responds politely without fabricating living income figures or external policies.
  - [ ] **UAC-2.3 (Fast Streaming Feedback)**: User receives instant token-by-token streaming responses without timeout errors or dropped connections.
* **Technical Acceptance Criteria (TAC)**:
  - [ ] **TAC-2.1 (Tenant & App Security)**: An active record is created in `akvo-rag`'s `apps` table (`app_id`, `client_id`, `app_name: "IDC Academy"`, `domain`, `scopes: ["chat", "read:kb"]`). Access token generated and scoped securely (`[SEC]`).
  - [ ] **TAC-2.2 (Curriculum Ingestion Pipeline)**: All 6 Modules, Chapters (including `content_html` converted to clean text/markdown), and Glossary terms from `backend/seeder/academy.py` are exported into structured Markdown documents.
  - [ ] **TAC-2.3 (MinIO S3 & ChromaDB Sync)**: Documents are uploaded to MinIO bucket and processed through `mcp-vector-kb-ingestion`. Verify all chunks exist in `vkb_document_chunks` table and embeddings exist in ChromaDB collection `kb_<id>`.
  - [ ] **TAC-2.4 (Hermetic Query Verification)**: Verify end-to-end retrieval via Redis RPC / WebSocket: querying *"What is Living Income Benchmark?"* returns top-3 relevant chunks with cosine similarity score $\ge 0.70$.

---

### CHAT-003: IDC Frontend Integration & End-to-End Verification
* **Goal**: Mount the chatbot across IDC Academy, wire environment configurations, and verify user experience.
* **Scope**:
  * **Package Setup & Config**: Install/update `akvo-rag-js` in `frontend/package.json`. Add `.env.example` configurations (`REACT_APP_AKVO_RAG_WS_URL`, `REACT_APP_AKVO_RAG_KB_ID`).
  * **React Wrapper Component**: Create `frontend/src/pages/academy/components/AcademyChatbot.js`. Integrate into `AcademyLayout.js` with clean mounting and unmount cleanup (`chat.destroy()`).
  * **Asset & Style Harmonization**: Add IDC branded SVG/PNG bot icon asset. Set primary color to `#007A78`. Ensure z-index layering avoids conflicts with headers and notifications.
  * **Regression & Verification Pass**: Run `./dc.sh exec frontend yarn lint` and `yarn test:ci`. Perform full browser walkthrough across desktop and mobile viewports.
* **Deliverable**: Live, production-ready AI chatbot in IDC Academy.
* **User Acceptance Criteria (UAC)**:
  - [ ] **UAC-3.1 (Global Academy Presence)**: The floating bot icon appears across all `/academy/*` routes (`/academy`, `/academy/modules/:id`, `/academy/resources`, `/academy/account`, `/academy/settings`).
  - [ ] **UAC-3.2 (IDC Branding Alignment)**: The launcher icon displays the official IDC robot/chat icon in IDH brand teal (`#007A78`), perfectly matching the Academy layout tokens.
  - [ ] **UAC-3.3 (Non-Intrusive Layout)**: Chat window and floating button do not overlap key Academy controls (like "Continue learning" buttons or mobile sidebar toggles) and maintain comfortable margin on mobile viewports ($\le 768px$).
  - [ ] **UAC-3.4 (Session & Error Handling)**: If WebSocket connection disconnects or network fails, an inline reconnecting status is shown gracefully without crashing the React tree.
* **Technical Acceptance Criteria (TAC)**:
  - [ ] **TAC-3.1 (Hermetic Component Lifecycle)**: `AcademyChatbot.js` wraps `initChat` in `useEffect`. On unmount or route transition away from Academy (e.g. navigation to `/cases` or `/tool`), invokes `chat.destroy()`, closes WebSocket, and cleans up DOM nodes to eliminate memory leaks.
  - [ ] **TAC-3.2 (Environment Configuration)**: Exposes `REACT_APP_AKVO_RAG_WS_URL` and `REACT_APP_AKVO_RAG_KB_ID` in `.env.example`. Throws a descriptive console warning (and fails closed safely) if env vars are missing.
  - [ ] **TAC-3.3 (Z-Index & CSS Scoping)**: Styles are encapsulated inside `#akvo-rag` and `#akvo-rag-launcher`; z-index set to `9999` (under full-screen modal overlays, but above Academy sticky header).
  - [ ] **TAC-3.4 (Automated Quality Gates)**: Frontend unit test (`AcademyChatbot.test.js`) verifies component mounting, props forwarding, and destroy cleanup call on unmount; `./dc.sh exec frontend yarn lint` passes with 0 ESLint errors/warnings; `./dc.sh exec frontend yarn test:ci` passes 100% across all suites.

---

## 4. Estimation Table for Asana ⏱️

> Tasks follow the 3-part Vibe Coding breakdown: **Vibe Coding (Dev)** + **Automated Testing** + **QA & Review** = **Total Est. Time**.

| Task ID | Task Title (Asana Task) | Vibe Coding (Dev) | Automated Testing | QA & Review | Total Est. Time | Priority |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **CHAT-001** | **`akvo-rag-js` Launcher & Custom UI Enhancement**<br>Add floating circular bubble, `startMinimized`, custom icon/avatar support, CSS `--akvo-primary`, unit tests & patch release. | 1.8h | 1.0h | 0.7h | **3.5h** | P0 (Must) |
| **CHAT-002** | **`akvo-rag` Tenant Connection & Academy KB Ingestion**<br>Register IDC app in `akvo-rag`, extract curriculum & glossary to markdown, create KB, upload/ingest into ChromaDB & verify. | 1.5h | 0.8h | 0.7h | **3.0h** | P0 (Must) |
| **CHAT-003** | **IDC Frontend Integration & End-to-End Verification**<br>Mount `AcademyChatbot.js` in `AcademyLayout.js`, wire env vars, apply IDC branding/assets, full test pass & browser smoke test. | 1.7h | 1.0h | 0.8h | **3.5h** | P0 (Must) |
| **TOTAL** | **Full MVP AI Chatbot Integration** | **5.0h** | **2.8h** | **2.2h** | **10.0h (~1.25 days)** | |

---

## 5. Post-MVP Backlog (Phase 2 - ToC RAG & Deep Links)
* `[BACKLOG-01]` Generic Markdown header chunker in `vector-kb-mcp`.
* `[BACKLOG-02]` `source_url` metadata passthrough in `query_answering_workflow.py`.
* `[BACKLOG-03]` Clickable module/chapter link rendering in `akvo-rag-js` markdown parser (`/academy/modules/:id?chapter=:id`).

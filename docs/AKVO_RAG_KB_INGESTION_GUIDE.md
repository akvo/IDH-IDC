# Akvo RAG Knowledge Base Ingestion & Deep-Link Naming Guide

> **Audience**: Curriculum Creators, Project Managers, and System Administrators  
> **Applicability**: Akvo RAG shared global prompt & IDH-IDC Living Income Academy integration  
> **Last Updated**: November 2026  

---

## 1. Global System Prompt Specification

When `akvo-rag` does not support per-Knowledge Base prompts, the prompt below is designed to be **safe to run globally across all multi-tenant Knowledge Bases** (including non-Academy projects like Akvo Flow, WASH data, and agriculture datasets).

### The Recommended Global Prompt Snippet

> **Important**: In LangChain / `ChatPromptTemplate`, single curly braces `{...}` are treated as template variables. To prevent LangChain from throwing `INVALID_PROMPT_INPUT`, use double curly braces `{{...}}` or angle brackets `<...>` as shown below.

Copy and paste this exact snippet into the `akvo-rag` system prompt:

```text
### REFERRAL LINKS & CITATION RULES
1. If and only if a retrieved context chunk comes from a source file whose name strictly follows the pattern 'module-<X>-chapter-<Y>-*.pdf' (where <X> is the module number and <Y> is the chapter number), append a referral link at the end of your response formatted as:
   📖 You can learn more in [Module <X>, Chapter <Y>: <Chapter Title>](/academy/modules/<X>?chapter=<Y>)

   Example:
   📖 You can learn more in [Module 1, Chapter 2: Living Income vs Living Wage](/academy/modules/1?chapter=2)

2. Strict Negative Constraints:
   - If the source filename does NOT match the 'module-<X>-chapter-<Y>-*' pattern, NEVER generate any '/academy/' links.
   - Never guess, extrapolate, or invent module or chapter numbers.
   - Never output relative URLs starting with '/academy/' unless the source filename explicitly specifies both module and chapter numbers.
```

### Why is this Safe for Non-Academy Knowledge Bases?
1. **Explicit Pattern Guard**: Non-Academy documents (e.g. `water_point_mapping_2024.pdf`, `survey_results.xlsx`, `wash_policy_guidelines.pdf`) never follow the `module-{X}-chapter-{Y}-*` prefix.
2. **Deterministic Trigger**: The condition evaluates to `false` for any general document, ensuring the LLM does not generate `/academy/` links for non-Academy queries.
3. **Explicit Prohibition**: Modern LLMs (GPT-4o, Claude 3.5 Sonnet) adhere strongly to negative constraints (`"If it does not match... NEVER generate..."`), preventing hallucinations across unrelated domains.

---

## 2. File Naming Rules for Academy Curriculum

To trigger the deep-link prompt correctly, all files uploaded to the Academy Knowledge Base **MUST** strictly adhere to this naming standard:

### Standard Syntax
```text
module-{moduleId}-chapter-{chapterNumber}-{short-slug}.pdf
```

| Component | Format | Allowed Characters | Example |
| :--- | :--- | :--- | :--- |
| **Prefix** | `module-` | Lowercase literal | `module-` |
| **Module ID** | `{moduleId}` | Integer (`1`, `2`, `3`...) | `1` |
| **Delimiter** | `-chapter-` | Lowercase literal | `-chapter-` |
| **Chapter No.** | `{chapterNumber}` | Integer (`1`, `2`, `3`...) | `2` |
| **Slug** | `-{short-slug}` | Kebab-case descriptive slug | `-living-income-vs-wage` |
| **Extension** | `.pdf` | Lowercase `.pdf` | `.pdf` |

### ✅ Valid Filename Examples
* `module-1-chapter-1-why-living-income-matters.pdf`
* `module-1-chapter-2-living-income-vs-wage.pdf`
* `module-1-chapter-3-idh-roadmap-principles.pdf`
* `module-2-chapter-1-measuring-income-gap.pdf`
* `module-3-chapter-4-cost-allocation-strategies.pdf`

### ❌ Invalid Filenames (Will NOT Trigger Links)
* `Module 1 Chapter 2.pdf` (Contains spaces, uppercase, no hyphens)
* `module_1_chapter_2.pdf` (Uses underscores instead of hyphens)
* `module-1-the-concept-of-living-income.pdf` (Missing `-chapter-{Y}-` segment)
* `ch2-living-wage.pdf` (Missing `module-{X}-` prefix)
* `module-1-chapter-two.pdf` (Uses words instead of digits)

---

## 3. Curriculum Mapping Reference Table

Below is the standard mapping for Living Income Academy curriculum files:

| Module | Chapter | Lesson Title | Required Upload Filename | Generated UI Deep-Link |
| :---: | :---: | :--- | :--- | :--- |
| **1** | 1 | Why Living Income Matters to Farmers and Companies | `module-1-chapter-1-why-living-income-matters.pdf` | `/academy/modules/1?chapter=1` |
| **1** | 2 | Living Income vs Living Wage: Understanding Distinction | `module-1-chapter-2-living-income-vs-wage.pdf` | `/academy/modules/1?chapter=2` |
| **1** | 3 | Key Principles of the IDH Roadmap on Living Income | `module-1-chapter-3-idh-roadmap-principles.pdf` | `/academy/modules/1?chapter=3` |
| **1** | 4 | Setting Organizational Ambition and Scope | `module-1-chapter-4-setting-ambition-and-scope.pdf` | `/academy/modules/1?chapter=4` |
| **2** | 1 | Calculating the Living Income Benchmark | `module-2-chapter-1-calculating-benchmark.pdf` | `/academy/modules/2?chapter=1` |
| **2** | 2 | Assessing Current Actual Income | `module-2-chapter-2-assessing-actual-income.pdf` | `/academy/modules/2?chapter=2` |
| **2** | 3 | Identifying and Measuring the Income Gap | `module-2-chapter-3-measuring-income-gap.pdf` | `/academy/modules/2?chapter=2` |
| **3** | 1 | Overview of Key Income Drivers | `module-3-chapter-1-overview-income-drivers.pdf` | `/academy/modules/3?chapter=1` |

*(Follow the exact same pattern for Modules 4 through 6).*

---

## 4. Pre-Upload Checklist

Before uploading any file to `akvo-rag`:

- [ ] **1. Per-Chapter Granularity**: Each PDF contains only one chapter. (Do not upload 50-page full module books as a single file, as chunks will lack chapter-specific attribution).
- [ ] **2. Searchable Text (No Scans)**: Ensure the PDF text is selectable and searchable. If exported from Figma or InDesign, ensure text was not converted to outlines/curves.
- [ ] **3. Strict Filename Check**:
  - Contains only lowercase letters, digits, and hyphens.
  - Matches regex `^module-\d+-chapter-\d+-[a-z0-9-]+\.pdf$`.
- [ ] **4. Clear Chapter Title inside Content**: The first page or header of the PDF clearly displays the chapter title so the LLM can extract `{Chapter Title}` for the link text.

---

## 6. How Deep-Link Chapter Resolution Works (Dynamic vs. Fallback)

### Question: Do we have to manually map every new module and chapter in the code?
**No.** New modules and chapters do **not** require code updates as long as uploaded documents adhere to the filename standard.

### Two-Tier Resolution Architecture

The chatbot UI in `AcademyChatbot.js` resolves citation clicks using a two-tier mechanism:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Retrieved Citation Metadata                           │
│             (source filename, popover target, or citation text)             │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
                     ┌───────────────────────────────────┐
                     │ Tier 1: Dynamic Regex Extraction  │
                     │  /module-(\d+)-chapter-(\d+)/i    │
                     └─────────────────┬─────────────────┘
                                       │
                      Matches pattern? │
                     ┌─────────────────┴─────────────────┐
                     │                                   │
                  YES│                                 NO│
                     ▼                                   ▼
       ┌───────────────────────────┐       ┌───────────────────────────┐
       │ ✅ Dynamic Routing        │       │ 🛡️ Semantic Fallback      │
       │ Extracts Module X & Ch. Y │       │ Checks core curriculum    │
       │ -> /academy/modules/X?ch=Y│       │ keywords (wage vs income, │
       │                           │       │ benchmark, roadmap, etc.) │
       │ **100% AUTOMATIC FOR ALL  │       │                           │
       │ NEW MODULES & CHAPTERS**  │       │ (Graceful fallback for    │
       │ Zero code changes needed! │       │ legacy/external PDFs)     │
       └───────────────────────────┘       └─────────────┬─────────────┘
                                                         │
                                        Keyword matched? │
                                        ┌────────────────┴───────────────┐
                                     YES│                              NO│
                                        ▼                                ▼
                          ┌───────────────────────────┐    ┌───────────────────────────┐
                          │ Routes to mapped chapter  │    │ Non-curriculum citation   │
                          │ e.g. Module 1, Chapter 2  │    │ (No navigation triggered) │
                          └───────────────────────────┘    └───────────────────────────┘
```

1. **Tier 1: Dynamic Regex Extraction (Primary — Fully Automated)**
   - When a document is named `module-3-chapter-4-cost-allocation.pdf`, regex instantly extracts `module = 3` and `chapter = 4` without touching any code.
   - When Module 3, 4, 5, or 6 are launched, simply name the uploaded PDFs following `module-{X}-chapter-{Y}-*.pdf`. The frontend automatically handles navigation.

2. **Tier 2: Semantic Topic Fallback (Secondary — Defensive Safety Net)**
   - Why was this added? In development KB `753`, general reference PDFs were uploaded with legacy names (e.g. `Fair Producer Prices.pdf`, `Defining, Calculating and Using a Living Income Benchmark...pdf`).
   - When learners asked questions like *"what is living wage?"*, vector search matched these legacy PDFs. Because they lacked `module-X-chapter-Y` in their filenames, regex alone returned `null`.
   - The semantic fallback ensures that even if an administrator uploads an unformatted reference PDF or external paper, clicks on topics like "wage distinction", "roadmap principles", or "benchmarks" still guide the learner to the relevant Academy lesson instead of failing silently.


After ingesting the documents into the Knowledge Base:

1. **Test Academy Question**:
   - Ask a chapter-specific question:  
     *"What is the difference between living income and living wage?"*
   - **Expected Output**:  
     The bot gives the definition and ends with:  
     `📖 You can learn more in [Module 1, Chapter 2: Living Income vs Living Wage](/academy/modules/1?chapter=2)`
   - Click the link in IDC Academy to verify that React Router navigates seamlessly without a page reload.

2. **Test Non-Academy Question (Safety Test)**:
   - Ask a question derived from a non-module document in another KB:  
     *"What is the procedure for water point maintenance?"*
   - **Expected Output**:  
     The bot answers without any `/academy/` links or module mentions.

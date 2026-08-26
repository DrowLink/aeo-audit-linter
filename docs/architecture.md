# AEO Linter Architecture Guide (Lighthouse Pattern)

This document provides a technical walkthrough of how `aeo-linter` is architected, heavily inspired by the internal architecture of [GoogleChrome/lighthouse](https://github.com/GoogleChrome/lighthouse).

---

## 1. Core Principles

1. **Deterministic Separation of Concerns**: Gathering raw data is strictly separated from calculating scores.
2. **Pure Audits**: Audits do not perform network requests or touch the DOM directly. They receive an immutable snapshot of `Artifacts` and evaluate it purely.
3. **Modular Extensibility**: Adding a new metric requires only creating a new `Audit` class (and a `Gatherer` if new raw data is required).
4. **Platform Agnostic Core**: The core engine (`@aeo-linter/core`) has no CLI or browser-extension dependencies and can run in any environment with a `Driver`.

---

### 2. The 3-Phase Pipeline + CI/CD Quality Gates

```
  ┌─────────────────────────────────────────────────────────┐
  │                    1. GATHER PHASE                      │
  │                                                         │
  │  Target URL ──▶ Driver / Cheerio / Chrome CDP           │
  │                     │                                   │
  │                     ├──▶ URLGatherer                    │
  │                     ├──▶ RobotsTxtGatherer              │
  │                     ├──▶ HttpHeadersGatherer            │
  │                     ├──▶ JSONLDGatherer                 │
  │                     ├──▶ MetaTagsGatherer               │
  │                     ├──▶ HeadingsHierarchyGatherer      │
  │                     ├──▶ ContentChunksGatherer          │
  │                     ├──▶ DirectAnswersGatherer          │
  │                     └──▶ LlmsTxtGatherer                │
  └─────────────────────────────┬───────────────────────────┘
                                │
                                ▼
                       Typed `Artifacts`
                                │
  ┌─────────────────────────────┴───────────────────────────┐
  │                    2. AUDIT PHASE                       │
  │                                                         │
  │  Pure deterministic functions consuming `Artifacts`:    │
  │                                                         │
  │  [AI Accessibility & Crawling] (25 pts)                 │
  │    ├── ai-robots-txt (w: 9) ────▶ AuditResult           │
  │    ├── ai-x-robots-tag (w: 7) ──▶ AuditResult           │
  │    ├── ai-llms-txt (w: 6) ──────▶ AuditResult           │
  │    └── ai-bot-sitemap (w: 3) ───▶ AuditResult           │
  │                                                         │
  │  [Structured Data & RAG Schemas] (25 pts)               │
  │    ├── rag-schema-presence (w: 8) ──▶ AuditResult       │
  │    ├── jsonld-syntax-validity (w: 7)▶ AuditResult       │
  │    ├── author-eeat-presence (w: 6) ─▶ AuditResult       │
  │    └── entity-sameas-links (w: 4) ──▶ AuditResult       │
  │                                                         │
  │  [Content Chunking & Semantic Structure] (25 pts)       │
  │    ├── heading-hierarchy (w: 7) ────▶ AuditResult       │
  │    ├── semantic-containers (w: 6) ──▶ AuditResult       │
  │    ├── chunk-token-density (w: 6) ──▶ AuditResult       │
  │    └── table-list-scannability (w: 6)▶ AuditResult      │
  │                                                         │
  │  [Direct Answer Density & Fact Grounding] (25 pts)      │
  │    ├── direct-definition-answering (w: 8)▶ AuditResult  │
  │    ├── concise-answer-wordcount (w: 6) ──▶ AuditResult  │
  │    ├── fact-citation-density (w: 6) ─────▶ AuditResult  │
  │    └── question-heading-alignment (w: 5) ▶ AuditResult  │
  └─────────────────────────────┬───────────────────────────┘
                                │
                                ▼
  ┌─────────────────────────────┴───────────────────────────┐
  │                  3. AGGREGATE PHASE                     │
  │                                                         │
  │  Config & Weights:                                      │
  │    Category Score = Σ(Audit Score * Weight) / Σ(Weight) │
  │    Overall Score  = Σ(Cat Score * Weight) / Σ(Weight)   │
  └─────────────────────────────┬───────────────────────────┘
                                │
                                ▼
                   `AeoReportResult` Object
                                │
       ┌────────────────────────┼────────────────────────┐
       ▼                        ▼                        ▼
Terminal Reporter        HTML Interactive         CI/CD Quality Gate
  (ANSI Colors)        Lighthouse Dashboard      `evaluateQualityGates`
                                                 (`--fail-under 80`)
```

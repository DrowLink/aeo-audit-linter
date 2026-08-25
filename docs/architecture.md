# AEO Linter Architecture Guide (Lighthouse Pattern)

This document provides a technical walkthrough of how `aeo-linter` is architected, heavily inspired by the internal architecture of [GoogleChrome/lighthouse](https://github.com/GoogleChrome/lighthouse).

---

## 1. Core Principles

1. **Deterministic Separation of Concerns**: Gathering raw data is strictly separated from calculating scores.
2. **Pure Audits**: Audits do not perform network requests or touch the DOM directly. They receive an immutable snapshot of `Artifacts` and evaluate it purely.
3. **Modular Extensibility**: Adding a new metric requires only creating a new `Audit` class (and a `Gatherer` if new raw data is required).
4. **Platform Agnostic Core**: The core engine (`@aeo-linter/core`) has no CLI or browser-extension dependencies and can run in any environment with a `Driver`.

---

## 2. The 3-Phase Pipeline

```
  ┌─────────────────────────────────────────────────────────┐
  │                    1. GATHER PHASE                      │
  │                                                         │
  │  Target URL ──▶ Driver / Cheerio / CDP                  │
  │                     │                                   │
  │                     ├──▶ URLGatherer                    │
  │                     ├──▶ RobotsTxtGatherer              │
  │                     ├──▶ HttpHeadersGatherer            │
  │                     ├──▶ JSONLDGatherer                 │
  │                     ├──▶ MetaTagsGatherer               │
  │                     ├──▶ HeadingsHierarchyGatherer      │
  │                     ├──▶ ContentChunksGatherer          │
  │                     └──▶ DirectAnswersGatherer          │
  └─────────────────────────────┬───────────────────────────┘
                                │
                                ▼
                       Typed `Artifacts`
                                │
  ┌─────────────────────────────┴───────────────────────────┐
  │                    2. AUDIT PHASE                       │
  │                                                         │
  │  Pure functions consuming `Artifacts`:                  │
  │                                                         │
  │  [AI Accessibility]                                     │
  │    ├── ai-robots-txt ───────────▶ AuditResult           │
  │    ├── ai-x-robots-tag ─────────▶ AuditResult           │
  │    └── ai-bot-sitemap ──────────▶ AuditResult           │
  │                                                         │
  │  [Structured Data & RAG]                                │
  │    ├── jsonld-syntax-validity ──▶ AuditResult           │
  │    ├── rag-schema-presence ─────▶ AuditResult           │
  │    └── entity-sameas-links ─────▶ AuditResult           │
  │                                                         │
  │  [Content Chunking]                                     │
  │    ├── heading-hierarchy ───────▶ AuditResult           │
  │    ├── semantic-containers ─────▶ AuditResult           │
  │    └── chunk-token-density ─────▶ AuditResult           │
  │                                                         │
  │  [Direct Answer Density]                                │
  │    ├── direct-definition-answering ──▶ AuditResult       │
  │    ├── concise-answer-wordcount ─────▶ AuditResult       │
  │    └── question-heading-alignment ───▶ AuditResult       │
  └─────────────────────────────┬───────────────────────────┘
                                │
                                ▼
  ┌─────────────────────────────┴───────────────────────────┐
  │                  3. AGGREGATE PHASE                     │
  │                                                         │
  │  Config & Weights:                                      │
  │    - AI Accessibility (25%)                             │
  │    - Structured Data (25%)                              │
  │    - Content Chunking (25%)                             │
  │    - Direct Answer Density (25%)                        │
  │                                                         │
  │  Weighted Score Calculation:                            │
  │    Category Score = Σ(Audit Score * Weight) / Σ(Weight) │
  │    Overall Score  = Σ(Cat Score * Weight) / Σ(Weight)   │
  └─────────────────────────────┬───────────────────────────┘
                                │
                                ▼
                   `AeoReportResult` Object
                                │
            ┌───────────────────┴───────────────────┐
            ▼                                       ▼
    Terminal Reporter                       HTML Interactive
       (ANSI Colors)                        Lighthouse Dashboard
```

# AEO Audit Linter - Agent Knowledge & Architecture Guide

This document provides system knowledge, architectural patterns, and development guidelines for AI Agents working on the **AEO Audit Linter** codebase.

---

## 🏛️ System Architecture

AEO Audit Linter is built strictly on the **Google Lighthouse Architecture Pattern**:

1. **Driver (`core/src/gather/driver`)**:
   - Platform-agnostic DOM and network extraction interface (`CheerioDriver` for Node.js/CLI and native browser DOM APIs for Chrome Extension).
2. **Gatherers (`core/src/gather/gatherers`)**:
   - Independent extraction modules producing typed immutable `Artifacts`:
     - `URLGatherer`: Resolves requested vs final URLs, hostnames, and protocols.
     - `RobotsTxtGatherer`: Discovers and parses robots.txt directives for AI search bots (`GPTBot`, `PerplexityBot`, `ClaudeBot`, `Google-Extended`, `CCBot`, `Bytespider`).
     - `HttpHeadersGatherer`: Evaluates HTTP response headers and `X-Robots-Tag`.
     - `JSONLDGatherer`: Extracts and validates JSON-LD schemas (`FAQPage`, `HowTo`, `Article`, `sameAs`) and Author E-E-A-T credentials.
     - `MetaTagsGatherer`: Extracts HTML meta tags, OpenGraph, Twitter Cards, robots meta.
     - `HeadingsHierarchyGatherer`: Audits single H1 and sequential H1-H6 nesting without level skips.
     - `ContentChunksGatherer`: Extracts semantic HTML5 blocks, token counts for embeddings, and structured tables (`<table>`) / lists (`<ul>`/`<ol>`).
     - `DirectAnswersGatherer`: Identifies question headers, direct concise answer passages (30-60 words), definitions, percentages (`%`), numerical metrics, citations, and external links.
     - `LlmsTxtGatherer`: Discovers and parses standard `/llms.txt` and `/llms-full.txt` markdown files.
3. **Pure Audits (`core/src/audits`)**:
   - Deterministic classes inheriting from `Audit` that consume `Artifacts` and return `AuditResult`:
     - `{ id, score (0-1), scoreDisplayMode, displayValue, explanation?, details? }`.
   - Audits never make network calls or mutate DOM directly.
4. **Aggregator (`core/src/runner/aggregator.ts`)**:
   - Computes weighted category scores and the overall AEO Score (0 - 100).
5. **Quality Gates (`core/src/runner/assertions.ts`)**:
   - `evaluateQualityGates(report, options)` verifies `--fail-under` overall score thresholds and `--assert-category` minimum requirements for CI/CD pipelines.
6. **Reporters (`core/src/report`)**:
   - `TerminalReporter`: ANSI-colored console output with category summaries and audit tables.
   - `HtmlReporter`: Self-contained interactive dashboard with circular SVG gauges and expandable diagnostics.

---

## 🎯 Categories & Weights (16 Audits Total, 25% Each)

### 1. AI Accessibility & Crawling (Weight: 25)
- `ai-robots-txt` (Weight: 9): AI crawler access directives.
- `ai-x-robots-tag` (Weight: 7): Clean HTTP header indexing.
- `ai-llms-txt` (Weight: 6): Standard `/llms.txt` file for direct LLM ingestion.
- `ai-bot-sitemap` (Weight: 3): XML Sitemap declarations in robots.txt.

### 2. Structured Data & RAG Schemas (Weight: 25)
- `rag-schema-presence` (Weight: 8): High-value schemas (`FAQPage`, `HowTo`, `Article`, `QAPage`).
- `jsonld-syntax-validity` (Weight: 7): Syntax validity across all JSON-LD blocks.
- `author-eeat-presence` (Weight: 6): Verified author credentials, E-E-A-T signals, publisher data, and DOM bylines.
- `entity-sameas-links` (Weight: 4): Knowledge Graph entity disambiguation (`sameAs`).

### 3. Content Chunking & Semantic Structure (Weight: 25)
- `heading-hierarchy` (Weight: 7): Single H1 and sequential hierarchy.
- `semantic-containers` (Weight: 6): HTML5 `<main>`, `<article>`, `<section>` over `<div>`.
- `chunk-token-density` (Weight: 6): Optimal embedding passages (150 - 500 tokens).
- `table-list-scannability` (Weight: 6): Structured tables (`<table>`) and lists (`<ul>`/`<ol>`) for fast LLM extraction.

### 4. Direct Answer Density & Fact Grounding (Weight: 25)
- `direct-definition-answering` (Weight: 8): Direct definitions answering user questions.
- `concise-answer-wordcount` (Weight: 6): Concise 30–60 word answer passages.
- `fact-citation-density` (Weight: 6): Empirical statistics (`%`, metrics) and authoritative citations.
- `question-heading-alignment` (Weight: 5): Headings formulated as natural search queries.

---

## 📦 Workspace Modules & Parity

1. **`core` (`@drowlink/aeo-linter-core`)**: Central engine, TypeScript types, Gatherers, Audits, Aggregator, Assertions, Reporters.
2. **`cli` (`aeo-linter`)**: CLI binary wrapping `core` with Commander, providing `--html`, `--json`, `-o`, `--fail-under`, `--assert-category`, and `-q/--quiet`.
3. **`extension`**: Manifest V3 Chrome DevTools extension using `extension/engine.js` with zero Node runtime dependencies for browser evaluation.
   * *Rule*: When adding or updating an audit, ensure `core/src/audits`, `core/src/config/default-config.ts`, and `extension/engine.js` are updated synchronously to maintain 100% feature parity.

---

## 🧪 Testing Guidelines

- Run tests: `npm test`
- Build monorepo: `npm run build`
- All new audits must include a dedicated test in `core/src/__tests__/<audit-name>.test.ts`.

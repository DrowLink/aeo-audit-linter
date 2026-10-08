# 📑 AEO & SEO Linter - System Specifications (SPECS)

> **Version:** 0.3.x  
> **Status:** Active / Production  
> **Standard:** Google Lighthouse Architectural Pattern  
> **Repository:** [`DrowLink/aeo-audit-linter`](https://github.com/DrowLink/aeo-audit-linter)

---

## 🎯 1. Overview & Purpose

The **AEO & SEO Linter** (internally branded in extension as **SAGE: SEO · AEO · GEO Engine**) is an open-source, deterministic audit suite designed to evaluate web pages for:
1. **Traditional Technical SEO**: Indexability, crawlability, on-page metadata, semantic tags, mobile friendliness, HTTPS.
2. **GEO (Generative Engine Optimization)**: Optimal semantic chunking, embedding token density, table/list scannability for vector search and RAG pipelines.
3. **AEO (Answer Engine Optimization)**: AI crawler access (GPTBot, PerplexityBot, ClaudeBot, etc.), direct answers, definition blocks, empirical statistics, citations, and standard machine-readable files (`/llms.txt`).

---

## 📚 2. Specifications Index

| Document | Focus & Scope |
|---|---|
| [**01. Architecture & Pipeline**](./01-architecture-pipeline.md) | Google Lighthouse pattern, Driver abstraction, execution lifecycle, aggregator mathematics, assertion gates, and reporters. |
| [**02. Audits Catalog & Scoring**](./02-audits-catalog.md) | Detailed algorithmic specifications for all 25 audits across 5 weighted categories (thresholds, scoreDisplayMode, weights, diagnostics). |
| [**03. Gatherers & Artifacts Spec**](./03-gatherers-spec.md) | Data extraction contracts, types, schemas, and immutability guarantees across the 12 gatherers. |
| [**04. Interfaces (CLI & Chrome Extension)**](./04-interfaces-cli-extension.md) | Command-line tool parameters, CI/CD quality gate flags, Chrome DevTools panel, Manifest V3 popup, and `engine.js` parity. |

---

## 👥 3. Target Personas & Use Cases

1. **Web Developers & Engineers**: Run `npx aeo-linter https://mysite.com` during local development or inside GitHub Actions CI/CD to prevent SEO and AI retrieval regressions.
2. **SEO Specialists & Consultants**: Generate comprehensive, interactive HTML reports with SERP previews, score gauges, and prioritized diagnostic tables.
3. **Content Strategists & Copywriters**: Audit whether question headings have immediate concise definitions (30–60 words) and high fact/metric grounding.
4. **AI & RAG Engineers**: Ensure content chunks match vector database context windows (150–500 tokens) with clear semantic wrappers (`<article>`, `<main>`, `<section>`).

---

## 📖 4. Glossary & Key Concepts

- **AEO (Answer Engine Optimization)**: Techniques to optimize content for direct extraction and citation by conversational AI engines (*SearchGPT, Perplexity, Claude, Gemini, Google AI Overviews*).
- **GEO (Generative Engine Optimization)**: Optimizing structured data and content layout for generative LLMs to synthesize answers without hallucination.
- **RAG (Retrieval-Augmented Generation)**: Vector search retrieval architecture requiring modular token chunks, clear headings, and structured schemas.
- **Pure Audit**: An audit function or class that consumes immutable raw artifacts without performing any I/O, network requests, or DOM mutations.
- **Gatherer**: An extraction unit that runs against a driver (Cheerio or Browser DOM) to harvest a specific category of raw artifacts.
- **Quality Gate**: A programmatic assertion (e.g. `--fail-under 80`) causing CI/CD pipeline runs to fail if score thresholds are not met.

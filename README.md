# AEO Linter (`aeo-linter`)

<div align="center">

[![CI](https://github.com/DrowLink/aeo-audit-linter/actions/workflows/ci.yml/badge.svg)](https://github.com/DrowLink/aeo-audit-linter/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/DrowLink/aeo-audit-linter/blob/main/CONTRIBUTING.md)
[![Lighthouse Architecture](https://img.shields.io/badge/Architecture-Google%20Lighthouse%20Pattern-orange.svg)](https://github.com/GoogleChrome/lighthouse)

**Open-source audit and linting engine for Answer Engine Optimization (AEO/GEO) and RAG readiness.**

[Quickstart](#-quickstart) • [Architecture](#-architecture) • [Audits Catalog](#-audits-catalog) • [CLI Usage](#-cli-usage) • [Programmatic API](#-programmatic-api) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

**AEO Linter** evaluates web pages for visibility in **AI Answer Engines** (such as *SearchGPT, Perplexity AI, Google AI Overviews, Claude, and Gemini*) and vector ingestion pipelines for **RAG (Retrieval-Augmented Generation)**.

Built strictly according to the modular architecture of [GoogleChrome/lighthouse](https://github.com/GoogleChrome/lighthouse), decoupling the collection phase (**Gatherers**) from pure audit evaluations (**Audits**), aggregated into weighted score categories (**0 to 100**).

---

## 🏛️ Architecture

```
[ Target URL / DOM ] 
         │
         ▼
 1. GATHER PHASE (core/src/gather)
    Drivers & Gatherers extract typed raw immutable artifacts (JSON-LD, robots.txt, headers, chunks, headings)
         │
         ▼
   [ Typed Artifacts ]
         │
         ▼
 2. AUDIT PHASE (core/src/audits)
    Pure deterministic functions evaluate Artifacts and return { score, displayValue, details }
         │
         ▼
   [ Audit Results ]
         │
         ▼
 3. AGGREGATE PHASE (core/src/runner & config)
    Aggregates audits into categories with weights and computes the Overall AEO Score (0 - 100)
         │
         ▼
 [ Terminal / Interactive HTML / JSON Reporters ]
```

---

## 📁 Repository Structure (Lighthouse Pattern)

```
aeo-linter/
├── core/                   # Agnostic core engine (@aeo-linter/core)
│   ├── src/
│   │   ├── types/          # TypeScript contracts (Artifacts, AuditResult, Config)
│   │   ├── gather/         # Raw data gatherers (RobotsTxt, JSONLD, Chunks, etc.)
│   │   ├── audits/         # Pure audit implementations across 4 categories
│   │   ├── config/         # default-config.ts with category weights
│   │   ├── runner/         # 3-phase pipeline runner and score aggregator
│   │   └── report/         # Interactive HTML & Terminal reporters
│   └── package.json
├── cli/                    # Command Line Interface (aeo-linter)
│   ├── bin/                # Executable binary entrypoint
│   ├── src/                # Commander.js CLI runner
│   └── package.json
├── extension/              # Chrome DevTools Panel Extension (Manifest V3)
│   ├── manifest.json
│   ├── devtools.html / js
│   └── panel.html / js
├── docs/                   # Architecture & developer guides
├── .gitignore
├── LICENSE                 # MIT License
├── CONTRIBUTING.md         # Open-source contribution guidelines
└── README.md
```

---

## 🎯 Audits Catalog

### 1. AI Accessibility & Crawling (Weight: 25%)
| Audit ID | Description | Weight |
|---|---|---|
| `ai-robots-txt` | Verifies access permissions for AI crawlers (`GPTBot`, `PerplexityBot`, `ClaudeBot`, `Google-Extended`, `CCBot`, `Bytespider`). | 10 |
| `ai-x-robots-tag` | Inspects HTTP response headers to ensure `X-Robots-Tag` does not restrict AI indexing (`noindex`, `noarchive`, `noai`). | 8 |
| `ai-bot-sitemap` | Validates presence of XML Sitemaps declared in `robots.txt` for efficient deep crawling. | 2 |

### 2. Structured Data & RAG Schemas (Weight: 25%)
| Audit ID | Description | Weight |
|---|---|---|
| `jsonld-syntax-validity` | Validates JSON syntax and schema integrity across all JSON-LD blocks. | 8 |
| `rag-schema-presence` | Checks for high-value schemas for AI synthesis (`FAQPage`, `HowTo`, `Article`, `QAPage`). | 8 |
| `entity-sameas-links` | Evaluates `sameAs` entity links (Wikidata, Wikipedia, social profiles) for Knowledge Graph entity resolution. | 4 |

### 3. Content Chunking & Semantic Structure (Weight: 25%)
| Audit ID | Description | Weight |
|---|---|---|
| `heading-hierarchy` | Enforces single H1 and strict sequential H1 -> H2 -> H3 hierarchy without skipped levels. | 8 |
| `semantic-containers` | Checks for semantic HTML5 containers (`<main>`, `<article>`, `<section>`) over generic `<div>` wrappers. | 6 |
| `chunk-token-density` | Evaluates textual passages for optimal embedding chunk sizes (150 - 500 tokens). | 6 |

### 4. Direct Answer Density (Weight: 25%)
| Audit ID | Description | Weight |
|---|---|---|
| `direct-definition-answering` | Detects clear and direct definitions answering key user queries in the opening sentence. | 10 |
| `concise-answer-wordcount` | Verifies that answers follow the ideal 30–60 word range preferred by LLM answer synthesizers. | 6 |
| `question-heading-alignment` | Evaluates whether headings formulate natural user search queries and questions. | 4 |

---

## ⚡ Quickstart

### Run via npx / CLI
```bash
# Run a quick audit in terminal
npx aeo-linter https://example.com

# Generate a visual interactive HTML dashboard (Lighthouse style)
npx aeo-linter https://example.com --html -o aeo-report.html

# Output JSON report for CI/CD pipelines
npx aeo-linter https://example.com --json -o report.json

# Run specific categories only
npx aeo-linter https://example.com -c ai-accessibility,direct-answer-density
```

---

## 💻 Programmatic API (`@aeo-linter/core`)

```typescript
import { Runner, HtmlReporter, TerminalReporter, defaultConfig } from '@aeo-linter/core';

// Run full 3-phase audit pipeline
const report = await Runner.run('https://example.com', {
  onProgress: (phase, msg) => {
    console.log(`[${phase.toUpperCase()}] ${msg}`);
  }
});

console.log(`Overall AEO Score: ${report.overallScore} / 100`);

// Generate HTML report string
const htmlDashboard = HtmlReporter.generate(report);

// Generate formatted Terminal report string with ANSI colors
const terminalSummary = TerminalReporter.generate(report);
```

---

## 🛠️ Development & Testing

```bash
# Clone the repository
git clone https://github.com/DrowLink/aeo-audit-linter.git
cd aeo-audit-linter

# Install workspace dependencies
npm install

# Build all packages
npm run build

# Run unit and integration tests with Vitest
npm test
```

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/architecture.md](docs/architecture.md) for details on our code of conduct and how to submit pull requests.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

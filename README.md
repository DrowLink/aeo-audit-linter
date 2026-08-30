# AEO & SEO Linter (`aeo-linter`)

<div align="center">

[![CI](https://github.com/DrowLink/aeo-audit-linter/actions/workflows/ci.yml/badge.svg)](https://github.com/DrowLink/aeo-audit-linter/actions)
[![NPM CLI Version](https://img.shields.io/npm/v/aeo-linter.svg?color=cb3837&logo=npm&label=aeo-linter)](https://www.npmjs.com/package/aeo-linter)
[![NPM Core Version](https://img.shields.io/npm/v/@drowlink/aeo-linter-core.svg?color=cb3837&logo=npm&label=%40drowlink%2Faeo-linter-core)](https://www.npmjs.com/package/@drowlink/aeo-linter-core)
[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-In%20Review-orange?logo=googlechrome&logoColor=white)](https://github.com/DrowLink/aeo-audit-linter#%EF%B8%8F-chrome-devtools-extension)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/DrowLink/aeo-audit-linter/blob/main/CONTRIBUTING.md)
[![Lighthouse Architecture](https://img.shields.io/badge/Architecture-Google%20Lighthouse%20Pattern-orange.svg)](https://github.com/GoogleChrome/lighthouse)

**The complete, open-source audit suite for Technical SEO, Generative Engine Optimization (GEO), and Answer Engine Optimization (AEO).**

[Packages & Installation](#-packages--installation) • [CLI Usage](#-cli-usage) • [HTML Reports](#-visual-html-report--serp-preview) • [CI/CD Workflow](#-cicd-github-actions-integration) • [Chrome DevTools](#-chrome-devtools-extension) • [Audits Catalog](#-audits-catalog-25-audits-across-5-categories) • [Contributing](./COLLABORATING.md)

</div>

> [!NOTE]
> 🧩 **Chrome Extension Status:** The official **AEO & SEO Linter Chrome Extension** has been submitted and is currently **In Review** on the [Chrome Web Store](https://chromewebstore.google.com/). You can already load it unpacked from [`extension/`](./extension) or use the CLI (`npx aeo-linter`).

---

## 📖 Overview

**AEO & SEO Linter** combines traditional **Technical & On-Page SEO**, **GEO (Generative Engine Optimization)**, and **AEO (Answer Engine Optimization)** into a single unified audit engine. It audits how effectively web pages can be crawled, indexed, and cited by both traditional search engines (Google, Bing) and AI Answer Engines (*SearchGPT, Perplexity AI, Google AI Overviews, Claude, and Gemini*), as well as RAG vector retrieval pipelines.

Built strictly according to the modular architecture of [GoogleChrome/lighthouse](https://github.com/GoogleChrome/lighthouse):
- **Gatherers**: Decoupled, typed extractors for DOM, metadata, robots.txt, HTTP headers, headings, images, links, keywords, chunks, and JSON-LD.
- **Pure Audits**: Deterministic evaluations consuming immutable artifacts and producing structured scores (`0` to `1`), display values, and diagnostic tables.
- **Aggregator**: Lighthouse-formula weighted scores (0 to 100) across 5 core categories.

---

## 📦 Packages & Installation

| Package | npm Link | Badges | Description |
|---|---|---|---|
| **CLI & Standalone** | [`aeo-linter`](https://www.npmjs.com/package/aeo-linter) | [![npm](https://img.shields.io/npm/v/aeo-linter.svg?color=cb3837&logo=npm)](https://www.npmjs.com/package/aeo-linter) [![downloads](https://img.shields.io/npm/dm/aeo-linter.svg?color=blue)](https://www.npmjs.com/package/aeo-linter) | CLI tool, interactive terminal & HTML report generator |
| **Core Engine / SDK** | [`@drowlink/aeo-linter-core`](https://www.npmjs.com/package/@drowlink/aeo-linter-core) | [![npm](https://img.shields.io/npm/v/@drowlink/aeo-linter-core.svg?color=cb3837&logo=npm)](https://www.npmjs.com/package/@drowlink/aeo-linter-core) [![downloads](https://img.shields.io/npm/dm/@drowlink/aeo-linter-core.svg?color=blue)](https://www.npmjs.com/package/@drowlink/aeo-linter-core) | Core audit engine, TypeScript types, Gatherers & Reporters |

### 1. Run without installing (Recommended for CLI)
```bash
npx aeo-linter https://example.com
```

### 2. Install globally
```bash
npm install -g aeo-linter
```

### 3. Install as a project dependency
```bash
# Core engine for programmatic usage
npm install @drowlink/aeo-linter-core

# Or CLI tool locally in your project
npm install -D aeo-linter
```

---

## 🚀 CLI Usage

### 1. Basic Terminal Audit
Scan any public URL and view a colorful summary in your terminal:
```bash
aeo-linter https://example.com
```

### 2. Generate Interactive HTML Report (Lighthouse Dashboard)
Generate a self-contained, standalone HTML report with score gauges, SERP preview, and audit breakdowns:
```bash
# Automatically creates an HTML report file
aeo-linter https://example.com --html

# Or specify a custom output path
aeo-linter https://example.com --html -o ./reports/aeo-report.html
```

### 3. Output JSON for Automation & Scripts
```bash
# Print raw JSON to stdout
aeo-linter https://example.com --json

# Save JSON report to a file
aeo-linter https://example.com --json -o ./reports/audit-result.json
```

### 4. Audit Specific Categories
Select one or more categories separated by commas:
```bash
# Only evaluate Core SEO and AI crawler access
aeo-linter https://example.com -c seo-fundamentals,ai-accessibility
```

### 🎛️ CLI Options Reference

| Option | Shorthand | Description |
|---|---|---|
| `<url>` | — | The target URL to audit (required). |
| `--html` | — | Generates an interactive visual HTML dashboard report. |
| `--json` | `-j` | Outputs the complete report in JSON format. |
| `--output <file>` | `-o` | Specifies output path for the report (`.html` or `.json`). |
| `--categories <list>`| `-c` | Comma-separated list of categories to audit. |
| `--fail-under <score>` | — | Fails with exit code `1` if the overall score is below threshold (`0-100`). |
| `--assert-category <rules...>`| — | Asserts minimum scores per category (e.g. `seo-fundamentals=90,ai-accessibility=85`). |
| `-q, --quiet` | — | Suppresses progress logs for clean CI/CD output. |
| `--version` | `-V` | Displays the current version. |
| `--help` | `-h` | Displays help message and option details. |

---

## 📊 Visual HTML Report & SERP Preview

When using `--html`, `aeo-linter` generates an interactive dashboard inspired by Google Lighthouse:
- **Top Metrics Bar:** Heading counts (H1-H6), Image count, Link count, Indexability status badge.
- **Google SERP Snippet Simulator:** Real-time preview of the title tag, URL, and meta description.
- **Circular SVG Score Gauges:** Overall Score and individual scores for SEO, AI Crawling, Structured Data, Content Structure, and Direct Answers.
- **Interactive Expandable Audits:** Detailed diagnostic tables with character counts, missing alt tags, link crawlability, and schema validation.
- **Zero External Dependencies:** Self-contained single file that can be archived, attached to PRs, or hosted on S3 / GitHub Pages.

---

## 🤖 CI/CD Quality Gates (GitHub Actions Integration)

Add automated SEO & AEO auditing and quality gates to your pull requests and deployments. If a PR breaks indexability, removes canonical tags, or degrades AI answer scores, the build fails automatically.

Create `.github/workflows/aeo-audit.yml`:
```yaml
name: SEO & AEO Quality Gate

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 12 * * 1' # Runs weekly on Mondays

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Run AEO & SEO Audit with Quality Gates
        run: |
          npx aeo-linter https://your-domain.com \
            --fail-under 80 \
            --assert-category "seo-fundamentals=85,ai-accessibility=90" \
            --html -o aeo-report.html

      - name: Upload HTML Audit Report Artifact
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: aeo-audit-report
          path: aeo-report.html
```

---

## 💻 Programmatic API (Node.js & TypeScript)

You can embed [`@drowlink/aeo-linter-core`](https://www.npmjs.com/package/@drowlink/aeo-linter-core) into your backend, SaaS, crawler, or custom CLI.

```typescript
import { 
  Runner, 
  HtmlReporter, 
  TerminalReporter, 
  defaultConfig,
  evaluateQualityGates 
} from '@drowlink/aeo-linter-core';

async function runAudit() {
  // 1. Run the full 3-phase audit pipeline
  const report = await Runner.run('https://example.com', {
    config: defaultConfig,
    onProgress: (phase, message) => {
      console.log(`[${phase.toUpperCase()}] ${message}`);
    }
  });

  // 2. Access aggregated scores
  console.log(`Overall Score: ${report.overallScore} / 100`);
  console.log(`SEO Fundamentals: ${report.categories['seo-fundamentals'].score}`);
  console.log(`AI Accessibility: ${report.categories['ai-accessibility'].score}`);
  console.log(`Structured Data: ${report.categories['structured-data'].score}`);

  // 3. Evaluate CI/CD Quality Gates
  const gateResult = evaluateQualityGates(report, {
    failUnder: 80,
    categoryAssertions: { 'seo-fundamentals': 85, 'ai-accessibility': 90 }
  });
  console.log('Quality Gate Passed:', gateResult.passed);

  // 4. Format reports
  const terminalReport = TerminalReporter.generate(report);
  console.log(terminalReport);

  const htmlDashboard = HtmlReporter.generate(report);
  // fs.writeFileSync('report.html', htmlDashboard);
}

runAudit();
```

---

## 🔌 Chrome DevTools Extension

Audit any page directly from Chrome DevTools with tabs for **Summary**, **All Audits**, **Content & SERP Preview**, **Headings Hierarchy (H1-H6)**, **Images & Alt Tags**, and **AI & GEO**:

1. Clone or download this repository.
2. Open Google Chrome and navigate to `chrome://extensions`.
3. Enable **"Developer mode"** in the top-right corner.
4. Click **"Load unpacked"** and select the [`extension/`](extension/) directory.
5. Open Chrome DevTools (`F12` or `Cmd+Option+I`), navigate to the **"AEO Audit"** tab, and click **"Audit Active Tab"**.

---

## 🎯 Audits Catalog (25 Audits Across 5 Categories)

### 1. Core SEO & Indexability (Weight: 20%)
| Audit ID | Description | Weight |
|---|---|---|
| `seo-title` | Validates document `<title>` tag presence and optimal length (30-60 characters). | 8 |
| `seo-meta-description` | Checks `<meta name="description">` presence and optimal length (70-155 characters). | 7 |
| `seo-canonical` | Validates `<link rel="canonical">` presence, valid URL syntax, and protocol. | 6 |
| `seo-indexability` | Verifies page is not blocked by `noindex` in meta robots or `X-Robots-Tag`. | 8 |
| `seo-image-alt` | Audits image elements to ensure descriptive `alt` attributes for search indexing & accessibility. | 5 |
| `seo-crawlable-links` | Audits hyperlinks for valid `href` destinations, crawlability, and anchor text. | 5 |
| `seo-open-graph` | Validates Open Graph & Twitter Card social snippet tags (`og:title`, `og:desc`, `og:image`, `twitter:card`). | 4 |
| `seo-viewport-mobile` | Ensures responsive mobile viewport meta tag (`width=device-width, initial-scale=1`). | 4 |
| `seo-https` | Verifies secure HTTPS protocol encryption. | 5 |

### 2. AI Accessibility & Crawling (Weight: 20%)
| Audit ID | Description | Weight |
|---|---|---|
| `ai-robots-txt` | Verifies access permissions for AI crawlers (`GPTBot`, `PerplexityBot`, `ClaudeBot`, `Google-Extended`, `CCBot`, `Bytespider`). | 9 |
| `ai-x-robots-tag` | Inspects HTTP response headers to ensure `X-Robots-Tag` does not restrict AI indexing (`noindex`, `noarchive`, `noai`). | 7 |
| `ai-llms-txt` | Validates presence and structure of `/llms.txt` and `/llms-full.txt` standard files for AI agent consumption. | 6 |
| `ai-bot-sitemap` | Validates presence of XML Sitemaps declared in `robots.txt` for efficient deep crawling. | 3 |

### 3. Structured Data & RAG Schemas (Weight: 20%)
| Audit ID | Description | Weight |
|---|---|---|
| `rag-schema-presence` | Checks for high-value schemas for AI synthesis (`FAQPage`, `HowTo`, `Article`, `QAPage`). | 8 |
| `jsonld-syntax-validity` | Validates JSON syntax and schema integrity across all JSON-LD blocks. | 7 |
| `author-eeat-presence` | Evaluates verified author credentials (`Person`, `jobTitle`, `sameAs`), publisher info, and visible DOM bylines. | 6 |
| `entity-sameas-links` | Evaluates `sameAs` entity links (Wikidata, Wikipedia, social profiles) for Knowledge Graph entity resolution. | 4 |

### 4. Content Chunking & Semantic Structure (Weight: 20%)
| Audit ID | Description | Weight |
|---|---|---|
| `heading-hierarchy` | Enforces single H1 and strict sequential H1 -> H2 -> H3 hierarchy without skipped levels. | 7 |
| `semantic-containers` | Checks for semantic HTML5 containers (`<main>`, `<article>`, `<section>`) over generic `<div>` wrappers. | 6 |
| `chunk-token-density` | Evaluates textual passages for optimal embedding chunk sizes (150 - 500 tokens). | 6 |
| `table-list-scannability` | Detects structured comparison tables (`<table>`) and bullet/numbered lists (`<ul>`/`<ol>`) for fast LLM extraction. | 6 |

### 5. Direct Answer Density & Fact Grounding (Weight: 20%)
| Audit ID | Description | Weight |
|---|---|---|
| `direct-definition-answering` | Detects clear and direct definitions answering key user queries in the opening sentence. | 8 |
| `concise-answer-wordcount` | Verifies that answers follow the ideal 30–60 word range preferred by LLM answer synthesizers. | 6 |
| `fact-citation-density` | Evaluates empirical figures (percentages `%`, metrics) and authoritative citations boosting LLM citation rate. | 6 |
| `question-heading-alignment` | Evaluates whether headings formulate natural user search queries and questions. | 5 |

---

## 🏛️ Internal Architecture (Lighthouse Pattern)

```
[ Target URL / DOM ] 
         │
         ▼
 1. GATHER PHASE (core/src/gather)
    Extracts typed raw immutable artifacts (MetaTags, Images, Links, Keywords, JSON-LD, RobotsTxt, Chunks, Headings)
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
    Aggregates audits into 5 weighted categories and computes the Overall Score (0 - 100)
         │
         ▼
 [ Terminal / Interactive HTML / JSON Reporters ]
```

---

## 🛠️ Contributing & Local Development

```bash
# Clone the repository
git clone https://github.com/DrowLink/aeo-audit-linter.git
cd aeo-audit-linter

# Install workspace dependencies
npm install

# Build all TypeScript packages
npm run build

# Run unit and integration tests with Vitest
npm test
```

Please review [CONTRIBUTING.md](CONTRIBUTING.md) before submitting Pull Requests.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

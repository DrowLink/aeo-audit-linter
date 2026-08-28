# @drowlink/aeo-linter-core

> The agnostic core engine and audit pipeline for **Answer Engine Optimization (AEO/GEO)** and **RAG readiness**, built on the **Google Lighthouse architecture**.

[![NPM Version](https://img.shields.io/npm/v/@drowlink/aeo-linter-core.svg)](https://www.npmjs.com/package/@drowlink/aeo-linter-core)
[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-In%20Review-orange?logo=googlechrome&logoColor=white)](https://github.com/DrowLink/aeo-audit-linter)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> [!NOTE]
> 🧩 **Chrome Extension Status:** The companion Chrome Extension is currently **In Review** on the Chrome Web Store.

Part of the [aeo-audit-linter](https://github.com/DrowLink/aeo-audit-linter) project.

---

## 📦 Installation

```bash
npm install @drowlink/aeo-linter-core
```

---

## 🚀 Quick Usage

```typescript
import { 
  Runner, 
  HtmlReporter, 
  TerminalReporter, 
  defaultConfig 
} from '@drowlink/aeo-linter-core';

async function main() {
  // Run the 3-phase audit pipeline
  const report = await Runner.run('https://example.com', {
    config: defaultConfig,
    onProgress: (phase, msg) => console.log(`[${phase.toUpperCase()}] ${msg}`)
  });

  console.log(`Overall AEO Score: ${report.overallScore} / 100`);

  // Generate formatted Terminal report with ANSI colors
  console.log(TerminalReporter.generate(report));

  // Generate self-contained interactive HTML dashboard
  const html = HtmlReporter.generate(report);
}

main();
```

---

## 🏛️ Architecture (Lighthouse Pattern)

- **Gatherers (`core/gather`)**: Extract raw typed artifacts (`RobotsTxt`, `HttpHeaders`, `JSONLD`, `MetaTags`, `HeadingsHierarchy`, `ContentChunks`, `DirectAnswers`, `LlmsTxt`).
- **Audits (`core/audits`)**: 16 pure deterministic audit functions that evaluate artifacts and return typed `{ score, displayValue, details }`.
- **Aggregator (`core/runner/aggregator`)**: Calculates weighted category scores and global AEO score (0–100).
- **Quality Gates (`core/runner/assertions`)**: `evaluateQualityGates` function for CI/CD threshold validation.
- **Reporters (`core/report`)**: Terminal and interactive SVG gauge HTML dashboards.

---

## 🎯 Categories & Audits (16 Audits)

- `ai-accessibility` (25%): AI crawlers (`ai-robots-txt`), headers (`ai-x-robots-tag`), `/llms.txt` standard (`ai-llms-txt`), and Sitemaps (`ai-bot-sitemap`).
- `structured-data` (25%): RAG schemas (`rag-schema-presence`), JSON-LD syntax (`jsonld-syntax-validity`), Author E-E-A-T (`author-eeat-presence`), and Knowledge Graph (`entity-sameas-links`).
- `content-chunking` (25%): Headings (`heading-hierarchy`), HTML5 tags (`semantic-containers`), RAG token density (`chunk-token-density`), and tables/lists (`table-list-scannability`).
- `direct-answer-density` (25%): Definitions (`direct-definition-answering`), 30-60w conciseness (`concise-answer-wordcount`), facts & citations (`fact-citation-density`), and query headings (`question-heading-alignment`).

---

## 📄 License

MIT © [DrowLink](https://github.com/DrowLink/aeo-audit-linter)

# @drowlink/aeo-linter-core

> The agnostic core engine and audit pipeline for **Answer Engine Optimization (AEO/GEO)** and **RAG readiness**, built on the **Google Lighthouse architecture**.

[![NPM Version](https://img.shields.io/npm/v/@drowlink/aeo-linter-core.svg)](https://www.npmjs.com/package/@drowlink/aeo-linter-core)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

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

- **Gatherers (`core/gather`)**: Extract raw typed artifacts (`RobotsTxt`, `JSONLD`, `HttpHeaders`, `HeadingsHierarchy`, `ContentChunks`, `DirectAnswers`).
- **Audits (`core/audits`)**: Pure deterministic functions that evaluate artifacts and return `{ score, displayValue, details }`.
- **Aggregator (`core/runner/aggregator`)**: Calculates weighted category scores and global AEO score (0–100).
- **Reporters (`core/report`)**: Terminal and interactive SVG gauge HTML dashboards.

---

## 🎯 Categories

- `ai-accessibility`: Evaluates permissions for AI bots (`GPTBot`, `PerplexityBot`, `ClaudeBot`, `Google-Extended`, etc.) and `X-Robots-Tag`.
- `structured-data`: Validates JSON-LD syntax and presence of RAG schemas (`FAQPage`, `HowTo`, `Article`, `sameAs`).
- `content-chunking`: Verifies H1-H3 hierarchy, semantic tags (`<main>`, `<article>`, `<section>`), and embedding token density.
- `direct-answer-density`: Measures conciseness (30–60 words) and direct definitions answering key user queries.

---

## 📄 License

MIT © [DrowLink](https://github.com/DrowLink/aeo-audit-linter)

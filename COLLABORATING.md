# 🤝 Collaborating & Contributing Guide

Welcome to the **AEO Linter** open-source project! We are thrilled that you want to collaborate. Whether you are fixing a bug, adding new AI search audits, improving our Chrome DevTools extension, or polishing the documentation, your contributions are warmly welcomed.

---

## 🌟 Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free environment for everyone. Please treat all maintainers, contributors, and users with kindness, empathy, and respect.

---

## 🧭 How to Get Involved

You can contribute to AEO Linter in various ways:

1. **💡 Suggest Features & New Audits**: AI search engines (SearchGPT, Perplexity, Claude, Google AI Overviews) evolve rapidly. Open an issue proposing new audit vectors or scoring heuristics.
2. **🐛 Report & Fix Bugs**: If you find an issue during CLI execution or within DevTools, please open a detailed issue with the inspected URL and error log.
3. **✨ Submit Pull Requests**: Implement audits, enhance UI dashboards, or optimize RAG token chunking algorithms.
4. **📖 Improve Documentation & Tests**: Expand our guides, add real-world benchmark websites, and increase test coverage.

---

## 🏗️ Architecture & Philosophy

AEO Linter strictly follows the **Google Lighthouse Architecture**:

```
[ Driver (Cheerio / Browser DOM) ]
               │
               ▼
[ Gatherers (Pure Artifact Extraction) ]
   ├── MetaTagsGatherer (Title, Desc, Canonical, Viewport, OpenGraph, Twitter)
   ├── ImagesGatherer (Alt attributes, dimensions)
   ├── LinksGatherer (Internal/External distribution, crawlability)
   ├── KeywordsGatherer (Frequencies, density percentages)
   ├── URLGatherer (URL resolution)
   ├── RobotsTxtGatherer (AI bots status & directives)
   ├── HttpHeadersGatherer (X-Robots-Tag, status codes)
   ├── JSONLDGatherer (Schemas, E-E-A-T credentials)
   ├── HeadingsHierarchyGatherer (H1-H6 sequential checks)
   ├── ContentChunksGatherer (Semantic chunks & token estimation)
   ├── DirectAnswersGatherer (Direct answers & verifiable facts)
   └── LlmsTxtGatherer (/llms.txt standard files)
               │
               ▼
[ Pure Audits (Deterministic Scoring: 0 - 1) ]
   ├── Core SEO & Indexability (20%)
   ├── AI Accessibility & Crawling (20%)
   ├── Structured Data & Schemas (20%)
   ├── Content Chunking & Structure (20%)
   └── Direct Answer Density & Fact Grounding (20%)
               │
               ▼
[ Aggregator (Overall AEO Score: 0 - 100) ]
               │
   ┌───────────┴───────────┐
   ▼                       ▼
Terminal Reporter    Interactive HTML / DevTools
```

### Key Architectural Rules:
- **Audits never perform network calls or mutate the DOM**: They only consume typed `Artifacts` and return `{ id, score, title, description, displayValue, details }`.
- **Extension & Core Parity**: When adding or updating an audit in `core/src/audits`, update `extension/engine.js` synchronously to ensure parity across Node.js CLI and Chrome DevTools.

---

## 🛠️ Local Development Setup

### 1. Prerequisites
- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **Git**

### 2. Fork & Clone
```bash
# Clone your fork
git clone https://github.com/<your-username>/aeo-audit-linter.git
cd aeo-audit-linter

# Install workspace dependencies
npm install

# Build all TypeScript packages (core, cli, extension)
npm run build

# Run full test suite
npm test
```

---

## 🧩 Adding a New AEO Audit (Step-by-Step)

If you are adding a new audit (e.g. `citation-grounding`):

1. **Implement the Audit Class**:
   Create `core/src/audits/<category>/<audit-name>.ts`:
   ```typescript
   import { Audit } from '../audit.js';
   import type { Artifacts, AuditResult, AuditMeta } from '../../types/index.js';

   export class MyNewAudit extends Audit {
     public static override readonly meta: AuditMeta = {
       id: 'my-new-audit',
       title: 'Clear description when passing',
       failureTitle: 'Clear description when failing',
       description: 'Why this matters for AI search engines (AEO/GEO).',
       requiredArtifacts: ['ContentChunks', 'DirectAnswers'],
     };

     public static override async audit(artifacts: Artifacts): Promise<AuditResult> {
       // Deterministic evaluation logic (score between 0 and 1)
       const passed = true;
       return {
         id: this.meta.id,
         title: passed ? this.meta.title : this.meta.failureTitle,
         score: passed ? 1 : 0,
         description: this.meta.description,
         displayValue: 'Passing condition text',
       };
     }
   }
   ```

2. **Register the Audit**:
   - Export it in `core/src/audits/index.ts`.
   - Add it to `core/src/config/default-config.ts` under its corresponding category with an assigned weight.
   - Replicate the logic in `extension/engine.js` for browser parity.

3. **Add Automated Unit Tests**:
   Create `core/src/__tests__/<audit-name>.test.ts` using `vitest` to verify passing, failing, and edge cases.

---

## 🧪 Testing & Validation Standards

Before opening a pull request, run the verification checks:

```bash
# 1. Typecheck and build all workspace packages
npm run build
npm run typecheck

# 2. Run unit tests
npm test

# 3. Test CLI locally
node cli/bin/aeo-linter.js https://example.com --html
```

---

## 📬 Pull Request (PR) Workflow

1. **Create a branch**:
   ```bash
   git checkout -b feat/new-audit-name
   # or
   git checkout -b fix/issue-description
   ```
2. **Commit with Conventional Commits**:
   - `feat: add per-section token density audit`
   - `fix: correct regex for question headings in gatherer`
   - `docs: update Chrome extension setup instructions`
   - `test: add edge-case tests for llms.txt parser`
3. **Push to your fork and open a Pull Request**:
   - Fill out the PR description template clearly explaining what changed and why.
   - Reference any related issues (e.g., `Closes #12`).
4. **Code Review**:
   - Maintainers will review your PR, verify GitHub Actions CI passes, and provide constructive feedback.

---

## 💬 Community & Questions

Need help or want to discuss an architectural proposal before coding?
- Open a [Discussion or Issue](https://github.com/DrowLink/aeo-audit-linter/issues) on GitHub.
- Maintainer Contact: [@DrowLink](https://github.com/DrowLink)

Thank you for helping build the standard open-source linter for the AI Search era! 🚀

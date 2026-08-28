# aeo-linter

> Command-Line Interface for **Answer Engine Optimization (AEO/GEO)** and **RAG readiness** linting, built on the **Google Lighthouse architecture**.

[![NPM Version](https://img.shields.io/npm/v/aeo-linter.svg)](https://www.npmjs.com/package/aeo-linter)
[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-In%20Review-orange?logo=googlechrome&logoColor=white)](https://github.com/DrowLink/aeo-audit-linter)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> [!NOTE]
> 🧩 **Chrome Extension Status:** The companion Chrome DevTools Extension is currently **In Review** on the Chrome Web Store.

Official CLI for [aeo-audit-linter](https://github.com/DrowLink/aeo-audit-linter).

---

## ⚡ Quickstart (No installation required)

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

## 📦 Global Installation

```bash
npm install -g aeo-linter

# Then use directly anywhere
aeo-linter https://example.com
```

---

## 🎛️ CLI Options

| Option | Shorthand | Description |
|---|---|---|
| `<url>` | — | The target URL to audit (required). |
| `--html` | — | Generates an interactive visual HTML dashboard report. |
| `--json` | `-j` | Outputs the complete report in JSON format. |
| `--output <file>` | `-o` | Specifies output path for the report (`.html` or `.json`). |
| `--categories <list>`| `-c` | Comma-separated list of categories to audit. |
| `--version` | `-V` | Displays the current version. |
| `--help` | `-h` | Displays help message and option details. |

---

## 📄 License

MIT © [DrowLink](https://github.com/DrowLink/aeo-audit-linter)

# 🖥️ Spec 04: Interfaces (CLI & Chrome Extension)

> **Modules:** `aeo-linter` (CLI) & `@aeo-linter/extension` (Chrome Manifest V3)  
> **Status:** Production Specification

---

## 1. Command-Line Interface (`aeo-linter`)

The CLI package (`cli/`) wraps `@drowlink/aeo-linter-core` using Commander.js.

### 1.1 Command Syntax & Options

```bash
aeo-linter <url> [options]
```

| Option | Flag | Description | Default |
|---|---|---|---|
| `--html` | | Generates interactive, standalone HTML Lighthouse-style report. | `false` |
| `--json` | | Outputs raw report result in JSON format to stdout or file. | `false` |
| `--output <path>` | `-o` | Custom destination file path for `--html` or `--json` report. | Auto-generated in `./reports/` |
| `--categories <list>` | `-c` | Comma-separated categories to audit (e.g. `seo-fundamentals,ai-accessibility`). | All 5 categories |
| `--fail-under <score>` | | Sets minimum acceptable overall score threshold for CI/CD gates. | Disabled |
| `--assert-category <spec>` | | Asserts minimum category threshold (e.g. `seo-fundamentals:80`). Multi-flag allowed. | Disabled |
| `--quiet` | `-q` | Silences terminal output except for fatal errors and failed assertions. | `false` |
| `--version` | `-v` | Outputs current CLI version. | |
| `--help` | `-h` | Prints command line help and usage guide. | |

### 1.2 Process Exit Codes

| Code | Condition |
|---|---|
| `0` | Audit executed successfully and all Quality Gates passed. |
| `1` | One or more Quality Gates (`--fail-under` or `--assert-category`) failed, or fatal URL network error occurred. |

---

## 2. Chrome DevTools & Browser Extension

The Chrome extension (`extension/`) is a Manifest V3 extension providing zero-runtime-dependency auditing directly within the user's browser.

### 2.1 Extension Components

```
extension/
├── manifest.json       (Manifest V3 declarations, permissions, action, icons)
├── popup.html/.js      (SAGE Luxury quick-audit popup HUD)
├── devtools.html/.js   (Chrome DevTools integration bridge)
├── panel.html/.js      (Full DevTools panel with deep diagnostics and gauges)
├── engine.js           (Standalone browser DOM audit engine with zero npm dependencies)
└── icons/              (16x16, 48x48, 128x128 official SAGE Caliper emblem icons)
```

### 2.2 Permissions & Privacy

- Manifest V3 permissions: strictly `activeTab`, `scripting`, and `storage`.
- No broad host permissions (`<all_urls>`).
- Privacy guarantee: All DOM parsing and scoring execute strictly inside local browser memory; no user telemetry or scraped DOM content is transmitted to external servers.

### 2.3 SAGE Luxury UI Design Tokens

The popup HUD implements the SAGE design system:
- **Background**: Obsidian Glass (`#0a0b10` / `#11141e`) with radial mesh backdrop.
- **Accents**: Champagne Gold (`#e2c275`, `#f3dfa2`) and Emerald Green (`#10b981`).
- **Typography**: `Cinzel` (Luxury serif display), `Plus Jakarta Sans` (Geometric sans-serif body), `JetBrains Mono` (Numeric data).
- **Interactive Gauge**: Dynamic SVG circular gauge with animated score count-up and stroke dash interpolation.

### 2.4 Synchronous Feature Parity Rule

To guarantee consistent scores across the CLI and Chrome Extension:
> **Parity Rule:** Whenever an audit algorithm, category weight, or scoring threshold is updated in `core/src/audits`, the corresponding logic in `extension/engine.js` **must be updated synchronously**.

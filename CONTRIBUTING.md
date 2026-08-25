# Contributing to AEO Linter

Thank you for your interest in contributing to **AEO Linter**! We welcome bug reports, feature requests, documentation improvements, and new audits or gatherers.

This project strictly adheres to the architectural design patterns of [GoogleChrome/lighthouse](https://github.com/GoogleChrome/lighthouse).

---

## 🏗️ Repository Architecture

The project is organized in modular root packages matching Lighthouse:

- **`core/` (`@aeo-linter/core`)**: The pure engine containing Gatherers, Audits, Aggregator, and Report Generators.
  - `core/src/gather/`: Extract raw page artifacts (DOM, network, headers, robots.txt) via drivers.
  - `core/src/audits/`: Pure deterministic functions consuming `Artifacts` and returning `{ score, displayValue, details }`.
  - `core/src/config/`: Category declarations and weight assignments.
  - `core/src/runner/`: 3-phase lifecycle runner and aggregator.
  - `core/src/report/`: HTML and Terminal report formatters.
- **`cli/` (`aeo-linter`)**: Terminal runner and CI/CD CLI tool.
- **`extension/`**: Chrome DevTools panel extension (Manifest V3).
- **`docs/`**: Architecture and guidelines documentation.

---

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ or 20+
- npm 9+

### Setup steps
```bash
# Clone the repository
git clone https://github.com/DrowLink/aeo-audit-linter.git
cd aeo-audit-linter

# Install all workspace dependencies
npm install

# Build all TypeScript packages
npm run build

# Run test suite
npm test
```

---

## 🧩 Adding a New Gatherer

1. Create your gatherer class in `core/src/gather/gatherers/<name>-gatherer.ts`.
2. Extend `Gatherer<'YourArtifactName'>` and implement `getArtifact(context)`.
3. Add the artifact type definition in `core/src/types/artifacts.ts`.
4. Export the gatherer in `core/src/gather/index.ts` and register it in `core/src/runner/runner.ts`.
5. Add unit tests in `core/src/__tests__/gatherers.test.ts`.

---

## 🔍 Adding a New Audit

1. Create your audit class in `core/src/audits/<category>/<audit-id>.ts`.
2. Extend `Audit` from `core/src/audits/audit.ts`.
3. Declare `static meta: AuditMeta` specifying `requiredArtifacts`.
4. Implement `static async audit(artifacts: Artifacts, context?: AuditContext): Promise<AuditResult>`.
5. Register the audit in `core/src/audits/index.ts` and in `core/src/config/default-config.ts` with its category and weight.
6. Write unit tests for your audit.

---

## 🧪 Testing Guidelines

- All audits and gatherers must have 100% deterministic unit tests.
- Use `vitest` for running tests:
  ```bash
  npm test
  ```
- Verify TypeScript types before opening a Pull Request:
  ```bash
  npm run build
  npm run typecheck
  ```

---

## 📜 Pull Request Process

1. Fork the repo and create a feature branch (`git checkout -b feat/my-new-audit`).
2. Make your changes and write unit tests.
3. Ensure `npm test` and `npm run build` pass.
4. Commit your changes with conventional commit messages (`feat:`, `fix:`, `docs:`, `test:`).
5. Open a Pull Request describing your changes and link any related issues.

# Technical Roadmap

Small, testable fixes are taken in order. Each item must pass the full verification pipeline before publication.

- [x] Refresh the lockfile to current workspace versions and patched transitive dependencies (`undici` and `source-map-js`).
- [ ] Keep the extension's brief-page fact/citation scoring aligned with core (`<150` words does not require citations).
- [ ] Make the CLI `--version` output derive from `cli/package.json` instead of a stale literal.
- [ ] Apply a robots.txt directive group to every consecutive `User-agent` in both core and extension parsers.

# Technical Roadmap

Small, testable fixes are taken in order. Each item must pass the full verification pipeline before publication.

- [x] Refresh the lockfile to current workspace versions and patched transitive dependencies (`undici` and `source-map-js`).
- [x] Keep the extension's brief-page fact/citation scoring aligned with core (`<150` words does not require citations).
- [ ] Make the CLI `--version` output derive from `cli/package.json` instead of a stale literal.
- [ ] Apply a robots.txt directive group to every consecutive `User-agent` in both core and extension parsers.
- [ ] Align extension external citation-source detection with core by using the audited URL host and deduplicating source origins.
- [ ] Recursively inspect extension JSON-LD arrays, `@graph`, and nested nodes so schema and E-E-A-T signals match core.
- [ ] Count structured tables per table in the extension instead of marking every table structured when any table has a `<th>`.
- [ ] Add core's Spanish question and definition patterns to the extension direct-answer gatherer with parity tests.

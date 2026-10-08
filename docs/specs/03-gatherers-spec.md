# 🧩 Spec 03: Gatherers & Artifacts Specification

> **Module:** `@drowlink/aeo-linter-core/gather`  
> **Total Gatherers:** 12  
> **Guarantees:** Type-Safe, Immutable, Error-Tolerant

---

## 1. Gatherer Interface & Lifecycle

Every gatherer implements the `Gatherer` interface and runs during Phase 1 of the engine:

```typescript
export interface Gatherer<TArtifact> {
  readonly name: string;
  run(driver: Driver, context: GathererContext): Promise<TArtifact>;
}
```

- **Fail-Safe Guarantee**: If an individual gatherer encounters an extraction or network timeout error, it returns a typed empty/fallback artifact rather than halting the entire audit pipeline.
- **Pure Immutability**: Artifacts are frozen upon pipeline completion to guarantee pure audit reproducibility.

---

## 2. Gatherer Roster & Schema Specifications

### 2.1 `URLGatherer`
- **Output Artifact**: `URLArtifact`
- **Fields**:
  - `requestedUrl`: Initial URL passed to the runner.
  - `finalUrl`: Resolved URL following all HTTP 301/302 redirects.
  - `origin`: Protocol and hostname (`https://example.com`).
  - `protocol`: Strictly `'https:'` or `'http:'`.

### 2.2 `MetaTagsGatherer`
- **Output Artifact**: `MetaTagsArtifact`
- **Fields**:
  - `title`: Inner text of the `<title>` tag.
  - `description`: Value of `<meta name="description">`.
  - `canonical`: Value of `<link rel="canonical" href="...">`.
  - `viewport`: Value of `<meta name="viewport">`.
  - `robots`: Directives parsed from `<meta name="robots">`.
  - `openGraph`: Key-value map of `og:*` properties.
  - `twitterCard`: Key-value map of `twitter:*` properties.

### 2.3 `ImagesGatherer`
- **Output Artifact**: `ImagesArtifact`
- **Fields**:
  - `total`: Total `<img>` elements found in the DOM.
  - `withAlt`: Count of images with non-empty `alt` attributes.
  - `withoutAlt`: Count of images missing `alt` attributes.
  - `items`: List of `{ src, alt, width, height, isLazy }`.

### 2.4 `LinksGatherer`
- **Output Artifact**: `LinksArtifact`
- **Fields**:
  - `internal`: Array of internal URLs on the same hostname.
  - `external`: Array of outbound links to external domains.
  - `total`: Total `<a>` elements inspected.
  - `uncrawlable`: Anchor tags lacking `href` or using `javascript:;` / `#`.
  - `items`: List of `{ href, text, isInternal, rel, isFollow }`.

### 2.5 `KeywordsGatherer`
- **Output Artifact**: `KeywordsArtifact`
- **Fields**:
  - `totalWordCount`: Total cleaned words in primary content body.
  - `keywords`: Array of `{ term, count, densityPercent }`.
  - Filters out language-specific stop words (English and Spanish stopword dictionaries).

### 2.6 `RobotsTxtGatherer`
- **Output Artifact**: `RobotsTxtArtifact`
- **Fields**:
  - `exists`: Boolean indicating whether `/robots.txt` responded with HTTP 200.
  - `content`: Raw text of `robots.txt`.
  - `sitemaps`: Discovered XML sitemap URLs.
  - `aiBots`: Evaluated status map for `GPTBot`, `PerplexityBot`, `ClaudeBot`, `Google-Extended`, `CCBot`, `Bytespider` (`{ bot, isAllowed, lineMatched }`).

### 2.7 `HttpHeadersGatherer`
- **Output Artifact**: `HttpHeadersArtifact`
- **Fields**:
  - `statusCode`: HTTP status code (e.g. 200, 301, 404).
  - `xRobotsTag`: Raw value of `X-Robots-Tag` response header.
  - `contentType`: MIME type of response (`text/html`).
  - `headers`: Lowercased dictionary of all response headers.

### 2.8 `JSONLDGatherer`
- **Output Artifact**: `JSONLDArtifact`
- **Fields**:
  - `rawBlocks`: Array of raw strings from `<script type="application/ld+json">`.
  - `parsed`: Array of parsed JSON objects.
  - `errors`: Array of JSON parsing syntax errors with line numbers.
  - `detectedTypes`: Set of detected `@type` schemas (`Article`, `FAQPage`, `HowTo`, etc.).
  - `sameAs`: Array of entity disambiguation URLs.
  - `authors`: Array of `{ name, jobTitle, url }`.

### 2.9 `HeadingsHierarchyGatherer`
- **Output Artifact**: `HeadingsHierarchyArtifact`
- **Fields**:
  - `h1Count`: Total `<h1>` tags on page.
  - `items`: Ordered sequence of all `<h1>` to `<h6>` tags `{ level, text, selector }`.
  - `hasSkips`: Boolean indicating if heading nesting skips levels (e.g. H2 -> H4).
  - `skips`: Detailed list of skipped transitions.

### 2.10 `ContentChunksGatherer`
- **Output Artifact**: `ContentChunksArtifact`
- **Fields**:
  - `hasMain`: Boolean indicating presence of `<main>`.
  - `hasArticle`: Boolean indicating presence of `<article>`.
  - `semanticContainersCount`: Count of semantic container elements (`<main>`, `<article>`, `<section>`, `<aside>`).
  - `chunks`: Array of extracted text sections `{ text, estimatedTokens, containerTag }`.
  - `tablesCount`: Count of structured `<table>` tags.
  - `listsCount`: Count of `<ul>` and `<ol>` tags.

### 2.11 `DirectAnswersGatherer`
- **Output Artifact**: `DirectAnswersArtifact`
- **Fields**:
  - `questionHeadings`: Array of headings framed as interrogative questions.
  - `directAnswers`: Array of answers located immediately below headings `{ headingText, answerText, wordCount }`.
  - `definitions`: Count of direct definition patterns (*"X is...", "X refers to..."*).
  - `factsCount`: Count of empirical metrics (percentages `%`, numbers, currencies).
  - `externalCitations`: External reference links in text.

### 2.12 `LlmsTxtGatherer`
- **Output Artifact**: `LlmsTxtArtifact`
- **Fields**:
  - `llmsTxtExists`: Boolean indicating if `/llms.txt` returned HTTP 200.
  - `llmsTxtContent`: Raw content of `/llms.txt`.
  - `llmsFullTxtExists`: Boolean indicating if `/llms-full.txt` returned HTTP 200.
  - `hasH1`: Boolean verifying presence of standard top-level Markdown title.

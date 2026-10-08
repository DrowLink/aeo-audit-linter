# 📊 Spec 02: Audits Catalog & Scoring Heuristics

> **Total Audits:** 25  
> **Categories:** 5 (Weight: 20 each / 20% total per category)  
> **Score Scale:** Per-audit score $[0.0, 1.0]$, Category score $[0, 100]$, Overall $[0, 100]$.

---

## 1. Category 1: Core SEO & Indexability (`seo-fundamentals`)
**Category Weight:** 20 | **Total Audit Weights:** 52

Evaluates foundational on-page SEO, metadata compliance, crawlable links, mobile viewport, and security.

| Audit ID | Weight | Title | Pass Criteria / Threshold | Score Formula |
|---|---|---|---|---|
| `seo-title` | 8 | Page Title Element | Title tag exists and length is between 30 and 60 characters. | Length in [30, 60] $\to 1.0$. Length in [20, 29] or [61, 70] $\to 0.5$. Otherwise $\to 0.0$. |
| `seo-meta-description` | 7 | Meta Description Length | Meta description exists and length is between 70 and 155 characters. | Length in [70, 155] $\to 1.0$. Length in [50, 69] or [156, 175] $\to 0.5$. Otherwise $\to 0.0$. |
| `seo-canonical` | 6 | Canonical URL Tag | `<link rel="canonical">` exists, is absolute, and uses valid HTTP/HTTPS protocol. | Valid canonical $\to 1.0$, missing or relative $\to 0.0$. |
| `seo-indexability` | 8 | Search Engine Indexability | Verifies no blocking directives (`noindex`, `none`) in meta robots tag or headers. | Clean indexable page $\to 1.0$. If `noindex` detected $\to 0.0$. |
| `seo-image-alt` | 5 | Image Alt Attributes | Percentage of images possessing valid, non-empty `alt` attributes $\ge 90\%$. | $\text{score} = \frac{\text{imagesWithAlt}}{\text{totalImages}}$. If totalImages = 0 $\to 1.0$. |
| `seo-crawlable-links` | 5 | Crawlable Anchor Links | Anchor tags have valid `href` attributes (not `javascript:;`, `#`, or empty) and anchor text. | Ratio of valid crawlable links to total anchor tags. |
| `seo-open-graph` | 4 | OpenGraph & Social Metadata | Checks presence of `og:title`, `og:description`, `og:image`, and `twitter:card`. | Ratio of detected social tags (out of 4 core tags). |
| `seo-viewport-mobile` | 4 | Mobile Viewport Configuration | `<meta name="viewport">` exists with `width=device-width` and `initial-scale=1`. | Present and compliant $\to 1.0$, else $\to 0.0$. |
| `seo-https` | 5 | HTTPS Protocol Security | Target final URL protocol is strictly `https:`. | `url.protocol === 'https:'` $\to 1.0$, else $\to 0.0$. |

---

## 2. Category 2: AI Accessibility & Crawling (`ai-accessibility`)
**Category Weight:** 20 | **Total Audit Weights:** 25

Verifies accessibility and permissions for specialized AI search agents and LLM crawlers.

| Audit ID | Weight | Title | Pass Criteria / Threshold | Scoring Logic |
|---|---|---|---|---|
| `ai-robots-txt` | 9 | AI Bot Access in robots.txt | No `Disallow: /` directives for major AI crawlers (`GPTBot`, `PerplexityBot`, `ClaudeBot`, `Google-Extended`, `CCBot`, `Bytespider`). | Each allowed bot contributes proportionally. $1.0$ if all monitored AI bots are permitted. |
| `ai-x-robots-tag` | 7 | HTTP X-Robots-Tag Header | HTTP header `X-Robots-Tag` does not contain blocking directives (`noindex`, `noai`, `noimageai`). | Header clean or absent $\to 1.0$. Blocking directive $\to 0.0$. |
| `ai-llms-txt` | 6 | Machine-Readable `/llms.txt` | Standard `/llms.txt` exists at domain root with valid markdown and H1 title. | File present with valid markdown $\to 1.0$. `/llms-full.txt` adds bonus detail. Missing $\to 0.0$. |
| `ai-bot-sitemap` | 3 | XML Sitemap Declaration | `robots.txt` declares at least one valid `Sitemap:` directive. | Sitemap declared $\to 1.0$, absent $\to 0.0$. |

---

## 3. Category 3: Structured Data & RAG Schemas (`structured-data`)
**Category Weight:** 20 | **Total Audit Weights:** 25

Audits semantic graph entities, E-E-A-T signals, and structured JSON-LD schemas parsed by LLMs.

| Audit ID | Weight | Title | Pass Criteria / Threshold | Scoring Logic |
|---|---|---|---|---|
| `rag-schema-presence` | 8 | High-Value RAG Schemas | Detects structured schemas: `FAQPage`, `HowTo`, `Article`, `TechArticle`, `QAPage`, `Product`. | High-value schema present $\to 1.0$. Generic `WebPage`/`Organization` only $\to 0.5$. Missing $\to 0.0$. |
| `jsonld-syntax-validity` | 7 | JSON-LD Syntax Validity | All `<script type="application/ld+json">` blocks parse with valid syntax. | All blocks valid JSON $\to 1.0$. Any syntax or parse error $\to 0.0$. |
| `author-eeat-presence` | 6 | Author & E-E-A-T Credentials | Valid author credentials present via schema (`author.name`, `author.jobTitle`, `publisher`) or DOM byline. | Full author + credentials $\to 1.0$. Name only $\to 0.6$. No author found $\to 0.0$. |
| `entity-sameas-links` | 4 | Knowledge Graph `sameAs` Links | Organization/Person schema contains authoritative `sameAs` entity links (Wikidata, Wikipedia, LinkedIn). | $\ge 2$ authoritative entity links $\to 1.0$. 1 link $\to 0.5$. None $\to 0.0$. |

---

## 4. Category 4: Content Chunking & Semantic Structure (`content-chunking`)
**Category Weight:** 20 | **Total Audit Weights:** 25

Evaluates document layout for embedding generation, vector chunking, and tabular scannability.

| Audit ID | Weight | Title | Pass Criteria / Threshold | Scoring Logic |
|---|---|---|---|---|
| `heading-hierarchy` | 7 | Sequential Heading Hierarchy | Exactly one `<h1>` tag present; sequential nesting without level skips (e.g. `<h1>` followed by `<h3>` without `<h2>` is flagged). | Single H1 + zero skips $\to 1.0$. Single H1 with skips $\to 0.6$. Multiple or missing H1 $\to 0.0$. |
| `semantic-containers` | 6 | HTML5 Semantic Containers | Primary content wrapped in semantic tags (`<main>`, `<article>`, `<section>`) rather than unsemantic `<div>` soups. | `<main>` present + $\ge 2$ semantic blocks $\to 1.0$. `<main>` only $\to 0.6$. No semantic wrapper $\to 0.0$. |
| `chunk-token-density` | 6 | Embedding Chunk Token Density | Content sections possess optimal token sizes for embedding models (150 to 500 estimated tokens). | Ratio of paragraphs/chunks falling within the optimal $[150, 500]$ token envelope. |
| `table-list-scannability` | 6 | Structured Tables & Lists | Content features structured `<table>` or `<ul>`/`<ol>` elements for rapid tabular knowledge extraction. | $\ge 1$ structured table or $\ge 2$ rich lists $\to 1.0$. Partial lists $\to 0.5$. None $\to 0.0$. |

---

## 5. Category 5: Direct Answer Density & Fact Grounding (`direct-answer-density`)
**Category Weight:** 20 | **Total Audit Weights:** 25

Audits whether the page delivers concise, verifiable facts that can be directly extracted by Answer Engines.

| Audit ID | Weight | Title | Pass Criteria / Threshold | Scoring Logic |
|---|---|---|---|---|
| `direct-definition-answering` | 8 | Direct Definition Sentences | Clear definition patterns (e.g. *"X is a...", "X refers to..."*) located immediately after headings. | $\ge 2$ direct definition passages $\to 1.0$. 1 definition $\to 0.6$. None $\to 0.0$. |
| `concise-answer-wordcount` | 6 | Concise Answer Word Count | Answer blocks directly beneath question headings have an optimal concise length (30 to 60 words). | $\ge 70\%$ of answer blocks within $[30, 60]$ words $\to 1.0$. $[20, 80]$ words $\to 0.5$. Otherwise $\to 0.0$. |
| `fact-citation-density` | 6 | Fact & Citation Density | Page incorporates empirical data points (percentages `%`, numbers, currencies) and external citations. | Empirical data points $\ge 5$ and external citations $\ge 2$ $\to 1.0$. Partial data $\to 0.5$. |
| `question-heading-alignment` | 5 | Question-Formulated Headings | Headings formulated as natural search queries (*What, How, Why, When, Which, Is*). | $\ge 3$ question headings $\to 1.0$. 1–2 question headings $\to 0.5$. None $\to 0.0$. |

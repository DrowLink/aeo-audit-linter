/**
 * @fileoverview Types and contracts for raw artifacts collected by Gatherers.
 * Following the Google Lighthouse pattern, Gatherers extract raw DOM/network data
 * and produce a typed `Artifacts` object consumed by pure Audits.
 */

/**
 * Navigated and resolved URL information
 */
export interface URLArtifact {
  requestedUrl: string;
  finalUrl: string;
  domain: string;
  pathname: string;
  protocol: string;
}

/**
 * User-Agent specific rule in robots.txt
 */
export interface RobotsAgentRule {
  userAgent: string;
  allow: string[];
  disallow: string[];
  crawlDelay?: number;
}

/**
 * Robots.txt parsed artifact and AI bot directives
 */
export interface RobotsTxtArtifact {
  rawContent: string | null;
  statusCode: number | null;
  exists: boolean;
  sitemaps: string[];
  /** Rules by agent mapped by lowercase user-agent name */
  rulesByAgent: Record<string, RobotsAgentRule>;
  /** Crawling status identified for known AI search bots */
  aiBotsStatus: {
    gptBot?: 'allowed' | 'disallowed' | 'partially_disallowed' | 'not_specified';
    perplexityBot?: 'allowed' | 'disallowed' | 'partially_disallowed' | 'not_specified';
    claudeBot?: 'allowed' | 'disallowed' | 'partially_disallowed' | 'not_specified';
    googleExtended?: 'allowed' | 'disallowed' | 'partially_disallowed' | 'not_specified';
    ccBot?: 'allowed' | 'disallowed' | 'partially_disallowed' | 'not_specified';
    bytespider?: 'allowed' | 'disallowed' | 'partially_disallowed' | 'not_specified';
    cohereAi?: 'allowed' | 'disallowed' | 'partially_disallowed' | 'not_specified';
  };
}

/**
 * HTTP response headers artifact
 */
export interface HttpHeadersArtifact {
  statusCode: number;
  headers: Record<string, string | string[]>;
  xRobotsTag: string | null;
  contentType: string | null;
  cacheControl: string | null;
  contentEncoding: string | null;
}

/**
 * Extracted JSON-LD item or node
 */
export interface JSONLDItem {
  raw: string;
  parsed: Record<string, unknown> | null;
  type: string | string[] | null;
  context: string | null;
  isValid: boolean;
  syntaxErrors?: string[];
}

/**
 * Author and E-E-A-T credentials extracted from JSON-LD schemas and DOM
 */
export interface AuthorEeatInfo {
  hasAuthorSchema: boolean;
  authorName?: string;
  authorType?: string;
  authorSameAsUrls: string[];
  hasJobTitle: boolean;
  jobTitle?: string;
  hasPublisherSchema: boolean;
  publisherName?: string;
  hasDatePublished: boolean;
  datePublished?: string;
  hasDateModified: boolean;
  dateModified?: string;
  hasDomAuthorByline: boolean;
  domAuthorText?: string;
  hasDomPublishedDate: boolean;
}

/**
 * JSON-LD structured data artifact
 */
export interface JSONLDArtifact {
  items: JSONLDItem[];
  schemasCountByType: Record<string, number>;
  hasFAQPage: boolean;
  hasHowTo: boolean;
  hasArticle: boolean;
  hasQAPage: boolean;
  hasOrganization: boolean;
  hasProduct: boolean;
  hasSameAs: boolean;
  sameAsUrls: string[];
  authorEeat: AuthorEeatInfo;
}

/**
 * HTML meta tags and document metadata
 */
export interface MetaTagsArtifact {
  title: string | null;
  description: string | null;
  canonicalUrl: string | null;
  viewport: string | null;
  charset: string | null;
  openGraph: Record<string, string>;
  twitterCard: Record<string, string>;
  robotsMeta: string | null;
}

/**
 * Heading node in DOM hierarchy
 */
export interface HeadingNode {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  id?: string;
  index: number;
  parentHeadingIndex?: number;
}

/**
 * Heading hierarchy (H1-H6) artifact
 */
export interface HeadingsHierarchyArtifact {
  headings: HeadingNode[];
  h1Count: number;
  h2Count: number;
  h3Count: number;
  h4Count: number;
  h5Count: number;
  h6Count: number;
  hasSingleH1: boolean;
  isHierarchySequential: boolean;
  skippedLevels: Array<{ from: number; to: number; text: string }>;
}

/**
 * Image item extracted from DOM
 */
export interface ImageItem {
  src: string;
  alt: string | null;
  hasAlt: boolean;
  isDecorative: boolean;
  width?: number;
  height?: number;
  loading?: string;
}

/**
 * Images artifact for accessibility, crawler indexing, and asset analysis
 */
export interface ImagesArtifact {
  images: ImageItem[];
  totalImages: number;
  missingAltCount: number;
  passedAltCount: number;
}

/**
 * Anchor link item extracted from DOM
 */
export interface LinkItem {
  href: string;
  text: string;
  isInternal: boolean;
  isExternal: boolean;
  hasText: boolean;
  isCrawlable: boolean;
  rel?: string;
  target?: string;
}

/**
 * Links artifact for crawlability, internal/external distribution, and anchor quality
 */
export interface LinksArtifact {
  links: LinkItem[];
  totalLinks: number;
  internalLinksCount: number;
  externalLinksCount: number;
  missingTextCount: number;
  nonCrawlableCount: number;
}

/**
 * Keyword occurrence & density item
 */
export interface KeywordItem {
  word: string;
  count: number;
  densityPercent: number;
}

/**
 * Keywords & content density artifact for SEO and semantic scannability
 */
export interface KeywordsArtifact {
  topKeywords: KeywordItem[];
  totalWords: number;
}

/**
 * Semantic content chunk for RAG / LLM ingestion
 */
export interface ContentChunk {
  id: string;
  headingText?: string;
  headingLevel?: number;
  text: string;
  wordCount: number;
  estimatedTokens: number;
  parentTag: string;
  hasList: boolean;
  hasTable: boolean;
  hasCode: boolean;
  isSemanticContainer: boolean; // e.g. <article>, <section>, <main>
}

/**
 * Semantic content chunking artifact
 */
export interface ContentChunksArtifact {
  chunks: ContentChunk[];
  totalWordCount: number;
  totalEstimatedTokens: number;
  averageChunkTokenCount: number;
  semanticTagsUsed: string[];
  hasSemanticMain: boolean;
  hasSemanticArticle: boolean;
  hasSemanticSections: boolean;
  totalTablesCount: number;
  totalListsCount: number;
  totalListItemsCount: number;
  structuredTablesCount: number;
}

/**
 * Detected question and direct answer pair
 */
export interface DirectAnswerPair {
  question: string;
  questionSource: 'heading' | 'bold_text' | 'faq_schema' | 'paragraph';
  answerText: string;
  answerWordCount: number;
  isConcise: boolean; // 30 - 60 words ideal for answer engines
  hasDirectDefinition: boolean;
  confidenceScore: number;
}

/**
 * Verifiable facts, statistics, and citations metrics for GEO/AEO
 */
export interface FactMetrics {
  percentagesCount: number;
  numericalMetricsCount: number;
  citationPhrasesCount: number;
  externalSourcesCount: number;
  externalSourcesUrls: string[];
  totalFactSignals: number;
}

/**
 * Direct answer density artifact
 */
export interface DirectAnswersArtifact {
  pairs: DirectAnswerPair[];
  directAnswerRatio: number;
  conciseAnswersCount: number;
  definitionPatternsFound: number;
  facts: FactMetrics;
}

/**
 * Section or link group inside /llms.txt
 */
export interface LlmsTxtSection {
  title?: string;
  links: Array<{ title: string; url: string; description?: string }>;
}

/**
 * /llms.txt and /llms-full.txt parsed artifact
 */
export interface LlmsTxtArtifact {
  exists: boolean;
  statusCode: number | null;
  rawContent: string | null;
  charCount: number;
  hasFullVersion: boolean;
  fullStatusCode: number | null;
  title?: string;
  summary?: string;
  sections: LlmsTxtSection[];
  totalDeclaredLinks: number;
}

/**
 * Global immutable Artifacts container passed to Audits
 */
export interface Artifacts {
  URL: URLArtifact;
  RobotsTxt: RobotsTxtArtifact;
  HttpHeaders: HttpHeadersArtifact;
  JSONLD: JSONLDArtifact;
  MetaTags: MetaTagsArtifact;
  HeadingsHierarchy: HeadingsHierarchyArtifact;
  Images: ImagesArtifact;
  Links: LinksArtifact;
  Keywords: KeywordsArtifact;
  ContentChunks: ContentChunksArtifact;
  DirectAnswers: DirectAnswersArtifact;
  LlmsTxt: LlmsTxtArtifact;
  [customArtifact: string]: unknown;
}

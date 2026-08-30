/**
 * @fileoverview Default AEO & SEO Linter configuration with category weights and audit definitions.
 * Follows the Google Lighthouse configuration model (categories + auditRefs with weights).
 */

import type { LinterConfig } from '../types/config.js';

export const defaultConfig: LinterConfig = {
  settings: {
    locale: 'en-US',
    maxWaitForFulfill: 15000,
  },
  categories: {
    'seo-fundamentals': {
      title: 'Core SEO & Indexability',
      description:
        'Audits fundamental technical and on-page SEO signals including title tags, meta descriptions, canonical URLs, mobile viewport, image alt attributes, link crawlability, and indexing directives.',
      weight: 20,
      auditRefs: [
        { id: 'seo-title', weight: 8, group: 'meta' },
        { id: 'seo-meta-description', weight: 7, group: 'meta' },
        { id: 'seo-canonical', weight: 6, group: 'indexability' },
        { id: 'seo-indexability', weight: 8, group: 'indexability' },
        { id: 'seo-image-alt', weight: 5, group: 'content' },
        { id: 'seo-crawlable-links', weight: 5, group: 'links' },
        { id: 'seo-open-graph', weight: 4, group: 'social' },
        { id: 'seo-viewport-mobile', weight: 4, group: 'mobile' },
        { id: 'seo-https', weight: 5, group: 'security' },
      ],
    },
    'ai-accessibility': {
      title: 'AI Accessibility & Crawling',
      description:
        'Verifies that AI agents and search crawlers (GPTBot, PerplexityBot, ClaudeBot, Google-Extended, etc.) have unrestricted crawling permissions via robots.txt, HTTP headers, and llms.txt.',
      weight: 20,
      auditRefs: [
        { id: 'ai-robots-txt', weight: 9, group: 'crawling' },
        { id: 'ai-x-robots-tag', weight: 7, group: 'crawling' },
        { id: 'ai-bot-sitemap', weight: 3, group: 'crawling' },
        { id: 'ai-llms-txt', weight: 6, group: 'crawling' },
      ],
    },
    'structured-data': {
      title: 'Structured Data & RAG Schemas',
      description:
        'Audits JSON-LD schemas optimized for RAG (FAQPage, HowTo, Article, QAPage, sameAs, Author E-E-A-T) that enrich LLM knowledge graphs with structured entity data.',
      weight: 20,
      auditRefs: [
        { id: 'jsonld-syntax-validity', weight: 7, group: 'schema' },
        { id: 'rag-schema-presence', weight: 8, group: 'schema' },
        { id: 'entity-sameas-links', weight: 4, group: 'knowledge-graph' },
        { id: 'author-eeat-presence', weight: 6, group: 'eeat' },
      ],
    },
    'content-chunking': {
      title: 'Content Chunking & Semantic Structure',
      description:
        'Evaluates H1-H3 sequential hierarchy, semantic partitioning (<article>, <section>, <main>), token density, and structured tables/lists for optimal RAG embedding extraction.',
      weight: 20,
      auditRefs: [
        { id: 'heading-hierarchy', weight: 7, group: 'structure' },
        { id: 'semantic-containers', weight: 6, group: 'structure' },
        { id: 'chunk-token-density', weight: 6, group: 'embeddings' },
        { id: 'table-list-scannability', weight: 6, group: 'structure' },
      ],
    },
    'direct-answer-density': {
      title: 'Direct Answer Density & Fact Grounding',
      description:
        'Detects concise direct answers, clear definitions, and verifiable facts/citations that optimize extraction for Answer Engines (Perplexity, SearchGPT, AI Overviews).',
      weight: 20,
      auditRefs: [
        { id: 'direct-definition-answering', weight: 8, group: 'answers' },
        { id: 'concise-answer-wordcount', weight: 6, group: 'answers' },
        { id: 'question-heading-alignment', weight: 5, group: 'answers' },
        { id: 'fact-citation-density', weight: 6, group: 'facts' },
      ],
    },
  },
  audits: [
    // SEO Fundamentals
    'seo-title',
    'seo-meta-description',
    'seo-canonical',
    'seo-indexability',
    'seo-image-alt',
    'seo-crawlable-links',
    'seo-open-graph',
    'seo-viewport-mobile',
    'seo-https',
    // AI Accessibility
    'ai-robots-txt',
    'ai-x-robots-tag',
    'ai-bot-sitemap',
    'ai-llms-txt',
    // Structured Data
    'jsonld-syntax-validity',
    'rag-schema-presence',
    'entity-sameas-links',
    'author-eeat-presence',
    // Content Chunking
    'heading-hierarchy',
    'semantic-containers',
    'chunk-token-density',
    'table-list-scannability',
    // Direct Answer Density
    'direct-definition-answering',
    'concise-answer-wordcount',
    'question-heading-alignment',
    'fact-citation-density',
  ],
};

/**
 * @fileoverview Default AEO Linter configuration with category weights and audit definitions.
 * Follows the Google Lighthouse configuration model (categories + auditRefs with weights).
 */

import type { LinterConfig } from '../types/config.js';

export const defaultConfig: LinterConfig = {
  settings: {
    locale: 'en-US',
    maxWaitForFulfill: 15000,
  },
  categories: {
    'ai-accessibility': {
      title: 'AI Accessibility & Crawling',
      description:
        'Verifies that AI agents and search crawlers (GPTBot, PerplexityBot, ClaudeBot, Google-Extended, etc.) have unrestricted crawling permissions via robots.txt and HTTP headers.',
      weight: 25,
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
        'Audits JSON-LD schemas optimized for RAG (FAQPage, HowTo, Article, QAPage, sameAs) that enrich LLM knowledge graphs with structured entity data.',
      weight: 25,
      auditRefs: [
        { id: 'jsonld-syntax-validity', weight: 8, group: 'schema' },
        { id: 'rag-schema-presence', weight: 8, group: 'schema' },
        { id: 'entity-sameas-links', weight: 4, group: 'knowledge-graph' },
      ],
    },
    'content-chunking': {
      title: 'Content Chunking & Semantic Structure',
      description:
        'Evaluates H1-H3 sequential hierarchy, semantic partitioning (<article>, <section>, <main>), token density, and structured tables/lists for optimal RAG embedding extraction.',
      weight: 25,
      auditRefs: [
        { id: 'heading-hierarchy', weight: 7, group: 'structure' },
        { id: 'semantic-containers', weight: 6, group: 'structure' },
        { id: 'chunk-token-density', weight: 6, group: 'embeddings' },
        { id: 'table-list-scannability', weight: 6, group: 'structure' },
      ],
    },
    'direct-answer-density': {
      title: 'Direct Answer Density',
      description:
        'Detects concise, direct definitions and answers to key user questions, optimizing extraction for Answer Engines (Perplexity, SearchGPT, AI Overviews).',
      weight: 25,
      auditRefs: [
        { id: 'direct-definition-answering', weight: 10, group: 'answers' },
        { id: 'concise-answer-wordcount', weight: 6, group: 'answers' },
        { id: 'question-heading-alignment', weight: 4, group: 'answers' },
      ],
    },
  },
  audits: [
    // AI Accessibility
    'ai-robots-txt',
    'ai-x-robots-tag',
    'ai-bot-sitemap',
    'ai-llms-txt',
    // Structured Data
    'jsonld-syntax-validity',
    'rag-schema-presence',
    'entity-sameas-links',
    // Content Chunking
    'heading-hierarchy',
    'semantic-containers',
    'chunk-token-density',
    'table-list-scannability',
    // Direct Answer Density
    'direct-definition-answering',
    'concise-answer-wordcount',
    'question-heading-alignment',
  ],
};

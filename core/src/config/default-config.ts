/**
 * @fileoverview Configuración por defecto de AEO Linter con ponderaciones de categorías y auditorías.
 * Estructurado fielmente al modelo de configuración de Google Lighthouse (categories + auditRefs con weights).
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
        'Verifica que los agentes y rastreadores de IA (GPTBot, PerplexityBot, ClaudeBot, Google-Extended, etc.) tengan acceso sin restricciones innecesarias vía robots.txt y cabeceras HTTP.',
      weight: 25,
      auditRefs: [
        { id: 'ai-robots-txt', weight: 10, group: 'crawling' },
        { id: 'ai-x-robots-tag', weight: 8, group: 'crawling' },
        { id: 'ai-bot-sitemap', weight: 2, group: 'crawling' },
      ],
    },
    'structured-data': {
      title: 'Structured Data & RAG Schemas',
      description:
        'Audita esquemas JSON-LD optimizados para RAG (FAQPage, HowTo, Article, QAPage, sameAs) que enriquecen los grafos de conocimiento de los modelos de lenguaje.',
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
        'Evalúa la jerarquía H1-H3, la segmentación semántica (<article>, <section>, <main>) y la densidad de tokens por bloque para facilitar la tokenización y embeddings en RAG.',
      weight: 25,
      auditRefs: [
        { id: 'heading-hierarchy', weight: 8, group: 'structure' },
        { id: 'semantic-containers', weight: 6, group: 'structure' },
        { id: 'chunk-token-density', weight: 6, group: 'embeddings' },
      ],
    },
    'direct-answer-density': {
      title: 'Direct Answer Density',
      description:
        'Detecta la concisión y presencia de respuestas directas e inmediatas a preguntas clave, optimizando la extracción para Answer Engines (Perplexity, SearchGPT, AI Overviews).',
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
    // Structured Data
    'jsonld-syntax-validity',
    'rag-schema-presence',
    'entity-sameas-links',
    // Content Chunking
    'heading-hierarchy',
    'semantic-containers',
    'chunk-token-density',
    // Direct Answer Density
    'direct-definition-answering',
    'concise-answer-wordcount',
    'question-heading-alignment',
  ],
};

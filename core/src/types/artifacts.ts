/**
 * @fileoverview Tipos y contratos para los artefactos recolectados por los Gatherers.
 * Siguiendo el patrón de Google Lighthouse, los Gatherers extraen datos crudos del DOM/red
 * y producen un objeto tipado `Artifacts` que las auditorías consumen como funciones puras.
 */

/**
 * Información de URL navegada y redirigida
 */
export interface URLArtifact {
  requestedUrl: string;
  finalUrl: string;
  domain: string;
  pathname: string;
  protocol: string;
}

/**
 * Regla de acceso para un User-Agent específico en robots.txt
 */
export interface RobotsAgentRule {
  userAgent: string;
  allow: string[];
  disallow: string[];
  crawlDelay?: number;
}

/**
 * Artefacto con el contenido e interpretación del archivo robots.txt
 */
export interface RobotsTxtArtifact {
  rawContent: string | null;
  statusCode: number | null;
  exists: boolean;
  sitemaps: string[];
  /** Reglas por User-Agent mapeadas por nombre en minúsculas */
  rulesByAgent: Record<string, RobotsAgentRule>;
  /** Directivas específicas identificadas para bots de IA conocidos */
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
 * Encabezados HTTP recolectados de la respuesta principal
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
 * Item o nodo JSON-LD individual extraído del documento
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
 * Artefacto de datos estructurados JSON-LD
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
}

/**
 * Meta etiquetas y atributos de cabecera HTML
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
 * Elemento de encabezado en la jerarquía del DOM
 */
export interface HeadingNode {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  id?: string;
  index: number;
  parentHeadingIndex?: number;
}

/**
 * Artefacto con el análisis de jerarquía de encabezados (H1-H6)
 */
export interface HeadingsHierarchyArtifact {
  headings: HeadingNode[];
  h1Count: number;
  h2Count: number;
  h3Count: number;
  hasSingleH1: boolean;
  isHierarchySequential: boolean;
  skippedLevels: Array<{ from: number; to: number; text: string }>;
}

/**
 * Bloque o chunk de contenido semántico orientado a ingestión RAG / LLM
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
 * Artefacto de fragmentación de contenido semántico (Chunking)
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
}

/**
 * Detección de patrones de pregunta y respuesta directa en el contenido
 */
export interface DirectAnswerPair {
  question: string;
  questionSource: 'heading' | 'bold_text' | 'faq_schema' | 'paragraph';
  answerText: string;
  answerWordCount: number;
  isConcise: boolean; // 30 - 60 palabras ideal para answer engines
  hasDirectDefinition: boolean; // e.g., "X es un...", "El término X se refiere a..."
  confidenceScore: number;
}

/**
 * Artefacto con la densidad de respuestas directas identificadas
 */
export interface DirectAnswersArtifact {
  pairs: DirectAnswerPair[];
  directAnswerRatio: number; // Porcentaje de preguntas que cuentan con respuesta directa inmediata
  conciseAnswersCount: number;
  definitionPatternsFound: number;
}

/**
 * Contrato principal de artefactos recopilados por el pipeline de Gatherers.
 * Este objeto es inmutable y se entrega a cada Audit.
 */
export interface Artifacts {
  URL: URLArtifact;
  RobotsTxt: RobotsTxtArtifact;
  HttpHeaders: HttpHeadersArtifact;
  JSONLD: JSONLDArtifact;
  MetaTags: MetaTagsArtifact;
  HeadingsHierarchy: HeadingsHierarchyArtifact;
  ContentChunks: ContentChunksArtifact;
  DirectAnswers: DirectAnswersArtifact;
  /** Espacio para artefactos personalizados de extensiones o plugins */
  [customArtifact: string]: unknown;
}

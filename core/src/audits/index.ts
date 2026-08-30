/**
 * @fileoverview Central registry and exports of all available AEO & SEO audits
 */

import { Audit } from './audit.js';

// SEO Fundamentals
import { SeoTitleAudit } from './seo/seo-title.js';
import { SeoMetaDescriptionAudit } from './seo/seo-meta-description.js';
import { SeoCanonicalAudit } from './seo/seo-canonical.js';
import { SeoIndexabilityAudit } from './seo/seo-indexability.js';
import { SeoImageAltAudit } from './seo/seo-image-alt.js';
import { SeoCrawlableLinksAudit } from './seo/seo-crawlable-links.js';
import { SeoOpenGraphAudit } from './seo/seo-open-graph.js';
import { SeoViewportMobileAudit } from './seo/seo-viewport-mobile.js';
import { SeoHttpsAudit } from './seo/seo-https.js';

// AI Accessibility
import { AiRobotsTxtAudit } from './ai-accessibility/ai-robots-txt.js';
import { AiXRobotsTagAudit } from './ai-accessibility/ai-x-robots-tag.js';
import { AiBotSitemapAudit } from './ai-accessibility/ai-bot-sitemap.js';
import { AiLlmsTxtAudit } from './ai-accessibility/ai-llms-txt.js';

// Structured Data
import { JsonLdSyntaxValidityAudit } from './structured-data/jsonld-syntax-validity.js';
import { RagSchemaPresenceAudit } from './structured-data/rag-schema-presence.js';
import { EntitySameAsLinksAudit } from './structured-data/entity-sameas-links.js';
import { AuthorEeatPresenceAudit } from './structured-data/author-eeat-presence.js';

// Content Chunking
import { HeadingHierarchyAudit } from './content-chunking/heading-hierarchy.js';
import { SemanticContainersAudit } from './content-chunking/semantic-containers.js';
import { ChunkTokenDensityAudit } from './content-chunking/chunk-token-density.js';
import { TableListScannabilityAudit } from './content-chunking/table-list-scannability.js';

// Direct Answer Density
import { DirectDefinitionAnsweringAudit } from './direct-answer-density/direct-definition-answering.js';
import { ConciseAnswerWordCountAudit } from './direct-answer-density/concise-answer-wordcount.js';
import { QuestionHeadingAlignmentAudit } from './direct-answer-density/question-heading-alignment.js';
import { FactCitationDensityAudit } from './direct-answer-density/fact-citation-density.js';

export {
  Audit,
  // SEO
  SeoTitleAudit,
  SeoMetaDescriptionAudit,
  SeoCanonicalAudit,
  SeoIndexabilityAudit,
  SeoImageAltAudit,
  SeoCrawlableLinksAudit,
  SeoOpenGraphAudit,
  SeoViewportMobileAudit,
  SeoHttpsAudit,
  // AI Accessibility
  AiRobotsTxtAudit,
  AiXRobotsTagAudit,
  AiBotSitemapAudit,
  AiLlmsTxtAudit,
  // Structured Data
  JsonLdSyntaxValidityAudit,
  RagSchemaPresenceAudit,
  EntitySameAsLinksAudit,
  AuthorEeatPresenceAudit,
  // Content Chunking
  HeadingHierarchyAudit,
  SemanticContainersAudit,
  ChunkTokenDensityAudit,
  TableListScannabilityAudit,
  // Direct Answer Density
  DirectDefinitionAnsweringAudit,
  ConciseAnswerWordCountAudit,
  QuestionHeadingAlignmentAudit,
  FactCitationDensityAudit,
};

export const auditRegistry: Record<string, typeof Audit> = {
  // SEO
  'seo-title': SeoTitleAudit,
  'seo-meta-description': SeoMetaDescriptionAudit,
  'seo-canonical': SeoCanonicalAudit,
  'seo-indexability': SeoIndexabilityAudit,
  'seo-image-alt': SeoImageAltAudit,
  'seo-crawlable-links': SeoCrawlableLinksAudit,
  'seo-open-graph': SeoOpenGraphAudit,
  'seo-viewport-mobile': SeoViewportMobileAudit,
  'seo-https': SeoHttpsAudit,
  // AI Accessibility
  'ai-robots-txt': AiRobotsTxtAudit,
  'ai-x-robots-tag': AiXRobotsTagAudit,
  'ai-bot-sitemap': AiBotSitemapAudit,
  'ai-llms-txt': AiLlmsTxtAudit,
  // Structured Data
  'jsonld-syntax-validity': JsonLdSyntaxValidityAudit,
  'rag-schema-presence': RagSchemaPresenceAudit,
  'entity-sameas-links': EntitySameAsLinksAudit,
  'author-eeat-presence': AuthorEeatPresenceAudit,
  // Content Chunking
  'heading-hierarchy': HeadingHierarchyAudit,
  'semantic-containers': SemanticContainersAudit,
  'chunk-token-density': ChunkTokenDensityAudit,
  'table-list-scannability': TableListScannabilityAudit,
  // Direct Answer Density
  'direct-definition-answering': DirectDefinitionAnsweringAudit,
  'concise-answer-wordcount': ConciseAnswerWordCountAudit,
  'question-heading-alignment': QuestionHeadingAlignmentAudit,
  'fact-citation-density': FactCitationDensityAudit,
};

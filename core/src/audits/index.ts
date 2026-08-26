/**
 * @fileoverview Central registry and exports of all available AEO audits
 */

import { Audit } from './audit.js';

// AI Accessibility
import { AiRobotsTxtAudit } from './ai-accessibility/ai-robots-txt.js';
import { AiXRobotsTagAudit } from './ai-accessibility/ai-x-robots-tag.js';
import { AiBotSitemapAudit } from './ai-accessibility/ai-bot-sitemap.js';
import { AiLlmsTxtAudit } from './ai-accessibility/ai-llms-txt.js';

// Structured Data
import { JsonLdSyntaxValidityAudit } from './structured-data/jsonld-syntax-validity.js';
import { RagSchemaPresenceAudit } from './structured-data/rag-schema-presence.js';
import { EntitySameAsLinksAudit } from './structured-data/entity-sameas-links.js';

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
  AiRobotsTxtAudit,
  AiXRobotsTagAudit,
  AiBotSitemapAudit,
  AiLlmsTxtAudit,
  JsonLdSyntaxValidityAudit,
  RagSchemaPresenceAudit,
  EntitySameAsLinksAudit,
  HeadingHierarchyAudit,
  SemanticContainersAudit,
  ChunkTokenDensityAudit,
  TableListScannabilityAudit,
  DirectDefinitionAnsweringAudit,
  ConciseAnswerWordCountAudit,
  QuestionHeadingAlignmentAudit,
  FactCitationDensityAudit,
};

export const auditRegistry: Record<string, typeof Audit> = {
  'ai-robots-txt': AiRobotsTxtAudit,
  'ai-x-robots-tag': AiXRobotsTagAudit,
  'ai-bot-sitemap': AiBotSitemapAudit,
  'ai-llms-txt': AiLlmsTxtAudit,
  'jsonld-syntax-validity': JsonLdSyntaxValidityAudit,
  'rag-schema-presence': RagSchemaPresenceAudit,
  'entity-sameas-links': EntitySameAsLinksAudit,
  'heading-hierarchy': HeadingHierarchyAudit,
  'semantic-containers': SemanticContainersAudit,
  'chunk-token-density': ChunkTokenDensityAudit,
  'table-list-scannability': TableListScannabilityAudit,
  'direct-definition-answering': DirectDefinitionAnsweringAudit,
  'concise-answer-wordcount': ConciseAnswerWordCountAudit,
  'question-heading-alignment': QuestionHeadingAlignmentAudit,
  'fact-citation-density': FactCitationDensityAudit,
};

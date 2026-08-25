/**
 * @fileoverview Audit evaluating semantic HTML5 container elements (<main>, <article>, <section>)
 */

import { Audit } from '../audit.js';
import type { Artifacts, AuditMeta, AuditResult } from '../../types/index.js';

export class SemanticContainersAudit extends Audit {
  public static override meta: AuditMeta = {
    id: 'semantic-containers',
    title: 'Content uses semantic HTML5 containers (<main>, <article>, <section>)',
    failureTitle: 'Content relies on generic <div> wrappers without semantic HTML5 markup',
    description:
      'Semantic tags like <main>, <article>, and <section> isolate primary content from boilerplate (nav, sidebar, footer), improving chunk clean extraction for AI parsers.',
    requiredArtifacts: ['ContentChunks'],
  };

  public static override async audit(artifacts: Artifacts): Promise<AuditResult> {
    const chunks = artifacts.ContentChunks;

    const hasMain = chunks.hasSemanticMain;
    const hasArticleOrSection = chunks.hasSemanticArticle || chunks.hasSemanticSections;

    let score = 0.3;
    if (hasMain && hasArticleOrSection) {
      score = 1;
    } else if (hasMain || hasArticleOrSection) {
      score = 0.7;
    }

    const tags = chunks.semanticTagsUsed.length > 0 ? chunks.semanticTagsUsed.join(', ') : 'None (<div/body>)';

    return this.generateAuditResult({
      score,
      displayValue: `Semantic tags detected: ${tags}`,
      explanation: score < 1
        ? 'We recommend wrapping primary content within <main> and partitioning with <article> or <section>.'
        : undefined,
    });
  }
}

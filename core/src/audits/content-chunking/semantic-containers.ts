/**
 * @fileoverview Auditoría para evaluar el uso de etiquetas HTML5 semánticas (<article>, <section>, <main>)
 */

import { Audit } from '../audit.js';
import type { Artifacts, AuditMeta, AuditResult } from '../../types/index.js';

export class SemanticContainersAudit extends Audit {
  public static override meta: AuditMeta = {
    id: 'semantic-containers',
    title: 'El contenido utiliza contenedores semánticos (<main>, <article>, <section>)',
    failureTitle: 'El contenido depende de <div> genéricos sin estructura semántica HTML5',
    description:
      'Las etiquetas semánticas como <main>, <article> y <section> delimitan el contenido principal respecto al boilerplate (nav, sidebar, footer), facilitando el chunking limpio en parsers de IA.',
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

    const tags = chunks.semanticTagsUsed.length > 0 ? chunks.semanticTagsUsed.join(', ') : 'Ninguna (<div/body>)';

    return this.generateAuditResult({
      score,
      displayValue: `Etiquetas semánticas detectadas: ${tags}`,
      explanation: score < 1
        ? 'Recomendamos encapsular el contenido clave dentro de <main> y subdividirlo en <article> o <section>.'
        : undefined,
    });
  }
}

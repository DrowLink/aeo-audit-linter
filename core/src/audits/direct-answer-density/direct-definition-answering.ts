/**
 * @fileoverview Auditoría para evaluar la presencia de definiciones directas a preguntas clave
 */

import { Audit } from '../audit.js';
import type { Artifacts, AuditMeta, AuditResult } from '../../types/index.js';

export class DirectDefinitionAnsweringAudit extends Audit {
  public static override meta: AuditMeta = {
    id: 'direct-definition-answering',
    title: 'Las preguntas clave se responden de forma directa con definiciones claras en el primer párrafo',
    failureTitle: 'Faltan respuestas directas o definiciones claras tras las preguntas clave',
    description:
      'Los Answer Engines (Perplexity, SearchGPT, Google AI Overviews) seleccionan pasajes que entregan una respuesta directa en las primeras líneas (e.g. "X es un...", "El proceso consiste en..."), en lugar de rodeos introductorios.',
    requiredArtifacts: ['DirectAnswers'],
  };

  public static override async audit(artifacts: Artifacts): Promise<AuditResult> {
    const directAnswers = artifacts.DirectAnswers;
    const pairs = directAnswers.pairs;

    if (pairs.length === 0) {
      return this.generateAuditResult({
        score: 0.5,
        displayValue: 'No se detectaron preguntas en encabezados para evaluar respuestas directas',
        explanation: 'Incorporar encabezados con formato de pregunta (e.g. "¿Qué es X?") favorece la captura de snippets en Answer Engines.',
      });
    }

    const definitionPairs = pairs.filter((p) => p.hasDirectDefinition);
    const score = Math.max(0.3, definitionPairs.length / pairs.length);

    const tableItems = pairs.map((p) => ({
      question: p.question,
      words: p.answerWordCount,
      hasDef: p.hasDirectDefinition ? 'Sí (Definición clara)' : 'No (Indirecto o descriptivo)',
      preview: p.answerText.length > 80 ? p.answerText.slice(0, 80) + '...' : p.answerText,
    }));

    return this.generateAuditResult({
      score: definitionPairs.length > 0 ? (score >= 0.5 ? 1 : 0.7) : 0.4,
      displayValue: `${definitionPairs.length} de ${pairs.length} preguntas responden con definición directa inmediata`,
      details: this.makeTableDetails(
        [
          { key: 'question', label: 'Pregunta Detectada', valueType: 'text' },
          { key: 'hasDef', label: 'Patrón de Respuesta', valueType: 'status' },
          { key: 'words', label: 'Palabras', valueType: 'numeric' },
          { key: 'preview', label: 'Extracto de Respuesta', valueType: 'text' },
        ],
        tableItems
      ),
    });
  }
}

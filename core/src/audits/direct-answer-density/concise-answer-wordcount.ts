/**
 * @fileoverview Auditoría para evaluar la concisión de respuestas (ideal 30 a 60 palabras)
 */

import { Audit } from '../audit.js';
import type { Artifacts, AuditMeta, AuditResult } from '../../types/index.js';

export class ConciseAnswerWordCountAudit extends Audit {
  public static override meta: AuditMeta = {
    id: 'concise-answer-wordcount',
    title: 'Las respuestas directas tienen una extensión concisa óptima (30 - 60 palabras)',
    failureTitle: 'Las respuestas directas son excesivamente extensas o demasiado escuetas',
    description:
      'Los modelos de lenguaje prefieren respuestas de 30 a 60 palabras como respuesta inicial o fragmento destacado para sintetizar en sus resúmenes.',
    requiredArtifacts: ['DirectAnswers'],
  };

  public static override async audit(artifacts: Artifacts): Promise<AuditResult> {
    const directAnswers = artifacts.DirectAnswers;
    const pairs = directAnswers.pairs;

    if (pairs.length === 0) {
      return this.generateAuditResult({
        score: 0.5,
        displayValue: 'Sin preguntas detectadas',
      });
    }

    const conciseCount = directAnswers.conciseAnswersCount;
    const ratio = conciseCount / pairs.length;
    const score = ratio >= 0.6 ? 1 : Math.max(0.3, ratio);

    return this.generateAuditResult({
      score,
      displayValue: `${conciseCount} de ${pairs.length} respuestas con longitud concisa óptima`,
      numericValue: conciseCount,
      numericUnit: 'respuestas',
      details: this.makeTableDetails(
        [
          { key: 'question', label: 'Pregunta', valueType: 'text' },
          { key: 'words', label: 'Conteo de Palabras', valueType: 'numeric' },
          { key: 'status', label: 'Evaluación', valueType: 'status' },
        ],
        pairs.map((p) => ({
          question: p.question,
          words: p.answerWordCount,
          status: p.isConcise ? 'Conciso (30-60 palabras)' : p.answerWordCount < 20 ? 'Demasiado breve' : 'Extenso (>75 palabras)',
        }))
      ),
    });
  }
}

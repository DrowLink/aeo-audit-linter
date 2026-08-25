/**
 * @fileoverview Auditoría para evaluar la formulación de preguntas orientadas a intención de búsqueda en encabezados
 */

import { Audit } from '../audit.js';
import type { Artifacts, AuditMeta, AuditResult } from '../../types/index.js';

export class QuestionHeadingAlignmentAudit extends Audit {
  public static override meta: AuditMeta = {
    id: 'question-heading-alignment',
    title: 'Se estructuran encabezados explícitos en formato de pregunta o consulta de usuario',
    failureTitle: 'Faltan encabezados orientados a consultas de búsqueda o preguntas frecuentes',
    description:
      'Formular encabezados (H2/H3) como preguntas naturales (e.g. "¿Cómo funciona X?", "¿Por qué elegir Y?") incrementa sustancialmente el match semántico en búsquedas vectoriales y RAG.',
    requiredArtifacts: ['HeadingsHierarchy', 'DirectAnswers'],
  };

  public static override async audit(artifacts: Artifacts): Promise<AuditResult> {
    const headings = artifacts.HeadingsHierarchy.headings;
    const directAnswers = artifacts.DirectAnswers;

    const questionHeadings = directAnswers.pairs.length;
    const totalSubheadings = headings.filter((h) => h.level === 2 || h.level === 3).length;

    if (totalSubheadings === 0) {
      return this.generateAuditResult({
        score: 0.5,
        displayValue: 'No se encontraron subtítulos H2 o H3',
      });
    }

    const ratio = questionHeadings / Math.max(1, totalSubheadings);
    const score = questionHeadings >= 1 ? (ratio >= 0.25 ? 1 : 0.8) : 0.4;

    return this.generateAuditResult({
      score,
      displayValue: `${questionHeadings} de ${totalSubheadings} subtítulos estructurados como pregunta`,
      explanation: questionHeadings === 0
        ? 'Recomendamos redactar al menos 1 o 2 subtítulos H2/H3 como preguntas directas que los usuarios suelen consultar.'
        : undefined,
    });
  }
}

/**
 * @fileoverview Auditoría para validar la jerarquía secuencial de encabezados H1-H6
 */

import { Audit } from '../audit.js';
import type { Artifacts, AuditMeta, AuditResult } from '../../types/index.js';

export class HeadingHierarchyAudit extends Audit {
  public static override meta: AuditMeta = {
    id: 'heading-hierarchy',
    title: 'La estructura de encabezados H1-H6 es secuencial y cuenta con un único H1',
    failureTitle: 'La jerarquía de encabezados contiene saltos de nivel o múltiples H1',
    description:
      'Una jerarquía clara y secuencial (H1 -> H2 -> H3) permite a los algoritmos de segmentación de RAG indexar el documento en fragmentos con contexto semántico preciso.',
    requiredArtifacts: ['HeadingsHierarchy'],
  };

  public static override async audit(artifacts: Artifacts): Promise<AuditResult> {
    const hierarchy = artifacts.HeadingsHierarchy;

    if (hierarchy.headings.length === 0) {
      return this.generateAuditResult({
        score: 0,
        displayValue: 'No se encontraron encabezados (H1-H6)',
        explanation: 'El documento carece de encabezados semánticos para estructurar el contenido.',
      });
    }

    let deductions = 0;
    const issues: string[] = [];

    if (hierarchy.h1Count === 0) {
      deductions += 0.4;
      issues.push('Falta el encabezado principal H1');
    } else if (hierarchy.h1Count > 1) {
      deductions += 0.2;
      issues.push(`Se detectaron ${hierarchy.h1Count} etiquetas H1 (se recomienda exactamente una)`);
    }

    if (!hierarchy.isHierarchySequential) {
      deductions += 0.3;
      issues.push(`Se encontraron ${hierarchy.skippedLevels.length} saltos bruscos de nivel (e.g. H1 a H3)`);
    }

    const score = this.clampScore(1 - deductions);

    return this.generateAuditResult({
      score,
      displayValue: issues.length === 0 ? 'Jerarquía óptima y secuencial' : issues.join(', '),
      details: hierarchy.skippedLevels.length > 0
        ? this.makeTableDetails(
            [
              { key: 'from', label: 'Desde Nivel', valueType: 'code' },
              { key: 'to', label: 'Hacia Nivel', valueType: 'code' },
              { key: 'text', label: 'Texto del Encabezado', valueType: 'text' },
            ],
            hierarchy.skippedLevels.map((s) => ({
              from: `H${s.from}`,
              to: `H${s.to}`,
              text: s.text,
            }))
          )
        : undefined,
    });
  }
}

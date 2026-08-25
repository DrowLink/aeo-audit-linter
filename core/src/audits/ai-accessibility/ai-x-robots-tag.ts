/**
 * @fileoverview Auditoría que verifica las cabeceras HTTP X-Robots-Tag para indexación por IA
 */

import { Audit } from '../audit.js';
import type { Artifacts, AuditMeta, AuditResult } from '../../types/index.js';

export class AiXRobotsTagAudit extends Audit {
  public static override meta: AuditMeta = {
    id: 'ai-x-robots-tag',
    title: 'Las cabeceras HTTP no bloquean la indexación ni el archivo de IA',
    failureTitle: 'Las cabeceras HTTP X-Robots-Tag restringen la indexación',
    description:
      'Directivas como `noindex`, `noarchive` o `noai` en la cabecera HTTP `X-Robots-Tag` impiden que los motores de IA almacenen en caché y procesen la página en sus pipelines de recuperación.',
    requiredArtifacts: ['HttpHeaders'],
  };

  public static override async audit(artifacts: Artifacts): Promise<AuditResult> {
    const xRobots = artifacts.HttpHeaders.xRobotsTag;

    if (!xRobots) {
      return this.generateAuditResult({
        score: 1,
        displayValue: 'Cabecera X-Robots-Tag limpia (sin restricciones)',
      });
    }

    const lower = xRobots.toLowerCase();
    const blockingDirectives = ['noindex', 'none', 'noarchive', 'noai'];
    const foundBlocking = blockingDirectives.filter((d) => lower.includes(d));

    const isBlocked = foundBlocking.length > 0;

    return this.generateAuditResult({
      score: isBlocked ? 0 : 1,
      displayValue: isBlocked
        ? `Directivas bloqueantes encontradas: ${foundBlocking.join(', ')}`
        : `Directivas permisivas: ${xRobots}`,
      explanation: isBlocked
        ? `Se detectó '${xRobots}' en la cabecera X-Robots-Tag, lo cual impide el análisis por modelos de lenguaje.`
        : undefined,
    });
  }
}

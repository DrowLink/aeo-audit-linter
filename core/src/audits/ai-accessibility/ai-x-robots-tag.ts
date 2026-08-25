/**
 * @fileoverview Audit verifying HTTP X-Robots-Tag headers for AI indexing permissions
 */

import { Audit } from '../audit.js';
import type { Artifacts, AuditMeta, AuditResult } from '../../types/index.js';

export class AiXRobotsTagAudit extends Audit {
  public static override meta: AuditMeta = {
    id: 'ai-x-robots-tag',
    title: 'HTTP headers do not block AI indexing or archiving',
    failureTitle: 'HTTP X-Robots-Tag headers restrict AI indexing or archiving',
    description:
      'Directives like `noindex`, `noarchive`, or `noai` in the `X-Robots-Tag` HTTP header prevent AI search models from caching and retrieving the page in RAG pipelines.',
    requiredArtifacts: ['HttpHeaders'],
  };

  public static override async audit(artifacts: Artifacts): Promise<AuditResult> {
    const xRobots = artifacts.HttpHeaders.xRobotsTag;

    if (!xRobots) {
      return this.generateAuditResult({
        score: 1,
        displayValue: 'Clean X-Robots-Tag header (no restrictions)',
      });
    }

    const lower = xRobots.toLowerCase();
    const blockingDirectives = ['noindex', 'none', 'noarchive', 'noai'];
    const foundBlocking = blockingDirectives.filter((d) => lower.includes(d));

    const isBlocked = foundBlocking.length > 0;

    return this.generateAuditResult({
      score: isBlocked ? 0 : 1,
      displayValue: isBlocked
        ? `Blocking directives detected: ${foundBlocking.join(', ')}`
        : `Permissive directives: ${xRobots}`,
      explanation: isBlocked
        ? `Detected '${xRobots}' in X-Robots-Tag header, preventing analysis by language models.`
        : undefined,
    });
  }
}

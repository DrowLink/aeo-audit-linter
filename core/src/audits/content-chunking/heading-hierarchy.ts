/**
 * @fileoverview Audit validating sequential heading hierarchy (H1-H6) and single H1 tag
 */

import { Audit } from '../audit.js';
import type { Artifacts, AuditMeta, AuditResult } from '../../types/index.js';

export class HeadingHierarchyAudit extends Audit {
  public static override meta: AuditMeta = {
    id: 'heading-hierarchy',
    title: 'Heading structure (H1-H6) is sequential and contains a single H1',
    failureTitle: 'Heading hierarchy contains level jumps or multiple H1 tags',
    description:
      'A clear, sequential hierarchy (H1 -> H2 -> H3) allows RAG chunking algorithms to partition documents with accurate semantic context.',
    requiredArtifacts: ['HeadingsHierarchy'],
  };

  public static override async audit(artifacts: Artifacts): Promise<AuditResult> {
    const hierarchy = artifacts.HeadingsHierarchy;

    if (hierarchy.headings.length === 0) {
      return this.generateAuditResult({
        score: 0,
        displayValue: 'No headings found (H1-H6)',
        explanation: 'Document lacks semantic headings to structure the content.',
      });
    }

    let deductions = 0;
    const issues: string[] = [];

    if (hierarchy.h1Count === 0) {
      deductions += 0.4;
      issues.push('Missing main H1 heading');
    } else if (hierarchy.h1Count > 1) {
      deductions += 0.2;
      issues.push(`Found ${hierarchy.h1Count} H1 tags (exactly one is recommended)`);
    }

    if (!hierarchy.isHierarchySequential) {
      deductions += 0.3;
      issues.push(`Found ${hierarchy.skippedLevels.length} skipped heading levels (e.g. H1 to H3)`);
    }

    const score = this.clampScore(1 - deductions);

    return this.generateAuditResult({
      score,
      displayValue: issues.length === 0 ? 'Optimal sequential heading hierarchy' : issues.join(', '),
      details: hierarchy.skippedLevels.length > 0
        ? this.makeTableDetails(
            [
              { key: 'from', label: 'From Level', valueType: 'code' },
              { key: 'to', label: 'To Level', valueType: 'code' },
              { key: 'text', label: 'Heading Text', valueType: 'text' },
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

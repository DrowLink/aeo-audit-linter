/**
 * @fileoverview Audit evaluating question-formulated search intent subheadings
 */

import { Audit } from '../audit.js';
import type { Artifacts, AuditMeta, AuditResult } from '../../types/index.js';

export class QuestionHeadingAlignmentAudit extends Audit {
  public static override meta: AuditMeta = {
    id: 'question-heading-alignment',
    title: 'Headings are structured as explicit questions or search queries',
    failureTitle: 'Lacks subheadings phrased as search queries or FAQs',
    description:
      'Formulating subheadings (H2/H3) as natural questions (e.g. "How does X work?", "Why choose Y?") significantly boosts semantic match in vector search and RAG.',
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
        displayValue: 'No H2 or H3 subheadings found',
      });
    }

    const ratio = questionHeadings / Math.max(1, totalSubheadings);
    const score = questionHeadings >= 1 ? (ratio >= 0.25 ? 1 : 0.8) : 0.4;

    return this.generateAuditResult({
      score,
      displayValue: `${questionHeadings} of ${totalSubheadings} subheadings phrased as questions`,
      explanation: questionHeadings === 0
        ? 'We recommend phrasing at least 1 or 2 H2/H3 subheadings as direct user questions.'
        : undefined,
    });
  }
}

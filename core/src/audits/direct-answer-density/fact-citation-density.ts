/**
 * @fileoverview Audit evaluating the presence of verifiable statistics, percentages, numerical metrics, and citations for GEO.
 */

import { Audit } from '../audit.js';
import type { Artifacts, AuditMeta, AuditResult } from '../../types/index.js';

export class FactCitationDensityAudit extends Audit {
  public static override meta: AuditMeta = {
    id: 'fact-citation-density',
    title: 'Content incorporates concrete statistics, verifiable metrics, and authoritative citations',
    failureTitle: 'Content lacks statistics, numerical metrics, or authoritative citations',
    description:
      'Generative Engine Optimization (GEO) research proves that incorporating empirical figures (percentages, numerical units) and citing trusted external sources boosts LLM citation likelihood by up to 40%.',
    requiredArtifacts: ['DirectAnswers', 'ContentChunks'],
  };

  public static override async audit(artifacts: Artifacts): Promise<AuditResult> {
    const { facts } = artifacts.DirectAnswers;
    const { totalWordCount } = artifacts.ContentChunks;

    if (totalWordCount < 150) {
      return this.generateAuditResult({
        score: 1,
        displayValue: 'Brief page (statistical citations optional)',
        explanation: 'Page has concise content under 150 words where empirical statistics and research citations are optional.',
      });
    }

    const {
      percentagesCount,
      numericalMetricsCount,
      citationPhrasesCount,
      externalSourcesCount,
      externalSourcesUrls,
      totalFactSignals,
    } = facts;

    let score = 0.5;
    if (totalFactSignals >= 4 && externalSourcesCount >= 1) {
      score = 1.0;
    } else if (totalFactSignals >= 3) {
      score = 0.85;
    } else if (totalFactSignals >= 1) {
      score = 0.65;
    } else {
      score = totalWordCount > 400 ? 0.3 : 0.5;
    }

    const summaryTable = [
      {
        metric: 'Percentages & Ratios (%)',
        count: String(percentagesCount),
        status: percentagesCount > 0 ? 'Detected' : 'None',
      },
      {
        metric: 'Numerical Metrics & Units',
        count: String(numericalMetricsCount),
        status: numericalMetricsCount > 0 ? 'Detected' : 'None',
      },
      {
        metric: 'Citation Attribution Markers',
        count: String(citationPhrasesCount),
        status: citationPhrasesCount > 0 ? 'Detected' : 'None',
      },
      {
        metric: 'External Authority Domains Linked',
        count: String(externalSourcesCount),
        status: externalSourcesUrls.length > 0 ? externalSourcesUrls.slice(0, 3).join(', ') : 'No external references',
      },
    ];

    return this.generateAuditResult({
      score,
      displayValue: `${totalFactSignals} fact signal(s) found (${percentagesCount} %, ${numericalMetricsCount} metrics, ${externalSourcesCount} sources)`,
      explanation: score < 0.85
        ? 'Adding verifiable percentages, empirical numbers, and citations to authoritative sources significantly increases confidence and citation frequency in AI Answer Engines (Perplexity, SearchGPT, Gemini).'
        : undefined,
      details: this.makeTableDetails(
        [
          { key: 'metric', label: 'Fact / Citation Signal', valueType: 'text' },
          { key: 'count', label: 'Count', valueType: 'text' },
          { key: 'status', label: 'Details / References', valueType: 'text' },
        ],
        summaryTable
      ),
    });
  }
}

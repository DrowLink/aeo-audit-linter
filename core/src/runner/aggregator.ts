/**
 * @fileoverview Weighted aggregator of audit results into categories and overall AEO score calculation.
 * Follows the Google Lighthouse score weighting formula.
 */

import type {
  LinterConfig,
  AuditResult,
  CategoryResult,
  AeoReportResult,
} from '../types/index.js';

export class Aggregator {
  /**
   * Groups audit results into configured categories and calculates weighted scores.
   */
  public static aggregate(options: {
    url: string;
    config: LinterConfig;
    auditResults: Record<string, AuditResult>;
    userAgent?: string;
  }): AeoReportResult {
    const { url, config, auditResults, userAgent = 'AEO Linter Engine' } = options;
    const categories: Record<string, CategoryResult> = {};

    let totalGlobalWeightedScore = 0;
    let totalGlobalWeight = 0;

    for (const [catId, catConfig] of Object.entries(config.categories)) {
      let catWeightedSum = 0;
      let catTotalWeight = 0;

      const evaluatedAuditRefs: CategoryResult['auditRefs'] = [];

      for (const auditRef of catConfig.auditRefs) {
        const result = auditResults[auditRef.id];
        if (!result) continue;

        evaluatedAuditRefs.push({
          ...auditRef,
          result,
        });

        // Only contribute to score if it's a numeric score (ignores notApplicable / informative)
        if (typeof result.score === 'number') {
          catWeightedSum += result.score * auditRef.weight;
          catTotalWeight += auditRef.weight;
        }
      }

      const catScore = catTotalWeight > 0 ? Number((catWeightedSum / catTotalWeight).toFixed(2)) : null;

      categories[catId] = {
        id: catId,
        title: catConfig.title,
        description: catConfig.description,
        score: catScore,
        auditRefs: evaluatedAuditRefs,
      };

      const globalWeight = catConfig.weight ?? 1;
      if (catScore !== null) {
        totalGlobalWeightedScore += catScore * globalWeight;
        totalGlobalWeight += globalWeight;
      }
    }

    const rawOverall = totalGlobalWeight > 0 ? (totalGlobalWeightedScore / totalGlobalWeight) * 100 : 0;
    const overallScore = Math.round(rawOverall);

    return {
      url,
      fetchTime: new Date().toISOString(),
      aeoVersion: '0.3.0',
      userAgent,
      overallScore,
      categories,
      audits: auditResults,
    };
  }
}

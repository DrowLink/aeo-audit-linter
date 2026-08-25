/**
 * @fileoverview Agregador ponderado de resultados de auditorías en categorías y cálculo del score general AEO.
 * Sigue fielmente la fórmula de ponderación de Google Lighthouse.
 */

import type {
  LinterConfig,
  AuditResult,
  CategoryResult,
  AeoReportResult,
} from '../types/index.js';

export class Aggregator {
  /**
   * Agrupa los resultados de auditorías en sus categorías y calcula puntuaciones ponderadas.
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

        // Solo sumamos al score si tiene un puntaje numérico (ignora notApplicable / informative)
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
      aeoVersion: '0.1.0',
      userAgent,
      overallScore,
      categories,
      audits: auditResults,
    };
  }
}

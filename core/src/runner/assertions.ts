/**
 * @fileoverview Quality Gates and Assertions Engine for CI/CD pipelines.
 */

import type { AeoReportResult } from '../types/config.js';

export interface QualityGateOptions {
  /** Overall score threshold (0 - 100) */
  failUnder?: number;
  /** Minimum score thresholds per category (0 - 100) */
  categoryAssertions?: Record<string, number>;
}

export interface AssertionFailure {
  target: 'overall' | 'category';
  name: string;
  actual: number;
  expected: number;
}

export interface QualityGateResult {
  passed: boolean;
  failures: AssertionFailure[];
}

/**
 * Evaluates AEO audit report results against CI/CD quality gates
 */
export function evaluateQualityGates(
  report: AeoReportResult,
  options: QualityGateOptions
): QualityGateResult {
  const failures: AssertionFailure[] = [];

  // 1. Overall Score Threshold
  if (typeof options.failUnder === 'number' && !isNaN(options.failUnder)) {
    if (report.overallScore < options.failUnder) {
      failures.push({
        target: 'overall',
        name: 'Overall Score',
        actual: report.overallScore,
        expected: options.failUnder,
      });
    }
  }

  // 2. Category Assertions
  if (options.categoryAssertions) {
    for (const [catKey, expectedRaw] of Object.entries(options.categoryAssertions)) {
      const normalizedKey = catKey.toLowerCase().trim();
      const expected = expectedRaw <= 1 && expectedRaw > 0 ? Math.round(expectedRaw * 100) : expectedRaw;

      // Find matching category (case-insensitive)
      const foundEntry = Object.entries(report.categories).find(
        ([k]) => k.toLowerCase() === normalizedKey
      );

      if (!foundEntry) {
        failures.push({
          target: 'category',
          name: catKey,
          actual: 0,
          expected,
        });
        continue;
      }

      const [, catResult] = foundEntry;
      const actual = Math.round((catResult.score ?? 0) * 100);

      if (actual < expected) {
        failures.push({
          target: 'category',
          name: catResult.title || catKey,
          actual,
          expected,
        });
      }
    }
  }

  return {
    passed: failures.length === 0,
    failures,
  };
}

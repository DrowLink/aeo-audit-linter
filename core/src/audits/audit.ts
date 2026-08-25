/**
 * @fileoverview Abstract base class Audit and result utilities following the Google Lighthouse pattern.
 * Concrete audits inherit from Audit and implement their static `audit()` method as a pure function
 * that evaluates required artifacts and returns an `AuditResult`.
 */

import type {
  Artifacts,
  AuditResult,
  AuditMeta,
  AuditContext,
  AuditDetails,
  TableHeading,
  TableDetails,
  ListDetails,
  ScoreDisplayMode,
} from '../types/index.js';

export abstract class Audit {
  /**
   * Static metadata for the audit.
   * Must be overridden by each concrete audit class.
   */
  public static meta: AuditMeta;

  /**
   * Pure audit evaluation method.
   * @param artifacts Immutable artifacts collected by Gatherers
   * @param context Execution context
   */
  public static async audit(
    artifacts: Artifacts,
    context?: AuditContext
  ): Promise<AuditResult> {
    throw new Error(`The audit() method is not implemented in ${this.name}`);
  }

  /**
   * Helper to generate a standardized audit result
   */
  public static generateAuditResult(options: {
    id?: string;
    score: number | null;
    scoreDisplayMode?: ScoreDisplayMode;
    title?: string;
    description?: string;
    numericValue?: number;
    numericUnit?: string;
    displayValue?: string;
    explanation?: string;
    errorMessage?: string;
    details?: AuditDetails;
    warnings?: string[];
  }): AuditResult {
    const meta = this.meta || {
      id: options.id ?? 'unknown-audit',
      title: options.title ?? 'Unknown Audit',
      description: options.description ?? '',
    };

    const isPassing = options.score !== null && options.score >= 0.9;
    const title = options.title ?? (isPassing ? meta.title : (meta.failureTitle || meta.title));

    let scoreDisplayMode: ScoreDisplayMode = options.scoreDisplayMode ?? 'numeric';
    if (options.score === null && !options.scoreDisplayMode) {
      scoreDisplayMode = 'notApplicable';
    } else if (typeof options.score === 'number' && (options.score === 0 || options.score === 1) && !options.scoreDisplayMode) {
      scoreDisplayMode = 'binary';
    }

    return {
      id: meta.id,
      score: options.score,
      scoreDisplayMode,
      title,
      description: options.description ?? meta.description,
      numericValue: options.numericValue,
      numericUnit: options.numericUnit,
      displayValue: options.displayValue,
      explanation: options.explanation,
      errorMessage: options.errorMessage,
      details: options.details,
      warnings: options.warnings,
    };
  }

  /**
   * Helper to construct table details (Lighthouse TableDetails)
   */
  public static makeTableDetails(
    headings: TableHeading[],
    items: Array<Record<string, unknown>>,
    summary?: TableDetails['summary']
  ): TableDetails {
    return {
      type: 'table',
      headings,
      items,
      summary,
    };
  }

  /**
   * Helper to construct list details
   */
  public static makeListDetails(
    items: Array<string | { text: string; subItems?: string[] }>
  ): ListDetails {
    return {
      type: 'list',
      items,
    };
  }

  /**
   * Helper to compute binary score
   */
  public static binaryScore(condition: boolean): number {
    return condition ? 1 : 0;
  }

  /**
   * Helper to clamp score between min and max
   */
  public static clampScore(value: number, min = 0, max = 1): number {
    return Math.min(Math.max(value, min), max);
  }
}

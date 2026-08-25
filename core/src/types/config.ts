/**
 * @fileoverview Configuration, category, and weighted score types.
 */

import type { AuditMeta } from './audit.js';

/**
 * Reference to an audit inside a category with its specific weight
 */
export interface AuditRef {
  /** Audit unique ID */
  id: string;
  /** Relative weight of the audit in category */
  weight: number;
  /** Optional visual group */
  group?: string;
}

/**
 * Category grouping thematic audits
 */
export interface CategoryConfig {
  /** Category title */
  title: string;
  /** Category description */
  description: string;
  /** Weighted audits belonging to this category */
  auditRefs: AuditRef[];
  /** Global weight of the category */
  weight?: number;
}

/**
 * Complete linter configuration
 */
export interface LinterConfig {
  /** Categories mapping */
  categories: Record<string, CategoryConfig>;
  /** Registered audit IDs or Metas */
  audits?: Array<string | AuditMeta>;
  /** Global settings */
  settings?: {
    locale?: string;
    maxWaitForFulfill?: number;
    userAgent?: string;
    [key: string]: unknown;
  };
}

/**
 * Evaluated category result with weighted score
 */
export interface CategoryResult {
  id: string;
  title: string;
  description: string;
  /** Category weighted score (0 - 1) */
  score: number | null;
  /** Audits evaluated in this category */
  auditRefs: Array<AuditRef & { result: import('./audit.js').AuditResult }>;
}

/**
 * Complete AEO audit report result
 */
export interface AeoReportResult {
  url: string;
  fetchTime: string;
  aeoVersion: string;
  userAgent: string;
  /** Aggregated overall score (0 - 100) */
  overallScore: number;
  /** Category results map */
  categories: Record<string, CategoryResult>;
  /** Direct audit results map */
  audits: Record<string, import('./audit.js').AuditResult>;
}

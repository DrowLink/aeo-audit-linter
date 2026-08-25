/**
 * @fileoverview Types and contracts for audits, results, and structured details.
 * Modeled after the Google Lighthouse result structure.
 */

import type { Artifacts } from './artifacts.js';

/**
 * Score display presentation mode
 */
export type ScoreDisplayMode =
  | 'binary'          // Pass (1) or fail (0)
  | 'numeric'         // Continuous score between 0 and 1
  | 'informative'     // Informative metric without scoring penalty
  | 'notApplicable'   // Not applicable to page context
  | 'error'           // Execution error during audit
  | 'manual';         // Requires manual verification

/**
 * Table column heading
 */
export interface TableHeading {
  key: string;
  label: string;
  valueType?: 'text' | 'url' | 'numeric' | 'code' | 'bytes' | 'ms' | 'status';
  subItemsHeading?: {
    key: string;
    valueType?: string;
  };
}

/**
 * Tabular details for itemized findings
 */
export interface TableDetails {
  type: 'table';
  headings: TableHeading[];
  items: Array<Record<string, unknown>>;
  summary?: {
    wastedMs?: number;
    wastedBytes?: number;
    totalItems?: number;
    [key: string]: unknown;
  };
}

/**
 * List details for simple findings
 */
export interface ListDetails {
  type: 'list';
  items: Array<string | { text: string; subItems?: string[] }>;
}

/**
 * Debug details for raw inspection
 */
export interface DebugDataDetails {
  type: 'debugdata';
  data: Record<string, unknown>;
}

/**
 * Opportunity details for potential gains
 */
export interface OpportunityDetails {
  type: 'opportunity';
  headings: TableHeading[];
  items: Array<Record<string, unknown>>;
  potentialGain?: string;
}

/**
 * Union of supported audit detail formats
 */
export type AuditDetails =
  | TableDetails
  | ListDetails
  | DebugDataDetails
  | OpportunityDetails;

/**
 * Standard audit result object
 */
export interface AuditResult {
  /** Unique audit ID (e.g. 'ai-robots-txt') */
  id: string;
  /** Normalized score between 0 and 1 (or null if notApplicable / informative) */
  score: number | null;
  /** Presentation mode */
  scoreDisplayMode: ScoreDisplayMode;
  /** Descriptive title */
  title: string;
  /** Detailed description of importance for AEO */
  description: string;
  /** Raw numeric metric value */
  numericValue?: number;
  /** Numeric metric unit (e.g. 'words', 'ms', 'items', '%') */
  numericUnit?: string;
  /** Formatted display string */
  displayValue?: string;
  /** Diagnostic reason / explanation */
  explanation?: string;
  /** Error message if execution failed */
  errorMessage?: string;
  /** Structured details for UI/CLI */
  details?: AuditDetails;
  /** Optional informational warnings */
  warnings?: string[];
}

/**
 * Static metadata required by each audit definition
 */
export interface AuditMeta {
  /** Unique audit ID */
  id: string;
  /** Title when passing or neutral */
  title: string;
  /** Title when failing */
  failureTitle?: string;
  /** Markdown description and documentation links */
  description: string;
  /** Required artifacts for this audit */
  requiredArtifacts: Array<keyof Artifacts>;
}

/**
 * Execution context passed to audit function
 */
export interface AuditContext {
  options?: Record<string, unknown>;
  settings?: {
    locale?: string;
    maxWaitForFulfill?: number;
    [key: string]: unknown;
  };
  computedCache?: Map<string, unknown>;
}

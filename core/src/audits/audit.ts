/**
 * @fileoverview Clase base abstracta Audit y utilidades de resultado, siguiendo el diseño de Google Lighthouse.
 * Cada auditoría concreta hereda de Audit e implementa su método estático `audit()` como una función pura
 * que evalúa los artefactos requeridos y produce un `AuditResult`.
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
   * Metadatos estáticos de la auditoría.
   * Debe ser sobrescrito por cada subclase de auditoría concreta.
   */
  public static meta: AuditMeta;

  /**
   * Método puro de ejecución de la auditoría.
   * @param artifacts Artefactos inmutables recolectados por los Gatherers
   * @param context Contexto de ejecución opcional
   */
  public static async audit(
    artifacts: Artifacts,
    context?: AuditContext
  ): Promise<AuditResult> {
    throw new Error(`El método audit() no ha sido implementado en ${this.name}`);
  }

  /**
   * Helper para generar un resultado de auditoría consistente
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
   * Helper para construir un detalle de tipo tabla (Lighthouse TableDetails)
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
   * Helper para construir un detalle de tipo lista
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
   * Helper para calcular puntaje binario
   */
  public static binaryScore(condition: boolean): number {
    return condition ? 1 : 0;
  }

  /**
   * Helper para calcular puntaje normalizado lineal o acotado
   */
  public static clampScore(value: number, min = 0, max = 1): number {
    return Math.min(Math.max(value, min), max);
  }
}

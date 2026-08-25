/**
 * @fileoverview Tipos y contratos para las auditorías, resultados y detalles.
 * Diseñado replicando fielmente la estructura de Google Lighthouse.
 */

import type { Artifacts } from './artifacts.js';

/**
 * Modo de presentación visual del puntaje
 */
export type ScoreDisplayMode =
  | 'binary'          // Pasa (1) o falla (0)
  | 'numeric'         // Score continuo entre 0 y 1
  | 'informative'     // Muestra valor informativo sin penalizar
  | 'notApplicable'   // No aplica al contexto de la página
  | 'error'           // Error de ejecución durante la auditoría
  | 'manual';         // Requiere verificación humana

/**
 * Encabezado de columna para detalles tabulares
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
 * Detalle tipo tabla para mostrar elementos evaluados
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
 * Detalle tipo lista simple de hallazgos
 */
export interface ListDetails {
  type: 'list';
  items: Array<string | { text: string; subItems?: string[] }>;
}

/**
 * Detalle para datos de depuración / inspección cruda
 */
export interface DebugDataDetails {
  type: 'debugdata';
  data: Record<string, unknown>;
}

/**
 * Detalle para oportunidades de mejora con ahorros o ganancias
 */
export interface OpportunityDetails {
  type: 'opportunity';
  headings: TableHeading[];
  items: Array<Record<string, unknown>>;
  potentialGain?: string;
}

/**
 * Unión de tipos de detalles admitidos en el resultado de auditoría
 */
export type AuditDetails =
  | TableDetails
  | ListDetails
  | DebugDataDetails
  | OpportunityDetails;

/**
 * Resultado formal retornado por la ejecución de una auditoría
 */
export interface AuditResult {
  /** Identificador único de la auditoría (e.g. 'ai-robots-txt') */
  id: string;
  /** Puntaje normalizado entre 0 y 1 (o null si es notApplicable / informative) */
  score: number | null;
  /** Modo de visualización del score */
  scoreDisplayMode: ScoreDisplayMode;
  /** Título descriptivo (en estado exitoso o general) */
  title: string;
  /** Explicación detallada de la auditoría y por qué es importante para AEO */
  description: string;
  /** Valor numérico crudo asociado (e.g. 85 para 85 palabras o 3 para 3 errores) */
  numericValue?: number;
  /** Unidad del valor numérico (e.g. 'words', 'ms', 'items', '%') */
  numericUnit?: string;
  /** Texto formateado para presentación directa (e.g. "3 direct answers found") */
  displayValue?: string;
  /** Razón por la cual la auditoría falló o dio este score */
  explanation?: string;
  /** Mensaje de error si la auditoría falló al ejecutarse */
  errorMessage?: string;
  /** Detalles estructurados para rendering en UI/CLI */
  details?: AuditDetails;
  /** Advertencias opcionales que no invalidan el score pero informan al usuario */
  warnings?: string[];
}

/**
 * Metadatos estáticos requeridos por cada definición de auditoría
 */
export interface AuditMeta {
  /** ID único de la auditoría */
  id: string;
  /** Título cuando pasa o título neutral */
  title: string;
  /** Título cuando la auditoría falla o no alcanza el score deseado */
  failureTitle?: string;
  /** Explicación y enlaces de documentación (Markdown) */
  description: string;
  /** Artefactos que esta auditoría requiere para poder ejecutarse */
  requiredArtifacts: Array<keyof Artifacts>;
}

/**
 * Contexto de ejecución pasado a la función de auditoría
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

/**
 * @fileoverview Tipos para la configuración, categorías y cálculo ponderado de scores.
 */

import type { AuditMeta } from './audit.js';

/**
 * Referencia a una auditoría dentro de una categoría, con su peso específico
 */
export interface AuditRef {
  /** Identificador de la auditoría */
  id: string;
  /** Peso relativo de la auditoría en la categoría (e.g. 1 a 10) */
  weight: number;
  /** Grupo visual opcional para organizar en la UI / reporte */
  group?: string;
}

/**
 * Categoría que agrupa auditorías temáticas
 */
export interface CategoryConfig {
  /** Título de la categoría */
  title: string;
  /** Descripción del propósito y su relevancia en AEO */
  description: string;
  /** Lista de auditorías ponderadas que pertenecen a esta categoría */
  auditRefs: AuditRef[];
  /** Peso global de la categoría respecto al score total (opcional) */
  weight?: number;
}

/**
 * Configuración completa del linter
 */
export interface LinterConfig {
  /** Categorías configuradas */
  categories: Record<string, CategoryConfig>;
  /** Auditorías registradas en esta configuración (IDs o Metas) */
  audits?: Array<string | AuditMeta>;
  /** Configuración global y banderas */
  settings?: {
    locale?: string;
    maxWaitForFulfill?: number;
    userAgent?: string;
    [key: string]: unknown;
  };
}

/**
 * Resultado evaluado de una categoría con su puntaje ponderado
 */
export interface CategoryResult {
  id: string;
  title: string;
  description: string;
  /** Score ponderado de la categoría (0 - 1) */
  score: number | null;
  /** Auditorías ejecutadas asociadas a esta categoría con sus resultados */
  auditRefs: Array<AuditRef & { result: import('./audit.js').AuditResult }>;
}

/**
 * Resultado completo del análisis AEO
 */
export interface AeoReportResult {
  url: string;
  fetchTime: string;
  aeoVersion: string;
  userAgent: string;
  /** Puntuación general agregada (0 - 100) */
  overallScore: number;
  /** Resultados por categoría */
  categories: Record<string, CategoryResult>;
  /** Mapa directo de auditorías por id */
  audits: Record<string, import('./audit.js').AuditResult>;
}

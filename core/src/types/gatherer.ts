/**
 * @fileoverview Tipos y contratos para la fase de Gatherers (recolección).
 */

import type { Artifacts } from './artifacts.js';

/**
 * Driver abstracto o adaptador de protocolo para extraer información de la página/DOM
 */
export interface Driver {
  evaluate<T>(script: string | (() => T)): Promise<T>;
  fetch(url: string, init?: RequestInit): Promise<Response>;
  getUrl(): Promise<string>;
  getHtml(): Promise<string>;
  getHttpHeaders(): Promise<Record<string, string | string[]>>;
}

/**
 * Contexto de recolección entregado a cada Gatherer
 */
export interface GathererContext {
  url: string;
  driver: Driver;
  settings?: Record<string, unknown>;
}

/**
 * Interfaz base para un Gatherer
 */
export interface IGatherer<K extends keyof Artifacts = keyof Artifacts> {
  /** Nombre del artefacto que produce */
  name: K;
  /** Método de recolección */
  getArtifact(context: GathererContext): Promise<Artifacts[K]>;
}

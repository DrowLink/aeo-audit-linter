/**
 * @fileoverview Types and contracts for Gatherers phase.
 */

import type { Artifacts } from './artifacts.js';

/**
 * Abstract driver or protocol adapter to extract DOM/network information
 */
export interface Driver {
  evaluate<T>(script: string | (() => T)): Promise<T>;
  fetch(url: string, init?: RequestInit): Promise<Response>;
  getUrl(): Promise<string>;
  getHtml(): Promise<string>;
  getHttpHeaders(): Promise<Record<string, string | string[]>>;
}

/**
 * Context passed to each Gatherer
 */
export interface GathererContext {
  url: string;
  driver: Driver;
  settings?: Record<string, unknown>;
}

/**
 * Gatherer base interface
 */
export interface IGatherer<K extends keyof Artifacts = keyof Artifacts> {
  /** Name of the artifact produced */
  name: K;
  /** Extraction method */
  getArtifact(context: GathererContext): Promise<Artifacts[K]>;
}

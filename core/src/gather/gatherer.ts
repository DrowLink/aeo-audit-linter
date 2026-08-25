/**
 * @fileoverview Clase base abstracta para Gatherers en el pipeline de AEO Linter.
 */

import type { Artifacts, IGatherer, GathererContext } from '../types/index.js';

export abstract class Gatherer<K extends keyof Artifacts = keyof Artifacts> implements IGatherer<K> {
  public abstract readonly name: K;

  /**
   * Extrae el artefacto crudo usando el driver/CDP del contexto
   */
  public abstract getArtifact(context: GathererContext): Promise<Artifacts[K]>;
}

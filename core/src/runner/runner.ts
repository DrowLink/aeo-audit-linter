/**
 * @fileoverview Runner principal de AEO Linter. Orquesta el pipeline de 3 fases:
 * 1. Gather (recolección de artefactos)
 * 2. Audit (ejecución de auditorías puras)
 * 3. Aggregate (agregación y cálculo de scores)
 */

import { CheerioDriver } from '../gather/driver/cheerio-driver.js';
import type { Driver, Artifacts, AuditResult, LinterConfig, AeoReportResult } from '../types/index.js';
import { defaultConfig } from '../config/default-config.js';

// Gatherers
import { URLGatherer } from '../gather/gatherers/url-gatherer.js';
import { RobotsTxtGatherer } from '../gather/gatherers/robots-txt-gatherer.js';
import { HttpHeadersGatherer } from '../gather/gatherers/http-headers-gatherer.js';
import { JSONLDGatherer } from '../gather/gatherers/jsonld-gatherer.js';
import { MetaTagsGatherer } from '../gather/gatherers/meta-tags-gatherer.js';
import { HeadingsHierarchyGatherer } from '../gather/gatherers/headings-hierarchy-gatherer.js';
import { ContentChunksGatherer } from '../gather/gatherers/content-chunks-gatherer.js';
import { DirectAnswersGatherer } from '../gather/gatherers/direct-answers-gatherer.js';

// Audits & Aggregator
import { auditRegistry } from '../audits/index.js';
import { Aggregator } from './aggregator.js';

export interface RunnerOptions {
  config?: LinterConfig;
  driver?: Driver;
  fetchFn?: typeof fetch;
  userAgent?: string;
  onProgress?: (phase: 'gather' | 'audit' | 'aggregate', message: string) => void;
}

export class Runner {
  /**
   * Ejecuta el pipeline completo de auditoría AEO para una URL o HTML provisto
   */
  public static async run(
    targetUrl: string,
    options: RunnerOptions = {}
  ): Promise<AeoReportResult> {
    const config = options.config || defaultConfig;
    const progress = options.onProgress || (() => {});

    // 1. Inicializar Driver si no fue provisto
    progress('gather', `Conectando y cargando ${targetUrl}...`);
    const driver =
      options.driver ||
      (await CheerioDriver.createFromUrl(targetUrl, options.fetchFn, {
        userAgent: options.userAgent,
      }));

    // 2. Fase de Gatherers
    progress('gather', 'Extrayendo artefactos crudos del DOM y red...');
    const artifacts = await this.gatherArtifacts(targetUrl, driver);

    // 3. Fase de Auditorías
    progress('audit', 'Ejecutando auditorías independientes...');
    const auditResults = await this.runAudits(artifacts, config);

    // 4. Fase de Agregación
    progress('aggregate', 'Calculando ponderaciones y score global AEO...');
    const report = Aggregator.aggregate({
      url: artifacts.URL.finalUrl || targetUrl,
      config,
      auditResults,
      userAgent: options.userAgent,
    });

    return report;
  }

  /**
   * Ejecuta los Gatherers para construir el objeto global Artifacts
   */
  public static async gatherArtifacts(url: string, driver: Driver): Promise<Artifacts> {
    const context = { url, driver };

    const urlGatherer = new URLGatherer();
    const robotsGatherer = new RobotsTxtGatherer();
    const headersGatherer = new HttpHeadersGatherer();
    const jsonldGatherer = new JSONLDGatherer();
    const metaGatherer = new MetaTagsGatherer();
    const headingsGatherer = new HeadingsHierarchyGatherer();
    const contentGatherer = new ContentChunksGatherer();
    const directAnswersGatherer = new DirectAnswersGatherer();

    const [
      urlArtifact,
      robotsArtifact,
      headersArtifact,
      jsonldArtifact,
      metaArtifact,
      headingsArtifact,
      contentArtifact,
      directAnswersArtifact,
    ] = await Promise.all([
      urlGatherer.getArtifact(context),
      robotsGatherer.getArtifact(context),
      headersGatherer.getArtifact(context),
      jsonldGatherer.getArtifact(context),
      metaGatherer.getArtifact(context),
      headingsGatherer.getArtifact(context),
      contentGatherer.getArtifact(context),
      directAnswersGatherer.getArtifact(context),
    ]);

    return {
      URL: urlArtifact,
      RobotsTxt: robotsArtifact,
      HttpHeaders: headersArtifact,
      JSONLD: jsonldArtifact,
      MetaTags: metaArtifact,
      HeadingsHierarchy: headingsArtifact,
      ContentChunks: contentArtifact,
      DirectAnswers: directAnswersArtifact,
    };
  }

  /**
   * Ejecuta las auditorías declaradas en la configuración
   */
  public static async runAudits(
    artifacts: Artifacts,
    config: LinterConfig
  ): Promise<Record<string, AuditResult>> {
    const auditResults: Record<string, AuditResult> = {};

    // Obtener lista única de IDs de auditoría a partir de la configuración
    const auditIdsToRun = new Set<string>();

    if (config.audits) {
      for (const a of config.audits) {
        auditIdsToRun.add(typeof a === 'string' ? a : a.id);
      }
    }

    for (const category of Object.values(config.categories)) {
      for (const ref of category.auditRefs) {
        auditIdsToRun.add(ref.id);
      }
    }

    for (const auditId of auditIdsToRun) {
      const AuditClass = auditRegistry[auditId];
      if (!AuditClass) {
        console.warn(`[AEO Runner] Auditoría no registrada: ${auditId}`);
        continue;
      }

      try {
        const result = await AuditClass.audit(artifacts);
        auditResults[auditId] = result;
      } catch (err) {
        auditResults[auditId] = {
          id: auditId,
          score: 0,
          scoreDisplayMode: 'error',
          title: `Error al ejecutar auditoría ${auditId}`,
          description: '',
          errorMessage: err instanceof Error ? err.message : String(err),
        };
      }
    }

    return auditResults;
  }
}

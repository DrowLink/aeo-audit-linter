/**
 * @fileoverview Main AEO Linter Runner. Orchestrates the 3-phase pipeline:
 * 1. Gather (extract raw artifacts)
 * 2. Audit (run pure deterministic audits)
 * 3. Aggregate (calculate category weights and global score)
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
import { ImagesGatherer } from '../gather/gatherers/images-gatherer.js';
import { LinksGatherer } from '../gather/gatherers/links-gatherer.js';
import { KeywordsGatherer } from '../gather/gatherers/keywords-gatherer.js';
import { ContentChunksGatherer } from '../gather/gatherers/content-chunks-gatherer.js';
import { DirectAnswersGatherer } from '../gather/gatherers/direct-answers-gatherer.js';
import { LlmsTxtGatherer } from '../gather/gatherers/llms-txt-gatherer.js';

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
   * Executes the full AEO audit lifecycle for a given URL
   */
  public static async run(
    targetUrl: string,
    options: RunnerOptions = {}
  ): Promise<AeoReportResult> {
    const config = options.config || defaultConfig;
    const progress = options.onProgress || (() => {});

    // 1. Initialize Driver
    progress('gather', `Connecting and loading ${targetUrl}...`);
    const driver =
      options.driver ||
      (await CheerioDriver.createFromUrl(targetUrl, options.fetchFn, {
        userAgent: options.userAgent,
      }));

    // 2. Gather Phase
    progress('gather', 'Extracting raw artifacts from DOM and network...');
    const artifacts = await this.gatherArtifacts(targetUrl, driver);

    // 3. Audit Phase
    progress('audit', 'Running pure independent audits...');
    const auditResults = await this.runAudits(artifacts, config);

    // 4. Aggregate Phase
    progress('aggregate', 'Computing weighted scores and overall AEO score...');
    const report = Aggregator.aggregate({
      url: artifacts.URL.finalUrl || targetUrl,
      config,
      auditResults,
      userAgent: options.userAgent,
    });

    return report;
  }

  /**
   * Runs all Gatherers to build the global Artifacts object
   */
  public static async gatherArtifacts(url: string, driver: Driver): Promise<Artifacts> {
    const context = { url, driver };

    const urlGatherer = new URLGatherer();
    const robotsGatherer = new RobotsTxtGatherer();
    const headersGatherer = new HttpHeadersGatherer();
    const jsonldGatherer = new JSONLDGatherer();
    const metaGatherer = new MetaTagsGatherer();
    const headingsGatherer = new HeadingsHierarchyGatherer();
    const imagesGatherer = new ImagesGatherer();
    const linksGatherer = new LinksGatherer();
    const keywordsGatherer = new KeywordsGatherer();
    const contentGatherer = new ContentChunksGatherer();
    const directAnswersGatherer = new DirectAnswersGatherer();
    const llmsTxtGatherer = new LlmsTxtGatherer();

    const [
      urlArtifact,
      robotsArtifact,
      headersArtifact,
      jsonldArtifact,
      metaArtifact,
      headingsArtifact,
      imagesArtifact,
      linksArtifact,
      keywordsArtifact,
      contentArtifact,
      directAnswersArtifact,
      llmsTxtArtifact,
    ] = await Promise.all([
      urlGatherer.getArtifact(context),
      robotsGatherer.getArtifact(context),
      headersGatherer.getArtifact(context),
      jsonldGatherer.getArtifact(context),
      metaGatherer.getArtifact(context),
      headingsGatherer.getArtifact(context),
      imagesGatherer.getArtifact(context),
      linksGatherer.getArtifact(context),
      keywordsGatherer.getArtifact(context),
      contentGatherer.getArtifact(context),
      directAnswersGatherer.getArtifact(context),
      llmsTxtGatherer.getArtifact(context),
    ]);

    return {
      URL: urlArtifact,
      RobotsTxt: robotsArtifact,
      HttpHeaders: headersArtifact,
      JSONLD: jsonldArtifact,
      MetaTags: metaArtifact,
      HeadingsHierarchy: headingsArtifact,
      Images: imagesArtifact,
      Links: linksArtifact,
      Keywords: keywordsArtifact,
      ContentChunks: contentArtifact,
      DirectAnswers: directAnswersArtifact,
      LlmsTxt: llmsTxtArtifact,
    };
  }

  /**
   * Executes all audits declared in configuration
   */
  public static async runAudits(
    artifacts: Artifacts,
    config: LinterConfig
  ): Promise<Record<string, AuditResult>> {
    const auditResults: Record<string, AuditResult> = {};

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
        console.warn(`[AEO Runner] Unregistered audit: ${auditId}`);
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
          title: `Error running audit ${auditId}`,
          description: '',
          errorMessage: err instanceof Error ? err.message : String(err),
        };
      }
    }

    return auditResults;
  }
}

/**
 * @fileoverview Audit verifying the declaration of valid XML Sitemaps in robots.txt
 */

import { Audit } from '../audit.js';
import type { Artifacts, AuditMeta, AuditResult } from '../../types/index.js';

export class AiBotSitemapAudit extends Audit {
  public static override meta: AuditMeta = {
    id: 'ai-bot-sitemap',
    title: 'robots.txt declares valid XML Sitemaps',
    failureTitle: 'No XML Sitemap declaration found in robots.txt',
    description:
      'XML Sitemaps enable Answer Engine crawlers to discover deep, structured content efficiently.',
    requiredArtifacts: ['RobotsTxt'],
  };

  public static override async audit(artifacts: Artifacts): Promise<AuditResult> {
    const sitemaps = artifacts.RobotsTxt.sitemaps;
    const hasSitemap = sitemaps.length > 0;

    return this.generateAuditResult({
      score: hasSitemap ? 1 : 0.5,
      displayValue: hasSitemap
        ? `${sitemaps.length} sitemap(s) declared`
        : 'No sitemap declared in robots.txt',
      details: hasSitemap
        ? this.makeListDetails(sitemaps)
        : undefined,
    });
  }
}

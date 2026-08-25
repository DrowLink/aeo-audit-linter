/**
 * @fileoverview Auditoría para verificar la declaración de Sitemaps accesibles
 */

import { Audit } from '../audit.js';
import type { Artifacts, AuditMeta, AuditResult } from '../../types/index.js';

export class AiBotSitemapAudit extends Audit {
  public static override meta: AuditMeta = {
    id: 'ai-bot-sitemap',
    title: 'El archivo robots.txt declara Sitemaps XML válidos',
    failureTitle: 'No se encontraron declaraciones de Sitemap en robots.txt',
    description:
      'Los Sitemaps XML permiten a los rastreadores de Answer Engines descubrir URLs profundas y estructuradas con alta eficiencia de rastreo.',
    requiredArtifacts: ['RobotsTxt'],
  };

  public static override async audit(artifacts: Artifacts): Promise<AuditResult> {
    const sitemaps = artifacts.RobotsTxt.sitemaps;
    const hasSitemap = sitemaps.length > 0;

    return this.generateAuditResult({
      score: hasSitemap ? 1 : 0.5,
      displayValue: hasSitemap
        ? `${sitemaps.length} sitemap(s) declarados`
        : 'Ningún sitemap declarado en robots.txt',
      details: hasSitemap
        ? this.makeListDetails(sitemaps)
        : undefined,
    });
  }
}

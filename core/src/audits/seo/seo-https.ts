/**
 * @fileoverview Audit validating secure HTTPS protocol encryption.
 */

import { Audit } from '../audit.js';
import type { Artifacts, AuditMeta, AuditResult } from '../../types/index.js';

export class SeoHttpsAudit extends Audit {
  public static override meta: AuditMeta = {
    id: 'seo-https',
    title: 'Page is served securely over HTTPS',
    failureTitle: 'Page is served over insecure HTTP',
    description:
      'HTTPS encryption protects user data and is an established ranking signal for search engines and trusted web crawlers.',
    requiredArtifacts: ['URL'],
  };

  public static override async audit(artifacts: Artifacts): Promise<AuditResult> {
    const protocol = (artifacts.URL.protocol || '').toLowerCase();
    const finalUrl = artifacts.URL.finalUrl || artifacts.URL.requestedUrl;

    const isHttps = protocol === 'https:' || finalUrl.startsWith('https://');

    if (isHttps) {
      return this.generateAuditResult({
        score: 1,
        displayValue: 'Page uses HTTPS',
      });
    }

    return this.generateAuditResult({
      score: 0,
      displayValue: 'Insecure HTTP connection',
      explanation: 'Search engines prefer and prioritize HTTPS-secured websites.',
    });
  }
}

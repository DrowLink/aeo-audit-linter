/**
 * @fileoverview Audit validating canonical URL link tag existence and validity.
 */

import { Audit } from '../audit.js';
import type { Artifacts, AuditMeta, AuditResult } from '../../types/index.js';

export class SeoCanonicalAudit extends Audit {
  public static override meta: AuditMeta = {
    id: 'seo-canonical',
    title: 'Document has a valid canonical URL link element',
    failureTitle: 'Document is missing a canonical URL or points to an invalid address',
    description:
      'Canonical URLs prevent duplicate content issues by explicitly declaring the authoritative source URL for search engines and AI knowledge aggregators.',
    requiredArtifacts: ['MetaTags', 'URL'],
  };

  public static override async audit(artifacts: Artifacts): Promise<AuditResult> {
    const canonical = artifacts.MetaTags.canonicalUrl;
    const currentUrl = artifacts.URL.finalUrl || artifacts.URL.requestedUrl;

    if (!canonical || canonical.trim().length === 0) {
      return this.generateAuditResult({
        score: 0,
        displayValue: 'Canonical URL not set',
        explanation: 'No <link rel="canonical" href="..."> was detected in the document head.',
      });
    }

    try {
      const canonicalObj = new URL(canonical, currentUrl);
      if (!canonicalObj.protocol.startsWith('http')) {
        return this.generateAuditResult({
          score: 0.3,
          displayValue: `Invalid canonical protocol (${canonicalObj.protocol})`,
          explanation: 'Canonical URL must use http or https protocol.',
        });
      }

      return this.generateAuditResult({
        score: 1,
        displayValue: `Canonical set to ${canonical}`,
        details: this.makeTableDetails(
          [
            { key: 'canonical', label: 'Canonical URL', valueType: 'url' },
            { key: 'current', label: 'Current Page URL', valueType: 'url' },
          ],
          [{ canonical: canonicalObj.href, current: currentUrl }]
        ),
      });
    } catch {
      return this.generateAuditResult({
        score: 0,
        displayValue: `Malformed canonical URL (${canonical})`,
        explanation: 'The canonical URL could not be parsed as a valid URL.',
      });
    }
  }
}

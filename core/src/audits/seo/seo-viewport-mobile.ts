/**
 * @fileoverview Audit validating mobile viewport meta tag configuration for mobile responsiveness and mobile-first indexing.
 */

import { Audit } from '../audit.js';
import type { Artifacts, AuditMeta, AuditResult } from '../../types/index.js';

export class SeoViewportMobileAudit extends Audit {
  public static override meta: AuditMeta = {
    id: 'seo-viewport-mobile',
    title: 'Document has a mobile-friendly <meta name="viewport"> tag',
    failureTitle: 'Document is missing a mobile viewport tag or has incorrect configuration',
    description:
      'Mobile-first indexing requires a viewport meta tag (such as width=device-width, initial-scale=1) to optimize display on mobile screens.',
    requiredArtifacts: ['MetaTags'],
  };

  public static override async audit(artifacts: Artifacts): Promise<AuditResult> {
    const viewport = artifacts.MetaTags.viewport;

    if (!viewport || viewport.trim().length === 0) {
      return this.generateAuditResult({
        score: 0,
        displayValue: 'Missing viewport meta tag',
        explanation: 'No <meta name="viewport"> tag was found in the document head.',
      });
    }

    const lower = viewport.toLowerCase();
    const hasDeviceWidth = lower.includes('width=device-width') || lower.includes('width=');
    const hasInitialScale = lower.includes('initial-scale=');

    if (hasDeviceWidth && hasInitialScale) {
      return this.generateAuditResult({
        score: 1,
        displayValue: `Viewport configured (${viewport})`,
      });
    }

    if (hasDeviceWidth || hasInitialScale) {
      return this.generateAuditResult({
        score: 0.8,
        displayValue: `Partial viewport configuration (${viewport})`,
        explanation: 'Recommended: width=device-width, initial-scale=1',
      });
    }

    return this.generateAuditResult({
      score: 0.5,
      displayValue: `Suboptimal viewport configuration (${viewport})`,
      explanation: 'Recommended standard: width=device-width, initial-scale=1',
    });
  }
}

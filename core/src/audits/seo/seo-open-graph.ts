/**
 * @fileoverview Audit validating Open Graph and Twitter Card social and generative preview metadata.
 */

import { Audit } from '../audit.js';
import type { Artifacts, AuditMeta, AuditResult } from '../../types/index.js';

export class SeoOpenGraphAudit extends Audit {
  public static override meta: AuditMeta = {
    id: 'seo-open-graph',
    title: 'Open Graph and social snippet metadata are properly configured',
    failureTitle: 'Open Graph or social snippet tags are incomplete',
    description:
      'Social media platforms and generative chat interfaces (ChatGPT, iMessage, Slack, LinkedIn) use Open Graph tags (og:title, og:description, og:image) to build rich content cards.',
    requiredArtifacts: ['MetaTags'],
  };

  public static override async audit(artifacts: Artifacts): Promise<AuditResult> {
    const og = artifacts.MetaTags.openGraph || {};
    const twitter = artifacts.MetaTags.twitterCard || {};

    const hasOgTitle = Boolean(og['og:title'] || og.title);
    const hasOgDesc = Boolean(og['og:description'] || og.description);
    const hasOgImage = Boolean(og['og:image'] || og.image);
    const hasTwitterCard = Boolean(twitter['twitter:card'] || twitter.card);

    const missing: string[] = [];
    if (!hasOgTitle) missing.push('og:title');
    if (!hasOgDesc) missing.push('og:description');
    if (!hasOgImage) missing.push('og:image');
    if (!hasTwitterCard) missing.push('twitter:card');

    let score = 1;
    if (missing.length === 4) {
      score = 0;
    } else if (missing.length > 0) {
      score = Number((1 - (missing.length * 0.25)).toFixed(2));
    }

    return this.generateAuditResult({
      score,
      displayValue:
        missing.length === 0
          ? 'Social snippet tags complete (og:title, og:desc, og:image, twitter:card)'
          : `Missing: ${missing.join(', ')}`,
      details: this.makeTableDetails(
        [
          { key: 'tag', label: 'Tag', valueType: 'text' },
          { key: 'value', label: 'Value', valueType: 'text' },
          { key: 'status', label: 'Status', valueType: 'text' },
        ],
        [
          { tag: 'og:title', value: og['og:title'] || og.title || '(none)', status: hasOgTitle ? 'Present' : 'Missing' },
          { tag: 'og:description', value: og['og:description'] || og.description || '(none)', status: hasOgDesc ? 'Present' : 'Missing' },
          { tag: 'og:image', value: og['og:image'] || og.image || '(none)', status: hasOgImage ? 'Present' : 'Missing' },
          { tag: 'twitter:card', value: twitter['twitter:card'] || twitter.card || '(none)', status: hasTwitterCard ? 'Present' : 'Missing' },
        ]
      ),
    });
  }
}

/**
 * @fileoverview Audit validating that links are crawlable and have descriptive anchor text.
 */

import { Audit } from '../audit.js';
import type { Artifacts, AuditMeta, AuditResult } from '../../types/index.js';

export class SeoCrawlableLinksAudit extends Audit {
  public static override meta: AuditMeta = {
    id: 'seo-crawlable-links',
    title: 'Links are crawlable and have descriptive anchor text',
    failureTitle: 'Some links are not crawlable or lack descriptive text',
    description:
      'Search crawlers and AI bots discover related pages through crawlable anchor tags with valid href attributes and descriptive text.',
    requiredArtifacts: ['Links'],
  };

  public static override async audit(artifacts: Artifacts): Promise<AuditResult> {
    const links = artifacts.Links;

    if (links.totalLinks === 0) {
      return this.generateAuditResult({
        score: 1,
        scoreDisplayMode: 'informative',
        displayValue: 'No links found on page',
      });
    }

    const total = links.totalLinks;
    const nonCrawlable = links.nonCrawlableCount;
    const missingText = links.missingTextCount;

    let deductions = 0;
    if (nonCrawlable > 0) {
      deductions += Math.min(0.5, (nonCrawlable / total) * 0.7);
    }
    if (missingText > 0) {
      deductions += Math.min(0.4, (missingText / total) * 0.6);
    }

    const score = this.clampScore(1 - deductions);

    const issues: string[] = [];
    if (nonCrawlable > 0) issues.push(`${nonCrawlable} non-crawlable link${nonCrawlable > 1 ? 's' : ''}`);
    if (missingText > 0) issues.push(`${missingText} link${missingText > 1 ? 's' : ''} without descriptive text`);

    const summaryText = `${links.totalLinks} links (${links.internalLinksCount} internal, ${links.externalLinksCount} external)`;

    return this.generateAuditResult({
      score,
      displayValue: issues.length === 0 ? `All ${summaryText} are crawlable` : `${summaryText} — ${issues.join(', ')}`,
      explanation:
        issues.length > 0
          ? 'Links using javascript: voids or lacking anchor text hinder search engine crawl graphs and PageRank distribution.'
          : undefined,
      details: this.makeTableDetails(
        [
          { key: 'metric', label: 'Link Metric', valueType: 'text' },
          { key: 'count', label: 'Count', valueType: 'numeric' },
        ],
        [
          { metric: 'Total Links', count: links.totalLinks },
          { metric: 'Internal Links', count: links.internalLinksCount },
          { metric: 'External Links', count: links.externalLinksCount },
          { metric: 'Non-crawlable Links', count: links.nonCrawlableCount },
          { metric: 'Missing Text Links', count: links.missingTextCount },
        ]
      ),
    });
  }
}

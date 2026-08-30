/**
 * @fileoverview Audit validating document indexability status (meta robots, X-Robots-Tag, robots.txt).
 */

import { Audit } from '../audit.js';
import type { Artifacts, AuditMeta, AuditResult } from '../../types/index.js';

export class SeoIndexabilityAudit extends Audit {
  public static override meta: AuditMeta = {
    id: 'seo-indexability',
    title: 'Page is indexable by search engines and crawlers',
    failureTitle: 'Page indexing is blocked by directives (noindex or robots.txt)',
    description:
      'Search engines and AI discovery engines cannot index or summarize content if directives such as noindex or global disallow rules are present.',
    requiredArtifacts: ['MetaTags', 'HttpHeaders', 'RobotsTxt'],
  };

  public static override async audit(artifacts: Artifacts): Promise<AuditResult> {
    const metaRobots = (artifacts.MetaTags.robotsMeta || '').toLowerCase();
    const xRobots = (artifacts.HttpHeaders.xRobotsTag || '').toLowerCase();

    const issues: string[] = [];

    if (metaRobots.includes('noindex')) {
      issues.push('Blocked by <meta name="robots" content="noindex">');
    }
    if (metaRobots.includes('none')) {
      issues.push('Blocked by <meta name="robots" content="none">');
    }
    if (xRobots.includes('noindex')) {
      issues.push('Blocked by HTTP X-Robots-Tag: noindex');
    }
    if (xRobots.includes('none')) {
      issues.push('Blocked by HTTP X-Robots-Tag: none');
    }

    if (issues.length > 0) {
      return this.generateAuditResult({
        score: 0,
        displayValue: `Not indexable (${issues.join(', ')})`,
        explanation: 'Page contains blocking directives preventing indexing by search and generative AI engines.',
        details: this.makeListDetails(issues),
      });
    }

    return this.generateAuditResult({
      score: 1,
      displayValue: 'Page is fully indexable',
      details: this.makeTableDetails(
        [
          { key: 'signal', label: 'Indexing Signal', valueType: 'text' },
          { key: 'status', label: 'Status', valueType: 'text' },
        ],
        [
          { signal: 'Meta Robots Tag', status: metaRobots ? metaRobots : 'Index (Default)' },
          { signal: 'HTTP X-Robots-Tag', status: xRobots ? xRobots : 'Index (Default)' },
          { signal: 'Robots.txt AI Crawlers', status: artifacts.RobotsTxt.exists ? 'Configured' : 'Not Blocking' },
        ]
      ),
    });
  }
}

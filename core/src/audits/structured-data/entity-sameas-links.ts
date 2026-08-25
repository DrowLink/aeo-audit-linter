/**
 * @fileoverview Audit evaluating entity disambiguation sameAs links for Knowledge Graphs
 */

import { Audit } from '../audit.js';
import type { Artifacts, AuditMeta, AuditResult } from '../../types/index.js';

export class EntitySameAsLinksAudit extends Audit {
  public static override meta: AuditMeta = {
    id: 'entity-sameas-links',
    title: 'Defines sameAs properties for Knowledge Graph entity disambiguation',
    failureTitle: 'No sameAs links found in structured data',
    description:
      'The `sameAs` property (linking to Wikidata, Wikipedia, Crunchbase, or official profiles) connects your brand and topics to verified entities in LLM Knowledge Graphs.',
    requiredArtifacts: ['JSONLD'],
  };

  public static override async audit(artifacts: Artifacts): Promise<AuditResult> {
    const jsonld = artifacts.JSONLD;
    const sameAsUrls = jsonld.sameAsUrls;

    const hasSameAs = sameAsUrls.length > 0;
    const score = hasSameAs ? 1 : 0.4;

    const tableItems = sameAsUrls.map((url) => {
      let authority = 'External Authority Link';
      if (url.includes('wikidata.org')) authority = 'Wikidata (High Confidence)';
      else if (url.includes('wikipedia.org')) authority = 'Wikipedia (High Confidence)';
      else if (url.includes('linkedin.com') || url.includes('twitter.com') || url.includes('x.com')) authority = 'Official Social Profile';

      return {
        url,
        type: authority,
      };
    });

    return this.generateAuditResult({
      score,
      displayValue: hasSameAs ? `${sameAsUrls.length} sameAs link(s) found` : 'No sameAs links found',
      details: hasSameAs
        ? this.makeTableDetails(
            [
              { key: 'url', label: 'sameAs URL', valueType: 'url' },
              { key: 'type', label: 'Entity Type', valueType: 'text' },
            ],
            tableItems
          )
        : undefined,
    });
  }
}

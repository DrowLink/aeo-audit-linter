/**
 * @fileoverview Audit evaluating presence of high-value schemas for RAG & Answer Engines
 */

import { Audit } from '../audit.js';
import type { Artifacts, AuditMeta, AuditResult } from '../../types/index.js';

export class RagSchemaPresenceAudit extends Audit {
  public static override meta: AuditMeta = {
    id: 'rag-schema-presence',
    title: 'Page implements RAG-optimized JSON-LD schemas (FAQPage, HowTo, Article)',
    failureTitle: 'Missing high-value structured schemas for RAG',
    description:
      'Schemas like FAQPage, HowTo, QAPage, and Article enable Answer Engines to extract Q&A pairs and step-by-step information directly into synthesized answers.',
    requiredArtifacts: ['JSONLD'],
  };

  public static override async audit(artifacts: Artifacts): Promise<AuditResult> {
    const jsonld = artifacts.JSONLD;

    const ragSchemas = [
      { name: 'FAQPage', present: jsonld.hasFAQPage, value: 'Direct Q&A pairs' },
      { name: 'HowTo / QAPage', present: jsonld.hasHowTo || jsonld.hasQAPage, value: 'Step-by-step instructional procedures' },
      { name: 'Article / TechArticle', present: jsonld.hasArticle, value: 'Authorship and content metadata' },
      { name: 'Organization / Product', present: jsonld.hasOrganization || jsonld.hasProduct, value: 'Business entity / product metadata' },
    ];

    const presentCount = ragSchemas.filter((s) => s.present).length;
    let score = 0;
    if (presentCount >= 2) {
      score = 1;
    } else if (presentCount === 1) {
      score = 0.7;
    } else {
      score = 0.2;
    }

    const tableItems = ragSchemas.map((s) => ({
      schema: s.name,
      status: s.present ? 'Implemented' : 'Not found',
      benefit: s.value,
    }));

    return this.generateAuditResult({
      score,
      displayValue: `${presentCount} RAG schema type(s) detected`,
      details: this.makeTableDetails(
        [
          { key: 'schema', label: 'Schema Type', valueType: 'code' },
          { key: 'status', label: 'Status', valueType: 'status' },
          { key: 'benefit', label: 'Impact on RAG / AEO', valueType: 'text' },
        ],
        tableItems
      ),
    });
  }
}

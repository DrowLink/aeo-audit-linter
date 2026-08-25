/**
 * @fileoverview Audit validating the syntax and integrity of JSON-LD schema blocks
 */

import { Audit } from '../audit.js';
import type { Artifacts, AuditMeta, AuditResult } from '../../types/index.js';

export class JsonLdSyntaxValidityAudit extends Audit {
  public static override meta: AuditMeta = {
    id: 'jsonld-syntax-validity',
    title: 'All JSON-LD blocks have valid, error-free syntax',
    failureTitle: 'Syntax errors detected in JSON-LD structured data blocks',
    description:
      'Malformed JSON prevents Answer Engine parsers and RAG pipelines from extracting structured entity information.',
    requiredArtifacts: ['JSONLD'],
  };

  public static override async audit(artifacts: Artifacts): Promise<AuditResult> {
    const jsonld = artifacts.JSONLD;

    if (jsonld.items.length === 0) {
      return this.generateAuditResult({
        score: 0.5,
        displayValue: 'No JSON-LD structured data blocks found on page',
        explanation: 'Adding Schema.org structured data via <script type="application/ld+json"> is recommended.',
      });
    }

    const invalidItems = jsonld.items.filter((item) => !item.isValid);
    const validCount = jsonld.items.length - invalidItems.length;
    const score = validCount / jsonld.items.length;

    const tableItems = jsonld.items.map((item, idx) => ({
      index: idx + 1,
      type: item.type ? (Array.isArray(item.type) ? item.type.join(', ') : item.type) : 'Unknown',
      status: item.isValid ? 'Valid' : 'Syntax Error',
      error: item.syntaxErrors ? item.syntaxErrors.join('; ') : 'None',
    }));

    return this.generateAuditResult({
      score,
      displayValue: `${validCount} of ${jsonld.items.length} JSON-LD blocks are valid`,
      details: this.makeTableDetails(
        [
          { key: 'index', label: '#', valueType: 'numeric' },
          { key: 'type', label: '@type', valueType: 'code' },
          { key: 'status', label: 'Status', valueType: 'status' },
          { key: 'error', label: 'Detail', valueType: 'text' },
        ],
        tableItems
      ),
    });
  }
}

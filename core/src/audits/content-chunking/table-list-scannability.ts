/**
 * @fileoverview Audit verifying the presence and quality of structured tables and lists for fast LLM extraction.
 */

import { Audit } from '../audit.js';
import type { Artifacts, AuditMeta, AuditResult } from '../../types/index.js';

export class TableListScannabilityAudit extends Audit {
  public static override meta: AuditMeta = {
    id: 'table-list-scannability',
    title: 'Content leverages structured HTML tables and lists for rapid LLM extraction',
    failureTitle: 'Content lacks structured tables or lists for quick answer extraction',
    description:
      'Generative Answer Engines (SearchGPT, Perplexity, Gemini) strongly prioritize bulleted lists (<ul>/<ol>) and semantic comparison tables (<table>) over dense walls of text for extraction.',
    requiredArtifacts: ['ContentChunks'],
  };

  public static override async audit(artifacts: Artifacts): Promise<AuditResult> {
    const {
      chunks,
      totalWordCount,
      totalTablesCount,
      totalListsCount,
      totalListItemsCount,
      structuredTablesCount,
    } = artifacts.ContentChunks;

    // Small or landing pages with minimal content don't require heavy tables/lists
    if (totalWordCount < 150) {
      return this.generateAuditResult({
        score: 1,
        displayValue: 'Brief page (tables/lists optional)',
        explanation: 'Page has concise content under 150 words where extensive lists or tables are not strictly required.',
      });
    }

    const chunksWithListOrTable = chunks.filter((c) => c.hasList || c.hasTable).length;

    let score = 0.5;
    let statusText = 'Needs Improvement';

    if (totalTablesCount > 0 && totalListsCount > 0) {
      score = 1.0;
      statusText = 'Excellent (Tables & Lists present)';
    } else if (totalTablesCount > 0 || totalListsCount >= 2) {
      score = 0.9;
      statusText = 'Good (Structured elements detected)';
    } else if (totalListsCount === 1 && totalListItemsCount >= 3) {
      score = 0.8;
      statusText = 'Acceptable (Single list detected)';
    } else if (totalTablesCount === 0 && totalListsCount === 0) {
      if (totalWordCount > 500) {
        score = 0.3;
        statusText = 'Dense wall of text (0 tables, 0 lists)';
      } else {
        score = 0.5;
        statusText = 'No structured tables or lists found';
      }
    }

    const summaryTable = [
      {
        metric: 'Tables (<table>)',
        count: String(totalTablesCount),
        details: structuredTablesCount > 0 ? `${structuredTablesCount} with semantic <th>/<thead> headers` : 'No semantic <th> headers',
      },
      {
        metric: 'Lists (<ul>/<ol>)',
        count: String(totalListsCount),
        details: `${totalListItemsCount} total <li> bullet/numbered item(s)`,
      },
      {
        metric: 'Content Chunks with Structures',
        count: `${chunksWithListOrTable} / ${chunks.length}`,
        details: `${Math.round((chunksWithListOrTable / (chunks.length || 1)) * 100)}% of content blocks contain structured data`,
      },
    ];

    return this.generateAuditResult({
      score,
      displayValue: `${totalTablesCount} table(s), ${totalListsCount} list(s) (${totalListItemsCount} items)`,
      explanation: score < 0.8
        ? 'Breaking continuous paragraphs into bulleted lists or comparison tables improves Answer Engine parsing and citation rate.'
        : undefined,
      details: this.makeTableDetails(
        [
          { key: 'metric', label: 'Structured Element', valueType: 'text' },
          { key: 'count', label: 'Detected Count', valueType: 'text' },
          { key: 'details', label: 'Structure Quality', valueType: 'text' },
        ],
        summaryTable
      ),
    });
  }
}
